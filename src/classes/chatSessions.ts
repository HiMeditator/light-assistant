import * as vscode from 'vscode';
import * as fs from 'fs';
import { getTimeStr } from '../utils/functions';
import { RequestModel } from './requestModel';


interface ChatSessionsInterface {
    manifest: any[];
    sessionName: string;
    sessionDirUri: vscode.Uri;
    sessionManifestUri: vscode.Uri;
    requestModel: RequestModel;
    deleteChatSession(fileName: string, view?: vscode.WebviewView): void;
    newChatSession(view?: vscode.WebviewView, saveChatLog?: boolean): void;
    loadLastChatSession(view?: vscode.WebviewView): void;
    loadChatSession(fileName: string, view?: vscode.WebviewView): void;
    saveChatSession(): void;
    saveManifest(): void;
    syncManifestWithFiles(): void;
}


export class ChatSessions implements ChatSessionsInterface {
    manifest: any[] = [];
    sessionName: string;
    constructor(
        public sessionDirUri: vscode.Uri,
        public sessionManifestUri: vscode.Uri,
        public requestModel: RequestModel
    ){
        if(!fs.existsSync(this.sessionDirUri.fsPath)){
            fs.mkdirSync(this.sessionDirUri.fsPath, {recursive: true});
        }
        if(!fs.existsSync(this.sessionManifestUri.fsPath)){
            fs.writeFileSync(this.sessionManifestUri.fsPath, `[]`);
        }
        try{
            this.manifest = JSON.parse(fs.readFileSync(sessionManifestUri.fsPath, 'utf8'));
        }
        catch (error) {
            this.manifest = [];
        }
        this.sessionName = `${getTimeStr()}.json`;
        // console.log(this.sessionManifest);
    }

    public deleteChatSession(fileName: string, view?: vscode.WebviewView){
        const filePath = vscode.Uri.joinPath(this.sessionDirUri, fileName);
        try{
            fs.unlinkSync(filePath.fsPath);
        }
        catch (error) {}
        for(let i = 0; i < this.manifest.length; i++){
            if(this.manifest[i].name === fileName){
                this.manifest.splice(i, 1);
                break;
            }
        }
        if(this.sessionName === fileName){
            this.newChatSession(view, false);
        }
        this.saveManifest();
    }

    public newChatSession(view?: vscode.WebviewView, saveChatLog = true){
        if(this.requestModel.isRequesting){
            vscode.window.showInformationMessage('Fetching the response from model, please try again later.');
            return;
        }
        if(saveChatLog){
            this.saveChatSession();
        }
        this.sessionName = `${getTimeStr()}.json`;
        this.requestModel.clearChatSession(view);
    }

    public loadLastChatSession(view?: vscode.WebviewView){
        if(this.manifest.length === 0) { return; }
        this.loadChatSession(this.manifest[this.manifest.length - 1].name, view);
    }

    public loadChatSession(fileName: string, view?: vscode.WebviewView){
        if(this.requestModel.isRequesting){
            vscode.window.showInformationMessage('Fetching the response from model, please try again later.');
            return;
        }
        this.saveChatSession();
        for(let i = 0; i < this.manifest.length; i++){
            if(this.manifest[i].name === fileName){
                const mainifestItem = this.manifest[i];
                this.manifest.push(mainifestItem);
                this.manifest.splice(i, 1);
                break;
            }
        }
        this.sessionName = fileName;
        const filePath = vscode.Uri.joinPath(this.sessionDirUri, fileName);
        try {
            const chatSession = JSON.parse(fs.readFileSync(filePath.fsPath, 'utf8'));
            this.requestModel.clearChatSession(view);
            for(const message of chatSession){
                if(message.role === 'user'){
                    this.requestModel.pushUserMessage(message.content);
                    view?.webview.postMessage({
                        command: 'prompt.load',
                        data: message.content
                    });
                }
                else{
                    this.requestModel.pushModelMessage(
                        message.content, message.role,
                        message.model, message.success
                    );
                    view?.webview.postMessage({
                        command: 'response.load',
                        model: message.model,
                        data: message.content
                    });
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error loading chat session: ${error}`);
        }
    }

    public saveChatSession(){
        if(this.requestModel.chatSession.length === 0) { return; }
        let inManifest = false;
        for(let i = 0; i < this.manifest.length; i++){
            if(this.sessionName === this.manifest[i].name){
                this.manifest[i]['workspace'] = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
                this.manifest[i]['update'] = new Date().toLocaleString();
                inManifest = true;
                break;
            }
        }
        if(!inManifest){
            let content = this.requestModel.chatSession[0].content;
            if(content.length > 64){
                content = content.substring(0, 64) + '...';
            }
            this.manifest.push({
                name: this.sessionName,
                overview: content,
                workspace: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                update: new Date().toLocaleString()
            });
        }
        this.saveManifest();
        const filePath = vscode.Uri.joinPath(this.sessionDirUri, this.sessionName);
        fs.writeFileSync(
            filePath.fsPath,
            JSON.stringify(this.requestModel.chatSession, null, 2)
        );
        this.sessionName = `${getTimeStr()}.json`;
    }

    public saveManifest(){
        fs.writeFileSync(
            this.sessionManifestUri.fsPath,
            JSON.stringify(this.manifest, null, 2)
        );
    }

    public syncManifestWithFiles(){
        const files: string[] = [];
        try {
            const entries = fs.readdirSync(this.sessionDirUri.fsPath);
            for(const entry of entries){
                if(entry.endsWith('.json') && entry !== 'manifest.json'){
                    files.push(entry);
                }
            };
        } catch (err) {}

        for(let i = 0; i < this.manifest.length; i++){
            if(!files.includes(this.manifest[i].name)){
                this.manifest.splice(i, 1);
                i--;
            }
        }

        for(const file of files){
            if(!this.manifest.find(item => item.name === file)){
                const filePath = vscode.Uri.joinPath(this.sessionDirUri, file);
                let content = '';
                try {
                    content = JSON.parse(fs.readFileSync(filePath.fsPath, 'utf8'))[0]['content'];
                }
                catch (error) { content = 'load content error'; }
                if(content.length > 64){
                    content = content.substring(0, 64) + '...';
                }
                this.manifest.push({
                    name: file,
                    overview: content,
                    workspace: vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                    update: new Date().toLocaleString()
                });
            }
        }
        console.log(this.manifest);
    }
}