const vscode = acquireVsCodeApi();

let g_icons;
let g_langDict;

let g_sendShortcut = 'Ctrl+Enter';
let g_currentModelName = 'Model';
let g_currentModelIcon = 'lightbulb';
let g_toDeleteModel = '';

let g_displayInfoMessage = true;
let g_isNewSession = true;
let g_disableSend = false;

let g_modelResponseContent = '';
let g_modelCotContentNode;
let g_modelContentDict = {};
let g_modelMainContentNode;


window.addEventListener('message', event => {
    const message = event.data;
    // console.log('js API', message);
    switch (message.command) {
        case 'icons':
            g_icons = JSON.parse(message.icons);
            break;
        case 'lang.dict':
            g_langDict = JSONparse(message.data);
            break;
        case 'welcome.load':
            loadWelcomeMessage();
            break;
        case 'request.load':
            loadRequest(message.prompt, message.id);
            break;
        case 'request.delete':
            deleteRequest(message.id);
            break;
        case 'response.load':
            loadResponse(message.model, message.data, message.id, message.type);
            break;
        case 'response.delete':
            deleteResponse(message.id);
            break;
        case 'response.new':
            createResponseElement(message.id);
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

vscode.postMessage({
    command: 'init.ready'
});

function updateConfigurations(configurations) {
    configurations = JSONparse(configurations);
    g_sendShortcut = configurations['sendRequestShortcut'];
    g_displayInfoMessage = configurations['displayInfoMessage'];
    document.getElementById('send-shortcut').innerText = g_sendShortcut;
}

function loadRequest(prompt, id){
    if(g_isNewSession){
        document.getElementById('div-dialog').innerHTML = '';
        g_isNewSession = false;
    }
    createUserRequestElement(prompt, id);
}

function deleteRequest(id) {
    document.getElementById(`${id}-request`).remove();
    if(document.getElementById('div-dialog').innerHTML.trim() === ''){
        g_isNewSession = true;
        loadWelcomeMessage();
    }
}

function deleteResponse(id) {
    document.getElementById(`${id}-response`).remove();
    if(document.getElementById('div-dialog').innerHTML.trim() === ''){
        g_isNewSession = true;
        loadWelcomeMessage();
    }
}

function disableInput(value){
    g_disableSend = value;
    const textarea = document.getElementById("ta-prompt-input");
    textarea.disabled = value;
    const dialogItemID = g_modelMainContentNode.parentNode.id;
    if(!value){
        g_modelContentDict[dialogItemID.substring(0, dialogItemID.length - 9)] = g_modelResponseContent;
        if(!g_modelResponseContent.startsWith('<think>')){
            g_modelCotContentNode.parentNode.querySelector('.dialog-item-control').querySelector('svg').remove();
        }
        // console.log(dialogItemID.substring(0, dialogItemID.length - 9), dialogItemID);
    }
}

function newChatSession() {
    document.getElementById('div-dialog').innerHTML = '';
    g_isNewSession = true;
    g_modelContentDict = {};
    loadWelcomeMessage();
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

function createSvg(icon, size = '0 0 448 512'){
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', size);
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon);
    svg.appendChild(path);
    return svg;
}

function createSvgWithTitle(icon, titleText, size = '0 0 448 512') {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', size);
    let title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = titleText;
    svg.appendChild(title);
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon);
    svg.appendChild(path);
    return svg;
}

function renderMarkdownContent(htmlNode, content) {
    const contentKaTeX = renderMathFormulas(content);
    const contentHTML = marked.parse(contentKaTeX);
    htmlNode.innerHTML = contentHTML;
    // console.log(contentHTML);
    htmlNode.querySelectorAll('pre code').forEach(code => {
        const pre = code.parentNode;
        if(pre.querySelector('code-info-div') === null){
            const codeClasses = code.className.split(' ');
            let language = 'unknown';
            for(let codeClass of codeClasses){
                if(codeClass.startsWith('language-')){
                    language = codeClass.substring(9);
                    break;
                }
            }
            const codeInfoDiv = document.createElement('div');
            codeInfoDiv.className = 'code-info-div';
            const svgInfo = createSvgWithTitle(g_icons['info'], language);
            const svgCopy = createSvgWithTitle(g_icons['clipboard'], g_langDict['js.copy'], '0 0 384 512');
            svgCopy.addEventListener('click', () => {
                const path = svgCopy.querySelector('path');
                navigator.clipboard.writeText(code.textContent);
                path.setAttribute('d', g_icons['check']);
                setTimeout(() => {
                    path.setAttribute('d', g_icons['clipboard']);
                }, 500);
            });
            codeInfoDiv.appendChild(svgInfo);
            codeInfoDiv.appendChild(svgCopy);
            pre.appendChild(codeInfoDiv);
        }
        hljs.highlightElement(code);
    });
}

function renderMathFormulas(markdownText) {
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

    let replacedText = textWithoutCode;
    replacedText = replacedText.replace(regexBlockDollar, (match, p1) => {
        return katex.renderToString(p1, {
            displayMode: true,
            throwOnError: false
        });
    });
    replacedText = replacedText.replace(regexInlineDollar,(match, p1) => {
        return katex.renderToString(p1, { throwOnError: false });
    });
    replacedText = replacedText.replace(regexBlockBrackets, (match, p1) => {
        return katex.renderToString(p1, {
            displayMode: true,
            throwOnError: false
        });
    });
    replacedText = replacedText.replace(regexInlineParentheses, (match, p1) => {
        return katex.renderToString(p1, { throwOnError: false });
    });
    placeholders.forEach((code, index) => {
        // replacedText = replacedText.replace(`__CODE_PLACEHOLDER_${index}__`, code);
        replacedText = replacedText.split(`__CODE_PLACEHOLDER_${index}__`).join(code);
    });
    return replacedText;
}