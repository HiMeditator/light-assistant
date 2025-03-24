function adjustDialogHeight() {
    const divDialog = document.getElementById('div-dialog');
    const divInput = document.getElementById('div-input');
    const divInputHeight = divInput.offsetHeight;
    const windowHeight = window.innerHeight;
    divDialog.style.height = `${windowHeight - divInputHeight - 25}px`;
}
const resizeObserver = new ResizeObserver(entries => {
    adjustDialogHeight();
});
resizeObserver.observe(document.getElementById('ta-prompt-input'));
window.addEventListener('resize', () => {
    adjustDialogHeight();
});

function loadWelcomeMessage() {
    if(!g_isNewSession || !g_displayInfoMessage) { return; }
    g_currentModelIcon = 'lightbulb';
    createResponseElement('welcome-message');
    updateResponseStream(g_langDict['js.welcomeMessage']);
    g_modelContentDict['welcome-message'] = g_langDict['js.welcomeMessage'];
}

function loadResponse(model, data, id, type) {
    g_currentModelName = model;
    g_currentModelIcon = (type === 'ollama')? 'circle-nodes' : 'hexagon-node';
    createResponseElement(id);
    updateResponseStream(data);
    if(!data.startsWith('<think>')){
        g_modelCotContentNode.parentNode.querySelector('.dialog-item-control').querySelector('svg').remove();
    }
    g_modelContentDict[id] = data;
    document.getElementById(`${id}-request`).querySelector('.dialog-item-control').remove();
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
    else if(g_isNewSession === false){
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

function createUserRequestElement(userPrompt, contextStr, id) {
    const dialogItem = document.createElement('div');
    dialogItem.className = 'dialog-item';
    dialogItem.id = `${id}-request`;

    const divInfo = document.createElement('div');
    divInfo.className = 'div-dialog-info';
    dialogItem.appendChild(divInfo);

    const infoHead = document.createElement('div');
    infoHead.className = 'info-head user-head';
    const userHeadSvg = createSvg(g_icons['user']);
    infoHead.appendChild(userHeadSvg);
    divInfo.appendChild(infoHead);

    const userName = document.createElement('div');
    userName.className = 'user-name';
    userName.textContent = 'User';
    divInfo.appendChild(userName);

    const divControl =  document.createElement('div');
    divControl.className = 'dialog-item-control';
    divInfo.appendChild(divControl);

    const svgStop = createSvgWithTitle(g_icons['pause'], g_langDict['js.stopGeneration'], '0 0 320 512');
    divControl.appendChild(svgStop);
    svgStop.addEventListener('click', function () {
        vscode.postMessage({
            command: 'user.stop', id: id
        });
    });

    const userContent = document.createElement('div');
    userContent.className = 'dialog-content user-content';
    // userContent.textContent = userPrompt;
    renderMarkdownContent(userContent, userPrompt);
    dialogItem.appendChild(userContent);
    document.getElementById('div-dialog').appendChild(dialogItem);

    if(!contextStr) { return; }
    const contextList = JSONparse(contextStr);
    if(!contextList || contextList.length === 0) { return; }
    const contextDiv = document.createElement('div');
    contextDiv.className = 'dialog-context-file';
    for(let context of contextList){
        if(context === '__selected__'){
            context = g_langDict['js.selected'];
        }
        const contextItem = document.createElement('span');
        contextItem.textContent = context.split('\\').pop();
        contextDiv.appendChild(contextItem);
        contextItem.addEventListener('click', function () {
            vscode.postMessage({command: 'context.goto', context: context});
        });
    }
    userContent.appendChild(contextDiv);
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
    let modelHeadSize = '0 0 384 512';
    if(g_currentModelIcon === 'circle-nodes'){
        modelHeadSize = '0 0 512 512';
    }
    else if(g_currentModelIcon === 'hexagon-node'){
        modelHeadSize = '0 0 448 512';
    }
    let modelHeadSvg = createSvg(g_icons[g_currentModelIcon], modelHeadSize);
    infoHead.appendChild(modelHeadSvg);

    const modelName = document.createElement('div');
    modelName.className = 'model-name';
    if(id === 'welcome-message'){
        modelName.textContent = g_langDict['plugin.name'];
    }
    else{
        modelName.textContent = g_currentModelName;
    }
    
    divInfo.appendChild(infoHead);
    divInfo.appendChild(modelName);

    const dialogItemControl = document.createElement('div');
    dialogItemControl.className = 'dialog-item-control';
    divInfo.appendChild(dialogItemControl);

    const svgHideShow = createSvgWithTitle(
        id === 'welcome-message' ? g_icons['arrow-up'] : g_icons['arrow-down'],
        g_langDict['js.reasoningContent']
    );
    dialogItemControl.appendChild(svgHideShow);
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

    const svgCopy = createSvgWithTitle(g_icons['clipboard'], g_langDict['js.copy'], '0 0 384 512');
    dialogItemControl.appendChild(svgCopy);
    svgCopy.addEventListener('click', function () {
        // console.log(g_modelContentDict);
        const path = svgCopy.querySelector('path');
        if(!g_disableSend) {
            navigator.clipboard.writeText(g_modelContentDict[id] || '');
            path.setAttribute('d', g_icons['check']);
            setTimeout(() => {
                path.setAttribute('d', g_icons['clipboard']);
            }, 500);
        }
        else{
            svgCopy.setAttribute('viewBox', '0 0 512 512');
            path.setAttribute('d', g_icons['ban']);
            setTimeout(() => {
                svgCopy.setAttribute('viewBox', '0 0 384 512');
                path.setAttribute('d', g_icons['clipboard']);
            }, 500);
        }
    });

    if(id !== 'welcome-message'){
        const svgDelete = createSvgWithTitle(g_icons['trash-can'], g_langDict['js.deleteChatSession']);
        dialogItemControl.appendChild(svgDelete);
        svgDelete.addEventListener('click', function () {
            if(g_disableSend) { return; }
            const parentNode = this.parentNode.parentNode.parentNode;
            const id = parentNode.id.split('-response')[0];
            vscode.postMessage({command: 'id.delete', id: id});
            // console.log(`delete ${id}`);
        });
    }
    
    g_modelCotContentNode = document.createElement('div');
    g_modelCotContentNode.className = 'model-cot-content';
    dialogItem.appendChild(g_modelCotContentNode);

    g_modelMainContentNode = document.createElement('div');
    g_modelMainContentNode.className = 'dialog-content model-content';
    dialogItem.appendChild(g_modelMainContentNode);

    document.getElementById('div-dialog').appendChild(dialogItem);

    g_modelResponseContent = '';
}