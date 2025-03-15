document.getElementById('ta-prompt-input').addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter' && sendShortcut === 'Ctrl+Enter') {
        handleUserRequest();
    }
    else if (event.key === 'Enter' && sendShortcut === 'Enter') {
        handleUserRequest();
    }
});

document.getElementById('send-prompt').addEventListener('click', function() {
    handleUserRequest();
});

document.getElementById('load-config').addEventListener('click', function() {
    vscode.postMessage({command: 'models.load'});
});

document.getElementById('form-add-model').addEventListener('submit', function(event) {
    event.preventDefault();
});

document.getElementById('btn-add-submit').onclick = () => {
    const form = document.getElementById('form-add-model');
    if (!form.checkValidity()) { return; }
    const optionOllama = document.getElementById('option-ollama');
    let modelData = {};
    modelData['model'] = document.getElementById('i-model').value;
    modelData['title'] = document.getElementById('i-title').value;
    if(modelData['title'].trim() === '') { delete modelData['title']; }
    if(optionOllama.classList.contains('checked')){
        modelData['type'] = 'ollama';
    }
    else{
        modelData['type'] = 'openai';
        modelData['base_url'] = document.getElementById('i-base_url').value;
        modelData['api_key'] = document.getElementById('i-api_key').value;
    }
    form.reset();
    vscode.postMessage({
        command: 'model.add',
        modelData: JSON.stringify(modelData)
    });
    document.getElementById('div-add-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};

document.getElementById('btn-add-cancel').onclick = () => {
    const form = document.getElementById('form-add-model');
    form.reset();
    document.getElementById('div-add-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};

function handleUserRequest() {
    if(disableSend){
        return;
    }
    let userPrompt = document.getElementById('ta-prompt-input').value;
    if(userPrompt.trim() === ''){
        document.getElementById('ta-prompt-input').value = '';
        document.getElementById('ta-prompt-input').style.height = 'auto';
        document.getElementById('ta-prompt-input').focus();
        return;
    }
    let model = document.getElementById('model-selected-value').value;
    if(model === '' || model === undefined){
        vscode.postMessage({
            command: 'error.noModel'
        });
        return;
    }
    document.getElementById('ta-prompt-input').value = '';
    document.getElementById('ta-prompt-input').style.height = 'auto';
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
    divInfo.className = 'div-dialog-info';
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
    userContent.className = 'dialog-content user-content';
    userContent.textContent = userPrompt;
    dialogItem.appendChild(userContent);

    document.getElementById('div-dialog').appendChild(dialogItem);
}