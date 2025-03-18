import * as vscode from 'vscode';
import * as fs from 'fs';
import ollama from 'ollama';
import OpenAI from 'openai';

interface RequestModelInterface{
    chatMessages: any[];
    chatSession: any[];
    isRequesting: boolean;
    chatSessionFolderUri: vscode.Uri;
    handleStop(view?: vscode.WebviewView): void;
    handleRequest(prompt: string, modelStr: string, view?: vscode.WebviewView): void;
    requestOllama(prompt: string, model: string, view?: vscode.WebviewView): void;
    requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, view?: vscode.WebviewView): void;
    clearChatSession(view?: vscode.WebviewView): void;
    pushUserMessage(content: string): void;
    pushModelMessage(content: string, modelType: string, model: string, success?: boolean): void;
}

export class RequestModel implements RequestModelInterface{
    chatMessages: any[] = [];
    chatSession: any[] = [];
    isRequesting: boolean = false;
    constructor(
        public chatSessionFolderUri: vscode.Uri
    ){
        if(!fs.existsSync(this.chatSessionFolderUri.fsPath)){
            fs.mkdirSync(this.chatSessionFolderUri.fsPath, {recursive: true});
        }
    }

    public handleStop(view?: vscode.WebviewView){
        if(!this.isRequesting) { return; }
        vscode.window.showInformationMessage('Not implemented yet.');
    }

    public handleRequest(prompt: string, modelStr: string, view?: vscode.WebviewView){
        if(modelStr === undefined || modelStr === ''){
            vscode.window.showErrorMessage('No model selected, please select a model first.');
            return;
        }
        const model = JSON.parse(modelStr);
        this.isRequesting = true;
        if(model['type'] === 'ollama'){
            this.requestOllama(prompt, model['model'], view);
        }
        else if(model['type'] === 'openai'){
            this.requestOpenAI(prompt, model['model'], model['base_url'], model['api_key'], view);
        }
        else {
            vscode.window.showErrorMessage('Error: unexpected model type. Check your config file.');
            return;
        }
    }
    
    public async requestOllama(prompt: string, model: string, view?: vscode.WebviewView){
        let responseContent = '';
        view?.webview.postMessage({command: 'response.new'});
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
            vscode.window.showErrorMessage(`Request failed: ${error}`);
            // console.log(error);
            view?.webview.postMessage({
                command: 'response.stream',
                data: `**${error}**`
            });
            view?.webview.postMessage({command: 'response.end'});
            this.pushModelMessage(`${error}`, 'ollama', model, false);
            this.isRequesting = false;
            return;
        }
        view?.webview.postMessage({command: 'response.end'});
        if(responseContent.startsWith('<think>') && responseContent.indexOf('</think>') >= 0){
            const pos = responseContent.indexOf('</think>');
            responseContent = responseContent.substring(pos + 8);
        }
        this.pushUserMessage(prompt);
        this.pushModelMessage(responseContent, 'ollama', model);
        this.isRequesting = false;
    }

    public async requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, view?: vscode.WebviewView) {
        let responseContent = '';
        let isReasoning = false;
        view?.webview.postMessage({command: 'response.new'});
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
                }
                if(delta['content']){
                    if(isReasoning){
                        content += '\n</think>\n\n';
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
            vscode.window.showErrorMessage(`Request failed: ${error}`);
            // console.log(error);
            view?.webview.postMessage({
                command: 'response.stream',
                data: `**${error}**`
            });
            view?.webview.postMessage({command: 'response.end'});
            this.pushModelMessage(`${error}`, 'openai', model, false);
            this.isRequesting = false;
            return;
        }
        view?.webview.postMessage({command: 'response.end'});
        this.pushUserMessage(prompt);
        this.pushModelMessage(responseContent, 'openai', model);
        this.isRequesting = false;
    }

    public clearChatSession(view?: vscode.WebviewView){
        this.chatMessages = [];
        this.chatSession = [];
        view?.webview.postMessage({command: 'chat.new'});
    }
    
    public pushUserMessage(content: string){
        this.chatMessages.push({ 'role': 'user', 'content': content });
        this.chatSession.push({'role': 'user', 'content': content});
    }
    public pushModelMessage(content: string, modelType: string, model: string, success: boolean = true){
        this.chatMessages.push({ 'role': 'assistant', 'content': content });
        this.chatSession.push({
            'role': 'assistant', 'content': content,
            'type': modelType, 'model': model, 'success': success
        });
    }
}
