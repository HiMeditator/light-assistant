import * as vscode from 'vscode';
import { MainViewProvider } from './views/main';

export let extensionPath: string;

export function activate(context: vscode.ExtensionContext) {
    const mainViewProvider = new MainViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            MainViewProvider.viewType,
            mainViewProvider,
            {webviewOptions: {retainContextWhenHidden: true}}
        )
    );
}


export function deactivate() {}
