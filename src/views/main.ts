import * as vscode from 'vscode';

export class MainViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'light-assistant.main';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(message => {});
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/vscode.css'));
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <title>Light Assistant</title>
            </head>
            <body>
                Hello World.
            </body>
            </html>`;
    }
}