const vscode = acquireVsCodeApi();

let disableSend = false;
let sendShortcut = '';

let currentModelName = 'Model';
let modelResponseContent;
let modelResponseObject;

let toDelteModel;

let icons;


vscode.postMessage({
    command: 'init.ready'
});

autosize(document.getElementById('ta-del-model-info'));
autosize(document.getElementById('ta-prompt-input'));

function adjustDialogHeight() {
    const divDialog = document.getElementById('div-dialog');
    const divInput = document.getElementById('div-input');
    const divInputHeight = divInput.offsetHeight;
    const windowHeight = window.innerHeight;
    divDialog.style.height = `${windowHeight - divInputHeight - 26}px`;
}

const taPromptInput = document.getElementById('ta-prompt-input');
const resizeObserver = new ResizeObserver(entries => {
    adjustDialogHeight();
});
resizeObserver.observe(taPromptInput);
window.addEventListener('resize', () => {
    adjustDialogHeight();
});

document.getElementById('add-model').onclick = () => {
    document.getElementById('div-add-model').style.display = 'block';
    document.getElementById('popup-background').style.display = 'block';
};

document.getElementById('popup-background').onclick = () => {
    document.getElementById('div-del-model').style.display = 'none';
    document.getElementById('div-add-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};

document.getElementById('option-ollama').onclick = () => {
    document.getElementById('div-url-input').style.display = 'none';
    document.getElementById('div-api-input').style.display = 'none';
    document.getElementById('note-add-model-openai').style.display = 'none';
    document.getElementById('note-add-model-ollama').style.display = 'block';
    document.getElementById('i-base_url').required = false;
    document.getElementById('i-api_key').required = false;
    document.getElementById('option-ollama').classList.add('checked');
    document.getElementById('option-openai').classList.remove('checked');
};

document.getElementById('option-openai').onclick = () => {
    document.getElementById('div-url-input').style.display = 'block';
    document.getElementById('div-api-input').style.display = 'block';
    document.getElementById('note-add-model-openai').style.display = 'block';
    document.getElementById('note-add-model-ollama').style.display = 'none';
    document.getElementById('i-base_url').required = true;
    document.getElementById('i-api_key').required = true;
    document.getElementById('option-ollama').classList.remove('checked');
    document.getElementById('option-openai').classList.add('checked');
};

document.getElementById('option-openai').click();



function createSvg(icon){
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 448 512');
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon);
    svg.appendChild(path);
    return svg;
}

function createSvgWithTitle(icon, titleText) {
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 448 512');
    let title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = titleText;
    svg.appendChild(title);
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icon);
    svg.appendChild(path);
    return svg;
}