/*-----------------------------------------------------------
 *  Author: HiMeditator
 *  Licensed under the MIT License.
 * See LICENSE in the project root for license information.
 *-----------------------------------------------------------*/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';

import { ConfigFile } from './classes/configFile';
import { RequestModel } from './classes/requestModel';
import { ChatSessions } from './classes/chatSessions'
import { MainViewProvider } from './views/MainViewProvider';

let faIcons: any;
let configFile: ConfigFile;
let requestModel: RequestModel;
let chatSessions: ChatSessions;

export function activate(context: vscode.ExtensionContext) {

    const pluginDir = vscode.Uri.joinPath(vscode.Uri.file(os.homedir()),'/.light-assistant');
    const configUri = vscode.Uri.joinPath(pluginDir, "config.json");
    const sessionDirUri = vscode.Uri.joinPath(pluginDir, "sessions");
    const sessionManifestUri = vscode.Uri.joinPath(sessionDirUri, 'manifest.json');
    const faPath = vscode.Uri.joinPath(context.extensionUri, '/assets/icon/font-awesome.json').fsPath;
    faIcons = JSON.parse(fs.readFileSync(faPath, 'utf8'));
    configFile = new ConfigFile(configUri, context);
    requestModel = new RequestModel(sessionDirUri);
    chatSessions = new ChatSessions(sessionDirUri, sessionManifestUri, requestModel);

    const mainViewProvider = new MainViewProvider(
        context.extensionUri,
        faIcons,
        configFile,
        requestModel,
        chatSessions
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MainViewProvider.viewType,
            mainViewProvider,
            {webviewOptions: {retainContextWhenHidden: true}}
        )
    );


    const configurationChange = vscode.workspace.onDidChangeConfiguration(event =>{
        if(event.affectsConfiguration('lightAssistant')){
            mainViewProvider.updateConfiguration();
        }
    });
    context.subscriptions.push(configurationChange);


    const gotoSettings = vscode.commands.registerCommand('light-assistant.goto.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:HiMeditator.light-assistant');
    });
    context.subscriptions.push(gotoSettings);

    const gotoConfig = vscode.commands.registerCommand('light-assistant.goto.config', () => {
        vscode.commands.executeCommand('vscode.open', configUri);
    });
    context.subscriptions.push(gotoConfig);

    const sessionsLoad = vscode.commands.registerCommand('light-assistant.sessions.load', () => {
        // vscode.commands.executeCommand('revealFileInOS', sessionDirUri);
        const quickPick = vscode.window.createQuickPick();
        let sessionItems = [];
        for (const session of chatSessions.manifest){
            sessionItems.push({
                label: session.name,
                description: `$(symbol-folder)${session.workspace}`,
                detail: session.overview,
                buttons: [{iconPath: new vscode.ThemeIcon('trash'), tooltip: 'Delete Session'}]
            });
        }
        quickPick.items = sessionItems;
        quickPick.onDidChangeSelection(selection => {
            // console.log(selection);
            if(selection[0]){
                mainViewProvider.loadChatSession(selection[0].label);
                quickPick.dispose();
            }
        });
        quickPick.onDidTriggerItemButton((event) => {
            if (event.button.tooltip === 'Delete Session') {
                mainViewProvider.deleteChatSession(event.item.label);
                sessionItems = [];
                for (const session of chatSessions.manifest){
                    sessionItems.push({
                        label: session.name,
                        description: `$(symbol-folder)${session.workspace}`,
                        detail: session.overview,
                        buttons: [{iconPath: new vscode.ThemeIcon('trash'), tooltip: 'Delete Session'}]
                    });
                }
                quickPick.items = sessionItems;
            }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    });
    context.subscriptions.push(sessionsLoad);

    const chatNew = vscode.commands.registerCommand('light-assistant.chat.new', () => {
        mainViewProvider.newChatSession();
    });
    context.subscriptions.push(chatNew);

}


export function deactivate() {
    chatSessions.saveChatSession();
    chatSessions.saveManifest();
}
