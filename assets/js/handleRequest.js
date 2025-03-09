let modelResponseContent;
let modelResponseObject;
const md = markdownit();

window.addEventListener('message', event => {
    const message = event.data;
    console.log('get msg:',message);
    switch (message.command) {
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
            updateModelList(message.models, message.currentModel, message.icon1, message.icon2);
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
    divInfo.className = 'div-info';
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
    modelResponseObject.className = 'content model-content';
    dialogItem.appendChild(modelResponseObject);

    document.getElementById('div-dialog').appendChild(dialogItem);

    modelResponseContent = '';
}

function updateResponseStream(data) {
    modelResponseContent += data;
    const html = md.render(modelResponseContent);
    modelResponseObject.innerHTML = html;
}
function updateModelList(models, currentModel, icon1, icon2) {
    const modelList = document.getElementById('model-list');
    modelList.innerHTML = '';
    document.getElementById('model-selected-value').value = '';
    document.getElementById('model-selected-value').textContent = 'Select Model';
    models = JSON.parse(models);
    currentModel = JSON.parse(currentModel);
    let currentLi;
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
    currentLi.click();
}