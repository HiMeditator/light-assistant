import * as vscode from 'vscode';
import * as fs from 'fs';
import { getTimeStr } from '../utils/functions';
import ollama from 'ollama';
import OpenAI from 'openai';

export class RequestModel{
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

    public handelRequest(prompt: string, modelStr: string, view?: vscode.WebviewView){
        if(modelStr === undefined || modelStr === ''){
            vscode.window.showErrorMessage('No model selected, please select a model first.');
            return;
        }
        const model = JSON.parse(modelStr);
        this.isRequesting = true;
        if(model['type'] === 'ollama'){
            this.requestOllama(prompt, model['model'], view);
        }
        else{
            this.requestOpenAI(prompt, model['model'], model['base_url'], model['api_key'], view);
        }
    }
    
    public async requestOllama(prompt: string, model: string, view?: vscode.WebviewView){
        let responseContent = '';
        this.pushUserMessage(prompt);
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
        this.pushModelMessage(responseContent, 'ollama', model);
        this.isRequesting = false;
    }

    public async requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, view?: vscode.WebviewView) {
        let responseContent = '';
        let isReasoning = false;
        this.pushUserMessage(prompt);
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
        this.pushModelMessage(responseContent, 'openai', model);
        this.isRequesting = false;
    }

    public clearChatSession(){
        this.chatMessages = [];
        this.chatSession = [];
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
