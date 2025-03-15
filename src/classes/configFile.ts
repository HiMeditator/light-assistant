import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ConfigFile {
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
            vscode.window.showInformationMessage(`Config file created: ${this.configUri.fsPath}`);
        }
    }

    public updateModelListFromConfig(view?: vscode.WebviewView){
        const configContent = this.getConfigContent();
        const models = JSON.parse(configContent).models;
        const currentModel = this.context.globalState.get<string>('model');
        view?.webview.postMessage({
            command:'update.models',
            models: JSON.stringify(models),
            currentModel: currentModel ? currentModel : ''
        });
    }

    public addModelToConfig(modelData: string, view?: vscode.WebviewView) {
        let configContent = this.getConfigContent();
        let configObj = JSON.parse(configContent);
        let modelDataObj = JSON.parse(modelData);
        configObj['models'].push(JSON.parse(modelData));
        if(!modelDataObj?.model || modelDataObj.model.length > 128){
            vscode.window.showErrorMessage('Model name is too long!');
            return;
        }
        if(modelDataObj?.title && modelDataObj.title.length > 128){
            vscode.window.showErrorMessage('Model title is too long!');
            return;
        }
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelListFromConfig(view);
    }

    public deleteModelFromConfig(modelData: string, view?: vscode.WebviewView) {
        let configContent = this.getConfigContent();
        let configObj = JSON.parse(configContent);
        const modelToDelete = JSON.parse(modelData);
        configObj['models'] = configObj['models'].filter((model: any) => 
            model.name !== modelToDelete.name || model.type !== modelToDelete.type
        );
        fs.writeFileSync(this.configUri.fsPath, JSON.stringify(configObj, null, 2));
        this.updateModelListFromConfig(view);
    }

    public updateCurrentModel(model: string){
        this.context.globalState.update('model', model);
    }
    
    public getConfigContent(): string {
        return fs.readFileSync(this.configUri.fsPath, 'utf8');
    }

    public updateConfigContent(content: string) {
        fs.writeFileSync(this.configUri.fsPath, content);
    }
}
