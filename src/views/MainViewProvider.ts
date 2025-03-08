import * as vscode from 'vscode';
import ollama from 'ollama';

export class MainViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'light-assistant.main';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri
    ) {}

    private async _handlePrompt(prompt: string, webviewView: vscode.WebviewView) {
        webviewView.webview.postMessage({command: 'response.new'});
        const message = { role: 'user', content: prompt };
        const response = await ollama.chat({
            model: 'qwen2.5',
            messages: [message],
            stream: true
        });
        for await (const part of response) {
            webviewView.webview.postMessage({
                command: 'response.stream',
                data: part.message.content
            });
        }
        webviewView.webview.postMessage({command: 'response.end'});
    }
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
        webviewView.webview.onDidReceiveMessage(message => {
            // console.log(message);
            switch (message.command) {
                case 'prompt':
                    this._handlePrompt(message.prompt, webviewView);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleReset = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/reset.css'));
        const styleVSCode = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/vscode.css'));
        const styleDialog = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/dialog.css'));
        const styleInput = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/input.css'));
        const libScriptAutoSize = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/libs/autosize.min.js'));
        const libScriptMarkdownIt = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/libs/markdown-it.min.js'));
        const scriptDomUtil = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/domUtil.js'));
        const scriptHandleRequest = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/handleRequest.js'));
        const scriptSendRequest = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/sendRequest.js'));

        return `<!DOCTYPE html>
        <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleReset}" rel="stylesheet">
            <link href="${styleVSCode}" rel="stylesheet">
            <link href="${styleDialog}" rel="stylesheet">
            <link href="${styleInput}" rel="stylesheet">
            <script src="${libScriptAutoSize}"></script>
            <script src="${libScriptMarkdownIt}"></script>
            <title>Light Assistant</title>
        </head>
        <body>
            <div id="div-dialog">
            </div>
            <div id="div-input">
                <textarea id="ta-prompt-input" placeholder="What can I do for you..."></textarea>
                <div id="div-options">
                    <div id="model-select">
                        <ul id="model-option">
                        </ul>
                        <span id="model-selected">
                            <span id="model-selected-value">Select model</span>
                            <svg viewBox="0 0 448 512"><path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/></svg>
                        </span>
                    </div>
                    <div id="send-prompt">
                        <span id="send-note">Ctrl+Enter</span>
                        <svg viewBox="0 0 448 512"><path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/></svg>
                    </div>
                </div>
            </div>
            <script src="${scriptDomUtil}"></script>
            <script src="${scriptSendRequest}"></script>
            <script src="${scriptHandleRequest}"></script>
        </body>
        </html>`;
    }
}