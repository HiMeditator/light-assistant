import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigFile } from './utils/configFile';
import { RequestModel } from './utils/requestModel';
import { MainViewProvider } from './views/MainViewProvider';
export function activate(context: vscode.ExtensionContext) {
    const configUri = vscode.Uri.joinPath(context.globalStorageUri, "config.json");
    const faPath = vscode.Uri.joinPath(context.extensionUri, '/assets/icon/font-awesome.json').fsPath;
    const faIcons = JSON.parse(fs.readFileSync(faPath, 'utf8'));
    const configFile = new ConfigFile(configUri, context, faIcons['circle-nodes'], faIcons['hexagon-node']);
    const requestModel = new RequestModel();

    const gotoSettings = vscode.commands.registerCommand('light-assistant.goto.settings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', '@ext:HiMeditator.light-assistant');
    });
    context.subscriptions.push(gotoSettings);

    const gotoConfig = vscode.commands.registerCommand('light-assistant.goto.config', () => {
        vscode.commands.executeCommand('vscode.open', configUri);
    });
    context.subscriptions.push(gotoConfig);

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
}


export function deactivate() {}
