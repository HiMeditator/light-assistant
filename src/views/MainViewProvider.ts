import * as vscode from 'vscode';
import * as fs from 'fs';
import ollama from 'ollama';
import OpenAI from 'openai';

export class MainViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'light-assistant.main';
    private _view?: vscode.WebviewView;
    private _faIcons: any;
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _configUrl: vscode.Uri,
        private readonly _context: vscode.ExtensionContext
    ) {
        const faPath = vscode.Uri.joinPath(this._extensionUri, '/assets/icon/font-awesome.json').fsPath;
        this._faIcons = JSON.parse(fs.readFileSync(faPath, 'utf8'));
    }

    private async _useOllama(prompt: string, model: string) {
        this._view?.webview.postMessage({command: 'response.new'});
        const message = { role: 'user', content: prompt };
        const response = await ollama.chat({
            model: model,
            messages: [message],
            stream: true
        });
        for await (const part of response) {
            this._view?.webview.postMessage({
                command: 'response.stream',
                data: part.message.content
            });
        }
        this._view?.webview.postMessage({command: 'response.end'});
    }

    private async _useOpenAI(prompt: string, model: string, base_url: string, api_key: string) {
        this._view?.webview.postMessage({command: 'response.new'});
        const message = { role: 'user', content: prompt };
        const openai = new OpenAI({
            apiKey: api_key,
            baseURL: base_url
        });
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            stream: true,
        });
        for await (const chunk of completion) {
            console.log(chunk['choices'][0]['delta']);
            let content = ('reasoning_content' in chunk['choices'][0]['delta']) ?
                chunk['choices'][0]['delta']['reasoning_content'] : 
                chunk['choices'][0]['delta']['content'];
            if(content === '') {
                content = chunk['choices'][0]['delta']['content'];
            }
            // let content = chunk['choices'][0]['delta']['content'];
            this._view?.webview.postMessage({
                command: 'response.stream',
                data: content
            });
        }
        this._view?.webview.postMessage({command: 'response.end'});
    }
    private _handleUserRequest(prompt: string, modelStr: string) {
        if(modelStr === undefined || modelStr === ''){
            vscode.window.showErrorMessage('No model selected, please select a model first.');
            return;
        }
        const model = JSON.parse(modelStr);
        if(model['type'] === 'ollama'){
            this._useOllama(prompt, model['model']);
        }
        else{
            this._useOpenAI(prompt, model['model'], model['base_url'], model['api_key']);
        }
    }

    private _getConfigModels(alert: boolean = true) {
        if(!fs.existsSync(this._configUrl.fsPath)){
            if(alert) {
                vscode.window.showErrorMessage('Config file not found, please create one.');
            }
            return '';
        }
        let config;
        try {
            config = JSON.parse(fs.readFileSync(this._configUrl.fsPath, 'utf8'));
        } catch(error) {
            vscode.window.showErrorMessage('Config file is not valid JSON.');
            return '';
        }
        return JSON.stringify(config['models']);
    }

    public updateModelListFromConfig(alert: boolean = true) {
        const configModels = this._getConfigModels(alert);
        let currentModel = this._context.globalState.get<string>('model');
        if(currentModel === undefined){ currentModel = ''; }
        this._view?.webview.postMessage({
            command:'update.models',
            models: configModels,
            currentModel: currentModel,
            icon1: this._faIcons['circle-nodes'],
            icon2: this._faIcons['hexagon-node']
        });
        console.log('updateModelListFromConfig');
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
        console.log('resolveWebviewView begin');
        this.updateModelListFromConfig(false);
        console.log('resolveWebviewView');
        webviewView.webview.onDidReceiveMessage(message => {
            // console.log(message);
            switch (message.command) {
                case 'user.request':
                    this._handleUserRequest(message.prompt, message.model);
                    break;
                case 'models.load':
                    this.updateModelListFromConfig();
                    vscode.commands.executeCommand('light-assistant.goto.config');
                    break;
                case 'model.select':
                    this._context.globalState.update('model', message.model);
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
                        <div id="model-option">
                            <ul id="model-list">
                            </ul>
                            <div id="add-model">
                                <svg viewBox="0 0 448 512"><path d="${this._faIcons['plus']}"/></svg>
                                Add Model
                            </div>
                            <div id="load-config">
                                <svg viewBox="0 0 512 512"><path d="${this._faIcons['rotate-right']}"/></svg>
                                Load Config
                            </div>
                        </div>
                        <span id="model-selected">
                            <span id="model-selected-value">Select model</span>
                            <svg viewBox="0 0 448 512"><path d="${this._faIcons['arrow-down']}"/></svg>
                        </span>
                    </div>
                    <div id="send-prompt">
                        <span id="send-note">Ctrl+Enter</span>
                        <svg viewBox="0 0 448 512"><path d="${this._faIcons['right-arrow']}"/></svg>
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