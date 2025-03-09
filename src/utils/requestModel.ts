import * as vscode from 'vscode';
import ollama from 'ollama';
import OpenAI from 'openai';

export class RequestModel{
    requestLog: any[] = [];

    public handelRequest(prompt: string, modelStr: string, view?: vscode.WebviewView){
        if(modelStr === undefined || modelStr === ''){
            vscode.window.showErrorMessage('No model selected, please select a model first.');
            return;
        }
        const model = JSON.parse(modelStr);
        if(model['type'] === 'ollama'){
            this.requestOllama(prompt, model['model'], view);
        }
        else{
            this.requestOpenAI(prompt, model['model'], model['base_url'], model['api_key'], view);
        }
    }
    
    public async requestOllama(prompt: string, model: string, view?: vscode.WebviewView){
        view?.webview.postMessage({command: 'response.new'});
        const message = { 'role': 'user', 'content': prompt };
        this.requestLog.push(message);
        const response = await ollama.chat({
            model: model,
            messages: [message],
            stream: true
        });
        for await (const part of response) {
            view?.webview.postMessage({
                command: 'response.stream',
                data: part.message.content
            });
        }
        view?.webview.postMessage({command: 'response.end'});
    }

    public async requestOpenAI(prompt: string, model: string, base_url: string, api_key: string, view?: vscode.WebviewView) {
        view?.webview.postMessage({command: 'response.new'});
        const message = { 'role': 'user', 'content': prompt };
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
            // console.log(chunk['choices'][0]['delta']);
            let content = ('reasoning_content' in chunk['choices'][0]['delta']) ?
                chunk['choices'][0]['delta']['reasoning_content'] : 
                chunk['choices'][0]['delta']['content'];
            if(content === '') {
                content = chunk['choices'][0]['delta']['content'];
            }
            // let content = chunk['choices'][0]['delta']['content'];
            view?.webview.postMessage({
                command: 'response.stream',
                data: content
            });
        }
        view?.webview.postMessage({command: 'response.end'});
    }
}
