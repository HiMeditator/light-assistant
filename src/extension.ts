import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MainViewProvider } from './views/MainViewProvider';
export function activate(context: vscode.ExtensionContext) {
    const configUri = vscode.Uri.joinPath(context.globalStorageUri, "config.json");
    const configSettings = vscode.workspace.getConfiguration('lightAssistant');

    const gotoSettings = vscode.commands.registerCommand('light-assistant.goto.settings', () => {
        let info = configSettings.get<string>('test.string');
        if(!info){
            info = '';
        }
        vscode.window.showInformationMessage(info);
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:HiMeditator.light-assistant');
    });
    context.subscriptions.push(gotoSettings);

    const gotoConfig = vscode.commands.registerCommand('light-assistant.goto.config', () => {
        if(!fs.existsSync(context.globalStorageUri.fsPath)){
            fs.mkdirSync(context.globalStorageUri.fsPath);
        }
        if(!fs.existsSync(configUri.fsPath)){
            fs.writeFileSync(configUri.fsPath, `{\n  "models": []\n}`);
            vscode.window.showInformationMessage(`Config file created: ${configUri.fsPath}`);
        }
        vscode.commands.executeCommand('vscode.open', configUri);
    });
    context.subscriptions.push(gotoConfig);

    const mainViewProvider = new MainViewProvider(
        context.extensionUri,
        configUri,
        context
    );
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MainViewProvider.viewType,
            mainViewProvider,
            {webviewOptions: {retainContextWhenHidden: true}}
        )
    );
}


export function deactivate() {}
