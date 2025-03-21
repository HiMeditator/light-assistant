import * as vscode from 'vscode';
import * as fs from 'fs';
import ollama from 'ollama';
import OpenAI from 'openai';
import { LangDict } from './langDict';
import { RepoContext } from './repoContext';

interface RequestModelInterface{
    chatMessages: any[];
    chatSession: any[];
    isRequesting: boolean;
    contextShow: string;
    contextPrompt: string;
    chatSessionFolderUri: vscode.Uri;
    repoContext: RepoContext;
    handleStop(view?: vscode.WebviewView): void;
    handleRequest(prompt: string, modelStr: string, contextStr: string, view?: vscode.WebviewView): void;
    requestOllama(prompt: string, model: string, messageID: string, view?: vscode.WebviewView): void;
    requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, messageID: string, view?: vscode.WebviewView): void;
    clearChatSession(view?: vscode.WebviewView): void;
    deleteMessageID(messageID: string, view?: vscode.WebviewView): void;
    pushUserMessage(content: string, messageID: string): void;
    pushModelMessage(content: string, cot: string, messageID: string, modelType: string, model: string, success?: boolean): void;
}

export class RequestModel implements RequestModelInterface{
    chatMessages: any[] = [];
    chatSession: any[] = [];
    isRequesting: boolean = false;
    contextShow: string = '';
    contextPrompt: string = '';
    constructor(
        public chatSessionFolderUri: vscode.Uri,
        public repoContext: RepoContext
    ){
        if(!fs.existsSync(this.chatSessionFolderUri.fsPath)){
            fs.mkdirSync(this.chatSessionFolderUri.fsPath, {recursive: true});
        }
    }

    public handleStop(view?: vscode.WebviewView){
        if(!this.isRequesting) { return; }
        vscode.window.showInformationMessage('Not implemented yet.');
    }

    public handleRequest(prompt: string, modelStr: string, contextStr: string, view?: vscode.WebviewView){
        if(modelStr === undefined || modelStr === ''){
            vscode.window.showErrorMessage(LangDict.get('ts.modelNotSelected'));
            return;
        }
        const messageID = new Date().toISOString();
        this.contextShow = this.repoContext.getContextPromptShow(contextStr);
        this.contextPrompt = this.repoContext.getContextPrompt(contextStr);
        view?.webview.postMessage({
            command: 'request.load',
            prompt: prompt + this.contextShow,
            id: messageID
        });
        const model = JSON.parse(modelStr);
        this.isRequesting = true;
        if(model['type'] === 'ollama'){
            this.requestOllama(prompt, model['model'], messageID, view);
        }
        else if(model['type'] === 'openai'){
            this.requestOpenAI(prompt, model['model'], model['base_url'], model['api_key'], messageID, view);
        }
        else {
            vscode.window.showErrorMessage(LangDict.get('ts.unexpectedModelError'));
            return;
        }
    }
    
    public async requestOllama(prompt: string, model: string, messageID: string, view?: vscode.WebviewView){
        let responseContent = '';
        let cot = '';
        this.pushUserMessage(prompt, messageID);
        view?.webview.postMessage({command: 'response.new', id: messageID});
        try{
            const response = await ollama.chat({
                model: model,
                messages: this.chatMessages,
                stream: true
            });
            for await (const part of response) {
                responseContent += part.message.content;
                view?.webview.postMessage({
                    command: 'response.stream',
                    data: part.message.content
                });
            }
        } catch(error) {
            vscode.window.showErrorMessage(`${LangDict.get('ts.requestFailed')} ${error}`);
            // console.log(error);
            view?.webview.postMessage({
                command: 'response.stream',
                data: `**${error}**`
            });
            view?.webview.postMessage({command: 'response.end'});
            this.pushModelMessage(`${error}`, cot, messageID, 'ollama', model, false);
            this.isRequesting = false;
            return;
        }
        view?.webview.postMessage({command: 'response.end'});
        if(responseContent.startsWith('<think>') && responseContent.indexOf('</think>') >= 0){
            const pos = responseContent.indexOf('</think>');
            cot = responseContent.substring(0, pos + 8);
            responseContent = responseContent.substring(pos + 8);
        }
        this.pushModelMessage(responseContent, cot, messageID, 'ollama', model);
        this.isRequesting = false;
    }

    public async requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, messageID:string, view?: vscode.WebviewView) {
        let responseContent = '';
        let cot = '';
        let isReasoning = false;
        this.pushUserMessage(prompt, messageID);
        view?.webview.postMessage({command: 'response.new', id: messageID});
        try {
            const openai = new OpenAI({
                apiKey: api_key,
                baseURL: base_url
            });
            const completion = await openai.chat.completions.create({
                model: model,
                messages: this.chatMessages,
                stream: true
            });
            for await (const chunk of completion) {
                let content = '';
                const delta = chunk['choices'][0]['delta'];
                if('reasoning_content' in delta && delta['reasoning_content']){
                    if(!isReasoning){
                        content = '<think>\n';
                        isReasoning = true;
                    }
                    content += delta['reasoning_content'];
                    cot += content;
                }
                if(delta['content']){
                    if(isReasoning){
                        content += '\n</think>\n\n';
                        cot += '\n</think>\n\n';
                        isReasoning = false;
                    }
                    content += delta['content'];
                }
                responseContent += delta['content'];
                view?.webview.postMessage({
                    command: 'response.stream',
                    data: content
                });
                // console.log(chunk['choices'][0]['delta'], content);
            }
        } catch(error) {
            vscode.window.showErrorMessage(`${LangDict.get('ts.requestFailed')} ${error}`);
            // console.log(error);
            view?.webview.postMessage({
                command: 'response.stream',
                data: `**${error}**`
            });
            view?.webview.postMessage({command: 'response.end'});
            this.pushModelMessage(`${error}`, cot, messageID, 'openai', model, false);
            this.isRequesting = false;
            return;
        }
        view?.webview.postMessage({command: 'response.end'});
        this.pushModelMessage(responseContent, cot, messageID, 'openai', model);
        this.isRequesting = false;
    }

    public clearChatSession(view?: vscode.WebviewView){
        this.chatMessages = [];
        this.chatSession = [];
        view?.webview.postMessage({command: 'chat.new'});
    }
    
    public deleteMessageID(messageID: string, view?: vscode.WebviewView) {
        for(let i = 0; i < this.chatSession.length; i++){
            if(this.chatSession[i]['iso_time'] === messageID && this.chatSession[i]['role'] === 'user') {
                view?.webview.postMessage({command: 'request.delete', id: messageID});
                this.chatSession.splice(i, 1);
                this.chatMessages.splice(i, 1);
            }
            if(this.chatSession[i]['iso_time'] === messageID && this.chatSession[i]['role'] === 'assistant') {
                view?.webview.postMessage({command: 'response.delete', id: messageID});
                this.chatSession.splice(i, 1);
                this.chatMessages.splice(i, 1);
                break;
            }
        }
    }

    public pushUserMessage(content: string, messageID: string){
        this.chatMessages.push({ 'role': 'user', 'content': content + this.contextPrompt});
        this.chatSession.push({
            'role': 'user', 'content': content + this.contextShow,
            'iso_time': messageID
        });
    }
    public pushModelMessage(content: string, cot: string, messageID: string, modelType: string, model: string, success = true){
        this.chatMessages.push({ 'role': 'assistant', 'content': content});
        this.chatSession.push({
            'role': 'assistant', 'content': content,
            'reasoning': cot, 'iso_time': messageID,
            'type': modelType, 'model': model, 'success': success
        });
    }
}
