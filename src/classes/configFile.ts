import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LangDict } from './langDict';

interface ConfigFileInterface {
    configUri: vscode.Uri;
    context: vscode.ExtensionContext;
    updateModelListFromConfig(view?: vscode.WebviewView): void;
    addModelToConfig(modelData: string, view?: vscode.WebviewView): void;
    deleteModelFromConfig(modelData: string, view?: vscode.WebviewView): void;
    updateCurrentModel(model:string): void;
    getConfigContent(): string;
    updateConfigContent(content: string): void;
}


export class ConfigFile implements ConfigFileInterface {
    constructor(
        public configUri: vscode.Uri,
        public context: vscode.ExtensionContext
    ) {
        const folerPath = path.dirname(this.configUri.fsPath);
        if(!fs.existsSync(folerPath)){
            fs.mkdirSync(folerPath, {recursive: true});
        }
        if(!fs.existsSync(this.configUri.fsPath)){
            fs.writeFileSync(this.configUri.fsPath, `{\n  "models": []\n}`);
            vscode.window.showInformationMessage(`${LangDict.get('ts.createdConfig')} ${this.configUri.fsPath}`);
        }
    }

    public updateModelListFromConfig(view?: vscode.WebviewView){
        const configContent = this.getConfigContent();
        try{
            const models = JSON.parse(configContent).models;
            const currentModel = this.context.globalState.get<string>('model');
            view?.webview.postMessage({
                command:'update.models',
                models: JSON.stringify(models),
                currentModel: currentModel ? currentModel : ''
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`${LangDict.get('ts.parsingConfigError')} ${error}`);
        }
    }

    public addModelToConfig(modelData: string, view?: vscode.WebviewView) {
        let configContent = this.getConfigContent();
        let configObj = JSON.parse(configContent);
        let modelDataObj = JSON.parse(modelData);
        configObj['models'].push(JSON.parse(modelData));
        if(modelDataObj.model.length > 128){
            vscode.window.showErrorMessage(LangDict.get('ts.modelNameError'));
            return;
        }
        if(modelDataObj?.title && modelDataObj.title.length > 128){
            vscode.window.showErrorMessage(LangDict.get('ts.modelTitleError'));
            return;
        }
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelListFromConfig(view);
    }

    public deleteModelFromConfig(modelData: string, view?: vscode.WebviewView) {
        let configContent = this.getConfigContent();
        let configObj = JSON.parse(configContent);
        const modelToDelete = JSON.parse(modelData);
        configObj['models'] = configObj['models'].filter( (model: any) => {
            let sameBasic = false;
            let sameTitle = false;
            let sameSystem = false;
            if(model.model === modelToDelete.model && model.type === modelToDelete.type){
                sameBasic = true;
                if(model.title && modelToDelete.title){
                    sameTitle = model.title === modelToDelete.title;
                }
                else if(!model.title && !modelToDelete.title){
                    sameTitle = true;
                }
                if(model.system && modelToDelete.system){
                    sameSystem = model.system === modelToDelete.system;
                }
                else if(!model.system && !modelToDelete.system){
                    sameSystem = true;
                }
            }
            return !sameBasic || !sameSystem || !sameTitle;
        });
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelListFromConfig(view);
    }

    public updateCurrentModel(model: string){
        this.context.globalState.update('model', model);
    }
    
    public getConfigContent(): string {
        try{
            return fs.readFileSync(this.configUri.fsPath, 'utf8');
        }
        catch (error) {
            return `{\n  "models": []\n}`;
        }
    }

    public updateConfigContent(content: string) {
        fs.writeFileSync(this.configUri.fsPath, content);
    }
}
