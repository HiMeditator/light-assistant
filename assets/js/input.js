autosize(document.getElementById('ta-prompt-input'));

document.getElementById('ta-prompt-input').addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter' && g_sendShortcut === 'Ctrl+Enter') {
        handleUserRequest();
    }
    else if (!event.ctrlKey && event.key === 'Enter' && g_sendShortcut === 'Enter') {
        handleUserRequest();
        event.preventDefault();
    }
});

document.getElementById('send-prompt').addEventListener('click', function() {
    handleUserRequest();
});

document.getElementById('load-config').addEventListener('click', function() {
    vscode.postMessage({command: 'models.load'});
});

document.getElementById('add-model').addEventListener('click', function() {
    document.getElementById('div-add-model').style.display = 'block';
    document.getElementById('popup-background').style.display = 'block';
});

function handleUserRequest() {
    if(g_disableSend){
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
    g_currentModelName = document.getElementById('model-selected-value').textContent;
    g_currentModelIcon = (JSONparse(model)['type'] === 'ollama')? 'circle-nodes' : 'hexagon-node';
    vscode.postMessage({
        command: 'user.request',
        prompt: userPrompt,
        model: model
    });
}

function updateModelList(models, currentModel) {
    const icon1 = g_icons['circle-nodes'];
    const icon2 = g_icons['hexagon-node'];
    const icon3 = g_icons['trash-can'];
    const modelList = document.getElementById('model-list');
    modelList.innerHTML = '';
    document.getElementById('model-selected-value').value = '';
    document.getElementById('model-selected-value').textContent = g_langDict['js.selectModel'];
    models = JSONparse(models);
    currentModel = JSONparse(currentModel);
    let currentLi = undefined;
    for (const model of models) {
        const li = document.createElement('li');
        li.setAttribute('data-value', JSON.stringify(model));
        const svgIco = createSvg(model['type'] === 'ollama' ? icon1 : icon2);
        const svgDel = createSvg(icon3);
        const span = document.createElement('span');
        span.textContent = ('title' in model) ? model['title'] : model['model'];
        li.appendChild(svgIco);
        li.appendChild(span);
        li.appendChild(svgDel);
        li.addEventListener('click', function () {
            let target = document.getElementById('model-selected-value');
            target.innerHTML = this.querySelector('span').textContent;
            target.value = this.getAttribute('data-value');
            document.querySelectorAll('#model-list li').forEach(_li => _li.classList.remove('selected'));
            li.classList.add('selected');
            vscode.postMessage({
                command: 'model.select',
                model: this.getAttribute('data-value')
            });
        });
        svgDel.addEventListener('click', function (event) {
            event.stopPropagation();
            g_toDeleteModel = this.parentNode.getAttribute('data-value');
            const delModel = JSON.parse(this.parentNode.getAttribute('data-value'))['model'];
            document.getElementById("note-del-model").innerHTML = 
                g_langDict['js.confirmDelete'] + 
                `&nbsp;&nbsp;<b>${delModel}</b>`;
            document.getElementById('popup-background').style.display = 'block';
            document.getElementById('div-del-model').style.display = 'block';
        });
        modelList.appendChild(li);
        if(model['type'] === currentModel['type'] && model['model'] === currentModel['model']){
            currentLi = li;
        }
    }
    if(currentLi !== undefined){ currentLi.click(); }
}