import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigFile } from '../utils/configFile';
import { RequestModel } from '../utils/requestModel';
import { updateConfigurations } from '../utils/configuration';

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
        const styleSheets = ['reset', 'vscode', 'popup', 'dialog', 'input'];
        const libs = ['autosize.min', 'markdown-it.min'];
        const scripts = ['commonUtils', 'handleRequests', 'sendRequests'];
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'assets/main.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
        // console.log(htmlContent);
        for(const styleSheet of styleSheets) {
            const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/', styleSheet + '.css'));
            htmlContent = htmlContent.replace(`{{${styleSheet}.css}}`, styleUri.toString());
        }
        for(const lib of libs) {
            const libUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/libs/', lib + '.js'));
            htmlContent = htmlContent.replace(`{{${lib}.js}}`, libUri.toString());
        }
        for(const script of scripts) {
            const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/js/', script + '.js'));
            htmlContent = htmlContent.replace(`{{${script}.js}}`, scriptUri.toString());
        }
        for(const icon in this.faIcons){
            htmlContent = htmlContent.replace(`{{i-${icon}}}`, this.faIcons[icon]);
        }
        // console.log(htmlContent);
        return htmlContent;
    }
}