window.addEventListener('message', event => {
    const message = event.data;
    // console.log('Get mesaage:',message);
    switch (message.command) {
        case 'icons':
            icons = JSON.parse(message.icons);
            break;
        case 'prompt.load':
            createUserRequestElement(message.data);
            break;
        case 'response.load':
            loadResponse(message.model, message.data);
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

function loadResponse(model, data) {
    currentModelName = model;
    createResponseElement();
    updateResponseStream(data);
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
    modelName.textContent = currentModelName;
    divInfo.appendChild(modelName);

    modelResponseObject = document.createElement('div');
    modelResponseObject.className = 'dialog-content model-content';
    dialogItem.appendChild(modelResponseObject);

    document.getElementById('div-dialog').appendChild(dialogItem);

    modelResponseContent = '';
}

function updateResponseStream(data) {
    modelResponseContent += data;
    // const contentKaTeX = modelResponseContent;
    const contentKaTeX = replaceMathFormulas(modelResponseContent);
    // console.log(modelResponseContent);
    // console.log(contentKaTeX);
    const html = marked.parse(contentKaTeX);
    modelResponseObject.innerHTML = html;
    modelResponseObject.querySelectorAll('pre code').forEach(el => {
        const pre = el.parentNode;
        if(pre.querySelector('code-info-div') === null){
            const codeClasses = el.className.split(' ');
            let language = 'unknown';
            for(let codeClass of codeClasses){
                if(codeClass.startsWith('language-')){
                    language = codeClass.substring(9);
                    break;
                }
            }
            const codeInfoDiv = document.createElement('div');
            codeInfoDiv.className = 'code-info-div';
            const svgInfo = createSvgWithTitle(icons['info'], language);
            const svgCopy = createSvgWithTitle(icons['clipboard'], 'copy');
            svgCopy.addEventListener('click', () => {
                const path = svgCopy.querySelector('path');
                const originalD = path.getAttribute('d');
                path.setAttribute('d', icons['check']);
                setTimeout(() => {
                    path.setAttribute('d', originalD);
                }, 500);
                navigator.clipboard.writeText(el.textContent);
            });
            codeInfoDiv.appendChild(svgInfo);
            codeInfoDiv.appendChild(svgCopy);
            pre.appendChild(codeInfoDiv);
        }
        hljs.highlightElement(el);
        // console.log(el.textContent);
    });
    // console.log(html);
    // console.log(modelResponseObject);
}

function updateModelList(models, currentModel) {
    const icon1 = icons['circle-nodes'];
    const icon2 = icons['hexagon-node'];
    const icon3 = icons['trash-can'];
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
        let svg = createSvg(model['type'] === 'ollama' ? icon1 : icon2);
        let svg2 = createSvg(icon3);
        let span = document.createElement('span');
        span.textContent = ('title' in model) ? model['title'] : model['model'];
        li.appendChild(svg);
        li.appendChild(span);
        li.appendChild(svg2);
        li.addEventListener('click', function () {
            let target = document.getElementById('model-selected-value');
            target.innerHTML = this.querySelector('span').textContent;
            currentModelName = `${this.querySelector('span').textContent}`;
            target.value = this.getAttribute('data-value');
            document.querySelectorAll('#model-list li').forEach(_li => _li.classList.remove('selected'));
            li.classList.add('selected');
            vscode.postMessage({
                command: 'model.select',
                model: this.getAttribute('data-value')
            });
        });
        svg2.addEventListener('click', function (event) {
            toDelteModel = this.parentNode.getAttribute('data-value');
            const delModel = JSON.parse(this.parentNode.getAttribute('data-value'))['model'];
            event.stopPropagation();
            document.getElementById("note-del-model").innerHTML = `Are you sure you want to delete <b>${delModel}</b>?`;
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

function replaceMathFormulas(markdownText) {
    const regexCodeBlock = /```[\s\S]*?```|`[^`]*`/g;

    const regexInlineDollar = /\$(.*?)\$/g;
    const regexBlockDollar = /\$\$(.*?)\$\$/gs;
    const regexInlineParentheses = /\\\((.*?)\\\)/g;
    const regexBlockBrackets = /\\\[([\s\S]*?)\\\]/g;

    const placeholders = [];
    let placeholderIndex = 0;
    const textWithoutCode = markdownText.replace(regexCodeBlock, (match) => {
        placeholders.push(match);
        return `__CODE_PLACEHOLDER_${placeholderIndex++}__`;
    });

    let replacedText = textWithoutCode.replace(regexInlineDollar,(match, p1) => {
        return katex.renderToString(p1, { throwOnError: false });
    });
    replacedText = replacedText.replace(regexInlineParentheses, (match, p1) => {
        return katex.renderToString(p1, { throwOnError: false });
    });
    replacedText = replacedText.replace(regexBlockDollar, (match, p1) => {
        return katex.renderToString(p1, {
            displayMode: true,
            throwOnError: false
        });
    });
    replacedText = replacedText.replace(regexBlockBrackets, (match, p1) => {
        return katex.renderToString(p1, {
            displayMode: true,
            throwOnError: false
        });
    });

    placeholders.forEach((code, index) => {
        // replacedText = replacedText.replace(`__CODE_PLACEHOLDER_${index}__`, code);
        replacedText = replacedText.split(`__CODE_PLACEHOLDER_${index}__`).join(code);
    });
    return replacedText;
}