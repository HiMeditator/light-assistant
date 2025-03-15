import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigFile } from './classes/configFile';
import { RequestModel } from './classes/requestModel';
import { MainViewProvider } from './views/MainViewProvider';

let faIcons: any;
let configFile: ConfigFile;
let requestModel: RequestModel;


export function activate(context: vscode.ExtensionContext) {

    const configUri = vscode.Uri.joinPath(context.globalStorageUri, "config.json");
    const chatLogFolderUri = vscode.Uri.joinPath(context.globalStorageUri, "chatLogs");
    const faPath = vscode.Uri.joinPath(context.extensionUri, '/assets/icon/font-awesome.json').fsPath;
    faIcons = JSON.parse(fs.readFileSync(faPath, 'utf8'));
    configFile = new ConfigFile(configUri, context);
    requestModel = new RequestModel(chatLogFolderUri);


    const mainViewProvider = new MainViewProvider(
        context.extensionUri,
        faIcons,
        configFile,
        requestModel
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

    const logsView = vscode.commands.registerCommand('light-assistant.logs.view', () => {
        console.log(chatLogFolderUri.fsPath);
        vscode.commands.executeCommand('revealFileInOS', chatLogFolderUri);
    });
    context.subscriptions.push(logsView);

    const chatNew = vscode.commands.registerCommand('light-assistant.chat.new', () => {
        mainViewProvider.newChatSession();
    });
    context.subscriptions.push(chatNew);

}


export function deactivate() {
    requestModel.saveChatLog();
}
