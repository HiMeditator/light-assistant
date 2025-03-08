let modelContent;
let modelContentObject;
const md = markdownit();

window.addEventListener('message', event => {
    const message = event.data;
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
    infoHead.textContent = 'Q'; 
    divInfo.appendChild(infoHead);

    let modelName = document.createElement('div');
    modelName.className = 'model-name';
    modelName.textContent = 'qwen2.5-7b';
    divInfo.appendChild(modelName);

    modelContentObject = document.createElement('div');
    modelContentObject.className = 'content model-content';
    dialogItem.appendChild(modelContentObject);

    document.getElementById('div-dialog').appendChild(dialogItem);

    modelContent = '';
}

function updateResponseStream(data) {
    modelContent += data;
    const html = md.render(modelContent);
    modelContentObject.innerHTML = html;
}