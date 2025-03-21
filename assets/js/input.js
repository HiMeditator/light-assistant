autosize(document.getElementById('ta-prompt-input'));

document.getElementById('root').addEventListener('click', function() {
    document.getElementById('context-option').style.display = 'none';
});

document.getElementById('context-option').addEventListener('click', function(event) {
    event.stopPropagation();    
});

document.getElementById('add-context').addEventListener('click', function() {
    vscode.postMessage({command: 'context.request'});
});


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
    const contextDivs = document.querySelectorAll('.selected-context');
    const contextList = [];
    for(const item of contextDivs){
        contextList.push(item.getAttribute('data-value'));
        item.remove();
    }
    document.getElementById('context-list').innerHTML = '';
    vscode.postMessage({
        command: 'user.request',
        prompt: userPrompt,
        model: model,
        context: JSON.stringify(contextList)
    });
}

function loadContextList(data){
    contextList = JSONparse(data);
    const liList = [];
    document.getElementById('context-list').querySelectorAll('li').forEach(li => {
        console.log('check',li.getAttribute('data-value'));
        if(!contextList.includes(li.getAttribute('data-value'))){
            li.remove();
        }
        else{
            liList.push(li.getAttribute('data-value'));
        }
    });
    for(const item of contextList){
        if(liList.includes(item)) { continue; }
        const li = document.createElement('li');
        const span = document.createElement('span');
        const sub = document.createElement('sub');
        if(item === '__selected__') {
            span.textContent = g_langDict['js.selected'];
        }
        else {
            span.textContent = item.split('\\').pop();
        }
        sub.textContent = item;
        li.setAttribute('data-value', item);
        li.appendChild(span);
        li.appendChild(sub);
        document.getElementById('context-list').appendChild(li);
        li.addEventListener('click', function () {
            if(li.classList.contains('selected')){
                document.querySelectorAll('.selected-context').forEach(selected => {
                    if(selected.getAttribute('data-value') === item){
                        selected.remove();
                    }
                });
                li.classList.remove('selected');
            }
            else{
                li.classList.add('selected');
                const div = document.createElement('div'); 
                div.classList.add('selected-context');
                div.textContent = li.querySelector('span').textContent;
                div.setAttribute('data-value', item);
                document.getElementById('div-control-upper').appendChild(div);
                div.addEventListener('click', function () {
                    li.classList.remove('selected');
                    div.remove();
                });
            }
        });
    }
    document.getElementById('context-option').style.display = 'block';
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