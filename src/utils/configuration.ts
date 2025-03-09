import * as vscode from 'vscode';

export function updateConfigurations(view?: vscode.WebviewView) {
    const config = vscode.workspace.getConfiguration('lightAssistant');
    const sendRequestShortcut = config.get<string>('sendRequestShortcut');
    const configurations = {
        'sendRequestShortcut': sendRequestShortcut
    };
    console.log(configurations);
    view?.webview.postMessage({
        command: 'update.configurations',
        configurations: JSON.stringify(configurations)
    });
}