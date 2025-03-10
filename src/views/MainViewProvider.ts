import * as vscode from 'vscode';
import { ConfigFile } from '../utils/configFile';
import { RequestModel } from '../utils/requestModel';
import { updateConfigurations } from '../utils/configuration'
export class MainViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'light-assistant.main';
    private _view?: vscode.WebviewView;
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private faIcons: any,
        private configFile: ConfigFile,
        private requestModel: RequestModel
    ) {}

    public updateConfiguration() {
        updateConfigurations(this._view);
    }

    public newChatSession() {
        this.requestModel.newChatSession(this._view);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [ this._extensionUri ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        this.configFile.updateModelListFromConfig(this._view);
        this.updateConfiguration();

        webviewView.webview.onDidReceiveMessage(message => {
            console.log(message);
            switch (message.command) {
                case 'error.noModel':
                    vscode.window.showErrorMessage("No model selected, please select a model first.");
                    break;
                case 'user.request':
                    this.requestModel.handelRequest(message.prompt, message.model, this._view);
                    break;
                case 'models.load':
                    this.configFile.updateModelListFromConfig(this._view);
                    vscode.commands.executeCommand('light-assistant.goto.config');
                    break;
                case 'model.select':
                    this.configFile.updateCurrentModel(message.model);
                    break;
                case 'model.add':
                    this.configFile.addModelToConfig(message.modelData, this._view);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleReset = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/reset.css'));
        const styleVSCode = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/vscode.css'));
        const styleDialog = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/dialog.css'));
        const styleInput = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/input.css'));
        const styleCenter = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/center.css'));
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
            <link href="${styleCenter}" rel="stylesheet">
            <script src="${libScriptAutoSize}"></script>
            <script src="${libScriptMarkdownIt}"></script>
            <title>Light Assistant</title>
        </head>
        <body>
            <div class="div-center" id="div-add-model">
                <form id="add-model-form">
                    <div id="model-form-title">Add Model</div>
                    <div id="option-note">
                        <p id="option-openai-note">The model you provided needs to be compatible with the OpenAI API.</p>
                        <p id="option-ollama-note">Please confirm that you have installed Ollama locally and configured the corresponding model.</p>
                    </div>
                    <div class="div-form-radio">
                        <div id="option-openai">
                            <svg viewBox="0 0 512 512"><path d="${this.faIcons['hexagon-node']}"/></svg>
                            openai
                        </div>
                        <div id="option-ollama">
                            <svg viewBox="0 0 512 512"><path d="${this.faIcons['circle-nodes']}"/></svg>
                            ollama
                        </div>
                    </div>
                    <div class="div-form-entry">
                        <label for="i-model">model</label>
                        <input type="text" id="i-model" name="model" required>
                    </div>
                    <div class="div-form-entry">
                        <label for="i-title">title</label>
                        <input type="text" id="i-title" name="title">
                    </div>
                    <div id="div-url-input" class="div-form-entry">
                        <label for="i-base_url">base_url</label>
                        <input type="text" id="i-base_url" name="base_url" required><br>
                    </div>
                    <div id="div-api-input" class="div-form-entry">
                        <label for="i-api_key">api_key</label>
                        <input type="text" id="i-api_key" name="api_key" required><br>
                    </div>
                    <button id="btn-add-submit">Submit</button>
                    <button id="btn-add-cancel">Cancel</button>
                </form>
            </div>
            <div id="div-dialog">
            </div>
            <div id="div-input">
                <textarea id="ta-prompt-input" placeholder="What can I do for you..."></textarea>
                <div id="div-options">
                    <div id="model-select">
                        <div id="model-option">
                            <ul id="model-list">
                            </ul>
                            <div id="add-model">
                                <svg viewBox="0 0 448 512"><path d="${this.faIcons['plus']}"/></svg>
                                Add Model
                            </div>
                            <div id="load-config">
                                <svg viewBox="0 0 512 512"><path d="${this.faIcons['rotate-right']}"/></svg>
                                Load Config
                            </div>
                        </div>
                        <span id="model-selected">
                            <span id="model-selected-value">Select model</span>
                            <svg viewBox="0 0 448 512"><path d="${this.faIcons['arrow-down']}"/></svg>
                        </span>
                    </div>
                    <div id="send-prompt">
                        <span id="send-note"></span>
                        <svg viewBox="0 0 448 512"><path d="${this.faIcons['right-arrow']}"/></svg>
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