import * as vscode from 'vscode';
import * as fs from 'fs';

const langRelPath: { [key: string]: string } = {
    "en": "package.nls.json",
    "zh-cn": "package.nls.zh-cn.json",
    "ja": "package.nls.ja.json"
};

export class LangDict{
    private static langDict: LangDict | undefined;
    lang: string;
    path: vscode.Uri;
    dict: any;

    private constructor(basePath: vscode.Uri){
        this.lang = (vscode.env.language in langRelPath)? vscode.env.language : "en";
        this.path = vscode.Uri.joinPath(basePath, langRelPath[this.lang]);
        this.dict = JSON.parse(fs.readFileSync(this.path.fsPath, 'utf8'));
        // console.log(this.dict);
    }

    public static instance(basePath: vscode.Uri): LangDict {
        if (!LangDict.langDict) {
            LangDict.langDict = new LangDict(basePath);
        }
        return LangDict.langDict;
    }

    public static get(key: string): string {
        if(!LangDict.langDict){
            vscode.window.showErrorMessage('LangDict not initialized.');
            return '';
        }
        return LangDict.langDict.dict[key] || key;
    }

    public static getDict(): any {
        if(!LangDict.langDict){
            vscode.window.showErrorMessage('LangDict not initialized.');
            return {};
        }
        return LangDict.langDict.dict;
    }
};