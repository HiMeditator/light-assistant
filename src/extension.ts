/*-----------------------------------------------------------
 *  Author: HiMeditator
 *  Licensed under the MIT License.
 * See LICENSE in the project root for license information.
 *-----------------------------------------------------------*/

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';

import { LangDict } from './classes/langDict';
import { RepoContext } from './classes/repoContext';
import { ConfigFile } from './classes/configFile';
import { RequestModel } from './classes/requestModel';
import { ChatSessions } from './classes/chatSessions';
import { MainViewProvider } from './views/MainViewProvider';

let faIcons: any;
let repoContext: RepoContext;
let configFile: ConfigFile;
let requestModel: RequestModel;
let chatSessions: ChatSessions;

export function activate(context: vscode.ExtensionContext) {

    LangDict.instance(context.extensionUri);
    
    const pluginDir = vscode.Uri.joinPath(vscode.Uri.file(os.homedir()),'/.light-assistant');

    const configUri = vscode.Uri.joinPath(pluginDir, "config.json");
    const sessionDirUri = vscode.Uri.joinPath(pluginDir, "sessions");
    const sessionManifestUri = vscode.Uri.joinPath(sessionDirUri, 'manifest.json');
    const faPath = vscode.Uri.joinPath(context.extensionUri, '/assets/icon/font-awesome.json').fsPath;
    
    faIcons = JSON.parse(fs.readFileSync(faPath, 'utf8'));
    repoContext = new RepoContext();
    configFile = new ConfigFile(configUri, context);
    requestModel = new RequestModel(sessionDirUri, repoContext);
    ChatSessions.context = context;
    chatSessions = new ChatSessions(sessionDirUri, sessionManifestUri, requestModel);

    const mainViewProvider = new MainViewProvider(
        context.extensionUri,
        faIcons,
        repoContext,
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

    const configurationChange = vscode.workspace.onDidChangeConfiguration(event => {
        if(event.affectsConfiguration('lightAssistant.sendRequestShortcut')){
            mainViewProvider.updateConfiguration();
        }
        else if(event.affectsConfiguration('lightAssistant.displayInfoMessage')){
            mainViewProvider.updateConfiguration();
        }
    });
    context.subscriptions.push(configurationChange);

    const addTextEditor = vscode.window.onDidChangeActiveTextEditor(editor => {
        if(editor === undefined) { return; }
        repoContext.includeTextEditors[editor.document.uri.fsPath] = editor;
    });
    context.subscriptions.push(addTextEditor);

    const gotoSettings = vscode.commands.registerCommand('light-assistant.goto.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:himeditator.light-assistant');
    });
    context.subscriptions.push(gotoSettings);

    const gotoConfig = vscode.commands.registerCommand('light-assistant.goto.config', () => {
        vscode.commands.executeCommand('vscode.open', configUri);
    });
    context.subscriptions.push(gotoConfig);

    const sessionsLoad = vscode.commands.registerCommand('light-assistant.load.sessions', () => {
        // vscode.commands.executeCommand('revealFileInOS', sessionDirUri);
        const quickPick = vscode.window.createQuickPick();
        let sessionItems = [];
        for (let i = chatSessions.manifest.length - 1; i >= 0; i--){
            const session = chatSessions.manifest[i];
            sessionItems.push({
                label: session.overview,
                description: `$(clock) ${session.update}  $(folder) ${session.workspace}`,
                detail: session.name,
                buttons: [{iconPath: new vscode.ThemeIcon('trash'), tooltip: LangDict.get('ts.deleteSession')}]
            });
        }
        quickPick.items = sessionItems;
        quickPick.onDidChangeSelection(selection => {
            if(selection[0]){
                mainViewProvider.loadChatSession(selection[0].detail || '');
                quickPick.dispose();
            }
        });
        quickPick.onDidTriggerItemButton((event) => {
            if (event.button.tooltip === LangDict.get('ts.deleteSession')) {
                mainViewProvider.deleteChatSession(event.item.detail || '');
                sessionItems = [];
                for (let i = chatSessions.manifest.length - 1; i >= 0; i--){
                    const session = chatSessions.manifest[i];
                    sessionItems.push({
                        label: session.overview,
                        description: `$(clock) ${session.update}  $(folder) ${session.workspace}`,
                        detail: session.name,
                        buttons: [{iconPath: new vscode.ThemeIcon('trash'), tooltip: LangDict.get('ts.deleteSession')}]
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
    chatSessions.syncManifestWithFiles();
    chatSessions.saveManifest();
}
