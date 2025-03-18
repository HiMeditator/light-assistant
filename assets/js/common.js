const vscode = acquireVsCodeApi();

let disableSend = false;
let sendShortcut = '';

let currentModelName = 'Model';
let modelResponseContent;

let modelCotContentNode;
let modelMainContentNode;

let toDelteModel;

let icons;


vscode.postMessage({
    command: 'init.ready'
});