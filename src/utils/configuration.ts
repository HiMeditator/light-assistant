import exp from 'constants';
import * as vscode from 'vscode';

export function updateConfigurations(view?: vscode.WebviewView) {
    const config = vscode.workspace.getConfiguration('lightAssistant');
    const sendRequestShortcut = config.get<string>('sendRequestShortcut');
    const displayInfoMessage = config.get<boolean>('displayInfoMessage');
    const configurations = {
        'sendRequestShortcut': sendRequestShortcut,
        'displayInfoMessage': displayInfoMessage
    };
    // console.log(configurations);
    view?.webview.postMessage({
        command: 'update.configurations',
        configurations: JSON.stringify(configurations)
    });
}