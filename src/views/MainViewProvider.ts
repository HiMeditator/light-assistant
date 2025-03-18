import * as vscode from 'vscode';
import * as fs from 'fs';
import { ConfigFile } from '../classes/configFile';
import { RequestModel } from '../classes/requestModel';
import { ChatSessions } from '../classes/chatSessions';
import { updateConfigurations } from '../utils/configuration';

export class MainViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'light-assistant.main';
    private _view?: vscode.WebviewView;
    private config = vscode.workspace.getConfiguration('lightAssistant');
    constructor(
        private readonly _extensionUri: vscode.Uri,
        private faIcons: any,
        private configFile: ConfigFile,
        private requestModel: RequestModel,
        private chatSessions: ChatSessions
    ) {}

    public updateConfiguration() {
        updateConfigurations(this._view);
    }

    public newChatSession() {
        this.chatSessions.newChatSession(this._view);
    }

    public loadChatSession(fileName: string) {
        this.chatSessions.loadChatSession(fileName, this._view);
    }

    public deleteChatSession(fileName: string) {
        this.chatSessions.deleteChatSession(fileName, this._view);
    }
    
    public initView(){
        this._view?.webview.postMessage({command: 'icons', icons: JSON.stringify(this.faIcons)});
        this.updateConfiguration();
        this.configFile.updateModelListFromConfig(this._view);
        this.chatSessions.syncManifestWithFiles();
        if(this.config.get<boolean>('loadLastChatSession')){
            this.chatSessions.loadLastChatSession(this._view);
        }
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

        webviewView.webview.onDidReceiveMessage(message => {
            // console.log('ts API',message);
            switch (message.command) {
                case 'init.ready':
                    this.initView();
                    break;
                case 'error.noModel':
                    vscode.window.showErrorMessage("No model selected, please select a model first.");
                    break;
                case 'user.request':
                    this.requestModel.handleRequest(message.prompt, message.model, this._view);
                    break;
                case 'user.stop':
                    this.requestModel.handleStop(this._view);
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
                case 'model.delete':
                    this.configFile.deleteModelFromConfig(message.modelData, this._view);
                    break;
                case 'id.delete':
                    this.requestModel.deleteMessageID(message.id, this._view);
                    break;
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const styleSheets = [
            'reset', 'vscode', 'popup', 'dialog', 'input',
            `highlight.js/${this.config.get<string>('codeHighlightTheme')}`,
            'katex/katex.min'
        ];
        const libs = ['autosize.min', 'highlight.min' ,'marked.min', 'katex.min'];
        const scripts = ['common', 'dialog', 'input', 'popup'];
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'assets/main.html');
        let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');
        // console.log(htmlContent);
        for(const styleSheet of styleSheets) {
            const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, '/assets/css/', styleSheet + '.css'));
            if(styleSheet.includes('highlight.js/')){
                htmlContent = htmlContent.replace(`{{highlight.css}}`, styleUri.toString());
            }
            else{
                htmlContent = htmlContent.replace(`{{${styleSheet}.css}}`, styleUri.toString());
            }
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