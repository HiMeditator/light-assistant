const vscode = acquireVsCodeApi();
let disableSend = false;

document.getElementById('ta-prompt-input').addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        handleUserRequest();
    }
});

document.getElementById('send-prompt').addEventListener('click', function() {
    handleUserRequest();
});

document.getElementById('load-config').addEventListener('click', function() {
    vscode.postMessage({command: 'models.load'});
});

function handleUserRequest() {
    if(disableSend){
        return;
    }
    let userPrompt = document.getElementById('ta-prompt-input').value;
    let model = document.getElementById('model-selected-value').value;
    document.getElementById('ta-prompt-input').value = '';
    document.getElementById('ta-prompt-input').style.height = 'auto';
    // console.log(userPrompt);
    createUserRequestElement(userPrompt);
    vscode.postMessage({
        command: 'user.request',
        prompt: userPrompt,
        model: model
    });
}

function createUserRequestElement(userPrompt) {
    let dialogItem = document.createElement('div');
    dialogItem.className = 'dialog-item';

    let divInfo = document.createElement('div');
    divInfo.className = 'div-info';
    dialogItem.appendChild(divInfo);

    let infoHead = document.createElement('div');
    infoHead.className = 'info-head user-head';
    infoHead.textContent = 'U'; 
    divInfo.appendChild(infoHead);

    let userName = document.createElement('div');
    userName.className = 'user-name';
    userName.textContent = 'User';
    divInfo.appendChild(userName);

    let userContent = document.createElement('div');
    userContent.className = 'content user-content';
    userContent.textContent = userPrompt;
    dialogItem.appendChild(userContent);

    document.getElementById('div-dialog').appendChild(dialogItem);
}