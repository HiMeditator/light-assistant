function adjustDialogHeight() {
    const divDialog = document.getElementById('div-dialog');
    const divInput = document.getElementById('div-input');
    const divInputHeight = divInput.offsetHeight;
    const windowHeight = window.innerHeight;
    divDialog.style.height = `${windowHeight - divInputHeight - 26}px`;
}
const resizeObserver = new ResizeObserver(entries => {
    adjustDialogHeight();
});
resizeObserver.observe(document.getElementById('ta-prompt-input'));
window.addEventListener('resize', () => {
    adjustDialogHeight();
});

function loadResponse(model, data, id) {
    g_currentModelName = model;
    createResponseElement(id);
    updateResponseStream(data);
}

function updateResponseStream(data) {
    g_modelResponseContent += data;

    let cotContent = '';
    let mainContent = g_modelResponseContent;
    if(mainContent.startsWith('<think>')){
        [cotContent, mainContent] = splitThinkContent(g_modelResponseContent);
    }

    if(cotContent !== ''){
        renderMarkdownContent(g_modelCotContentNode, cotContent);
    }
    if(mainContent !== ''){
        renderMarkdownContent(g_modelMainContentNode, mainContent);
    }

    if(cotContent !== '' && mainContent === ''){
        g_modelCotContentNode.style.display = 'block';
    }
    else{
        g_modelCotContentNode.style.display = 'none';
    }
}

function splitThinkContent(currentResponse){
    let pos = currentResponse.indexOf('</think>');
    let thinkContent = '';
    let restContent = '';
    if(pos < 0){
        thinkContent = currentResponse.substring(7);
    }
    else{
        thinkContent = currentResponse.substring(7, pos);
        restContent = currentResponse.substring(pos + 8);
    }
    return [thinkContent, restContent];
}

function createUserRequestElement(userPrompt, id) {
    let dialogItem = document.createElement('div');
    dialogItem.className = 'dialog-item';
    dialogItem.id = `${id}-request`;

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

function createResponseElement(id) {
    const dialogItem = document.createElement('div');
    dialogItem.className = 'dialog-item';
    dialogItem.id = `${id}-response`;
    const divInfo = document.createElement('div');
    divInfo.className = 'div-dialog-info';
    dialogItem.appendChild(divInfo);

    const infoHead = document.createElement('div');
    infoHead.className = 'info-head model-head';
    infoHead.textContent = 'M'; 
    const modelName = document.createElement('div');
    modelName.className = 'model-name';
    modelName.textContent = g_currentModelName;
    divInfo.appendChild(infoHead);
    divInfo.appendChild(modelName);

    const svgHideShow = createSvgWithTitle(g_icons['arrow-down'], 'reasoning content');
    const svgDelete = createSvgWithTitle(g_icons['trash-can'], 'delete chat session');
    const dialogItemControl = document.createElement('div');
    dialogItemControl.className = 'dialog-item-control';
    dialogItemControl.appendChild(svgHideShow);
    dialogItemControl.appendChild(svgDelete);
    divInfo.appendChild(dialogItemControl);

    svgHideShow.addEventListener('click', function () {
        const parentNode = this.parentNode.parentNode.parentNode;
        const thisModelCotContentNode = parentNode.querySelector('.model-cot-content');
        if(thisModelCotContentNode.style.display === 'none'){
            thisModelCotContentNode.style.display = 'block';
            this.querySelector('path').setAttribute('d', g_icons['arrow-up']);
        }else{
            thisModelCotContentNode.style.display = 'none';
            this.querySelector('path').setAttribute('d', g_icons['arrow-down']);
        }
    });
    svgDelete.addEventListener('click', function () {
        if(g_disableSend) { return; }
        const parentNode = this.parentNode.parentNode.parentNode;
        const id = parentNode.id.split('-response')[0];
        vscode.postMessage({command: 'id.delete', id: id});
        // console.log(`delete ${id}`);
    });

    g_modelCotContentNode = document.createElement('div');
    g_modelCotContentNode.className = 'model-cot-content';
    dialogItem.appendChild(g_modelCotContentNode);

    g_modelMainContentNode = document.createElement('div');
    g_modelMainContentNode.className = 'dialog-content model-content';
    dialogItem.appendChild(g_modelMainContentNode);

    document.getElementById('div-dialog').appendChild(dialogItem);

    g_modelResponseContent = '';
}