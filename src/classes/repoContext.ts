import * as vscode from 'vscode';
import * as fs from 'fs';
import { LangDict } from './langDict';

interface TextEditorMap {
    [key: string]: vscode.TextEditor;
}

export class RepoContext {
    selectContent: string = '';
    activeEditor: vscode.TextEditor | undefined;
    includeTextEditors:TextEditorMap = {};
    contextItems: string[] = [];

    constructor() {
        const TextEditors = vscode.window.visibleTextEditors;
        for(const editor of TextEditors){
            this.includeTextEditors[editor.document.uri.fsPath] = editor;
        }
    }

    public getContextItem(view?: vscode.WebviewView) {
        this.contextItems = [];
        this.activeEditor = vscode.window.activeTextEditor;
        if (this.activeEditor && this.activeEditor.selection) {
            const selection = this.activeEditor.selection;
            this.selectContent = this.activeEditor.document.getText(selection);
        } else {
            this.selectContent = '';
        }
        if(this.selectContent){
            this.contextItems.push('__selected__');
        }
        for (const [key, editor] of Object.entries(this.includeTextEditors)) {
            const fileExists = fs.existsSync(editor.document.uri.fsPath);
            if (fileExists) {
                this.contextItems.push(key);
            } else {
                delete this.includeTextEditors[key];
            }
        }
        console.log(this.contextItems);
        view?.webview.postMessage({
            command: 'context.list',
            data:  JSON.stringify(this.contextItems)
        });
    }

    public getContextPromptShow(contextStr: string){
        const contextList = JSON.parse(contextStr);
        let promptShow = '';
        for(const context of contextList){
            const name = (context === '__selected__')?
                LangDict.get('js.selected') : context.split('\\').pop();
            promptShow += `\\(\\boxed{\\mathrm{${name}}}\\)  `;
        }
        if(promptShow === '') { return ''; };
        return '\n\n---\n' + promptShow;
    }

    public getContextPrompt(contextStr: string){
        const contextList = JSON.parse(contextStr);
        let contextPrompt = '';
        for(const context of contextList){
            if(context === '__selected__'){
                contextPrompt += `\n\nSelected Content:\n\`\`\`\n${this.selectContent}\n\`\`\``;
            }
            else if(this.includeTextEditors[context]){
                const fileName = context.split('\\').pop();
                const fileContent = this.includeTextEditors[context].document.getText();
                contextPrompt += `\n\n${fileName}:\n\`\`\`\n${fileContent}\n\`\`\``;
            }
        }
        return contextPrompt;
    }
}