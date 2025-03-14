window.addEventListener('message', event => {
    const message = event.data;
    console.log('Get mesaage:',message);
    switch (message.command) {
        case 'icons':
            icons = JSON.parse(message.icons);
            break;
        case 'response.new':
            createResponseElement();
            disableInput(true);
            break;
        case 'response.stream':
            updateResponseStream(message.data);
            break;
        case 'response.end':
            disableInput(false);
            break;
        case 'update.models':
            updateModelList(message.models, message.currentModel);
            break;
        case 'update.configurations':
            updateConfigurations(message.configurations);
            break;
        case 'chat.new':
            newChatSession();
            break;
    }
});

function disableInput(value){
    disableSend = value;
    const textarea = document.getElementById("ta-prompt-input");
    textarea.disabled = value;
}

function createResponseElement() {
    let dialogItem = document.createElement('div');
    dialogItem.className = 'dialog-item';

    let divInfo = document.createElement('div');
    divInfo.className = 'div-dialog-info';
    dialogItem.appendChild(divInfo);

    let infoHead = document.createElement('div');
    infoHead.className = 'info-head model-head';
    infoHead.textContent = 'M'; 
    divInfo.appendChild(infoHead);

    let modelName = document.createElement('div');
    modelName.className = 'model-name';
    modelName.textContent = 'Model';
    divInfo.appendChild(modelName);

    modelResponseObject = document.createElement('div');
    modelResponseObject.className = 'dialog-content model-content';
    dialogItem.appendChild(modelResponseObject);

    document.getElementById('div-dialog').appendChild(dialogItem);

    modelResponseContent = '';
}

function updateResponseStream(data) {
    modelResponseContent += data;
    const html = md.render(modelResponseContent);
    modelResponseObject.innerHTML = html;
}
function updateModelList(models, currentModel) {
    const icon1 = icons['circle-nodes'];
    const icon2 = icons['hexagon-node'];
    const modelList = document.getElementById('model-list');
    modelList.innerHTML = '';
    document.getElementById('model-selected-value').value = '';
    document.getElementById('model-selected-value').textContent = 'Select Model';
    models = JSONparse(models);
    currentModel = JSONparse(currentModel);
    let currentLi = undefined;
    for (let model of models) {
        let li = document.createElement('li');
        li.setAttribute('data-value', JSON.stringify(model));
        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 448 512');
        let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', model['type'] === 'ollama' ? icon1 : icon2);
        svg.appendChild(path);
        let span = document.createElement('span');
        span.textContent = ('title' in model) ? model['title'] : model['model'];
        li.appendChild(svg);
        li.appendChild(span);
        li.addEventListener('click', function () {
            let target = document.getElementById('model-selected-value');
            target.textContent = this.querySelector('span').textContent;
            target.value = this.getAttribute('data-value');
            document.querySelectorAll('#model-list li').forEach(_li => _li.classList.remove('selected'));
            li.classList.add('selected');
            vscode.postMessage({
                command: 'model.select',
                model: this.getAttribute('data-value')
            });
        });
        modelList.appendChild(li);
        if(model['type'] === currentModel['type'] && model['model'] === currentModel['model']){
            currentLi = li;
        }
    }
    if(currentLi !== undefined){ currentLi.click(); }
}

function updateConfigurations(configurations) {
    configurations = JSONparse(configurations);
    const sendRequestShortcut = configurations['sendRequestShortcut'];
    document.getElementById('send-shortcut').innerText = sendRequestShortcut;
    sendShortcut = sendRequestShortcut;
}

function newChatSession(){
    document.getElementById('div-dialog').innerHTML = '';
}

function JSONparse(str) {
    let obj;
    try {
        obj = JSON.parse(str);
        return obj;
    } catch (e) { 
        console.log(e);
        return {};
    }
}