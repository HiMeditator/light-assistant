import * as vscode from 'vscode';
import * as fs from 'fs';
import { getTimeStr } from '../utils/functions';
import ollama from 'ollama';
import OpenAI from 'openai';

export class RequestModel{
    chatMessages: any[] = [];
    chatLog: any[] = [];
    isRequesting: boolean = false;
    constructor(
        public chatLogFolderUri: vscode.Uri
    ){
        if(!fs.existsSync(this.chatLogFolderUri.fsPath)){
            fs.mkdirSync(this.chatLogFolderUri.fsPath, {recursive: true});
        }
    }

    public newChatSession(view?: vscode.WebviewView){
        if(this.isRequesting){
            vscode.window.showInformationMessage('Fetching the response from the large model, please try again later.');
            return;
        }
        this.saveChatLog();
        this.chatMessages = [];
        this.chatLog = [];
        view?.webview.postMessage({command: 'chat.new'});
    }

    public saveChatLog(){
        if(!this.chatLog.length) { return; }
        const fileName = `${getTimeStr()}.json`;
        const filePath = vscode.Uri.joinPath(this.chatLogFolderUri, fileName);
        fs.writeFileSync(filePath.fsPath, JSON.stringify(this.chatLog, null, 2));
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
        this.chatMessages.push({ 'role': 'user', 'content': prompt });
        this.chatLog.push({ 'role': 'user', 'content': prompt });
        view?.webview.postMessage({command: 'response.new'});
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
        view?.webview.postMessage({command: 'response.end'});
        this.chatMessages.push({ 'role': 'assistant', 'content': responseContent });
        this.chatLog.push({
            'role': 'assistant', 'content': responseContent,
            type:'ollama', 'model': model
        });
        this.isRequesting = false;
    }

    public async requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, view?: vscode.WebviewView) {
        let responseContent = '';
        let isReasoning = false;
        this.chatMessages.push({ 'role': 'user', 'content': prompt });
        this.chatLog.push({ 'role': 'user', 'content': prompt });
        view?.webview.postMessage({command: 'response.new'});
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
        view?.webview.postMessage({command: 'response.end'});
        this.chatMessages.push({ 'role': 'assistant', 'content': responseContent });
        this.chatLog.push({
            'role': 'assistant', 'content': responseContent,
            type: 'openai', 'model': model
        });
        this.isRequesting = false;
    }
}
