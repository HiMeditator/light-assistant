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
};

document.getElementById('option-ollama').onclick = () => {
    document.getElementById('div-url-input').style.display = 'none';
    document.getElementById('div-api-input').style.display = 'none';
    document.getElementById('i-base_url').required = false;
    document.getElementById('i-api_key').required = false;
    document.getElementById('option-ollama').classList.add('checked');
    document.getElementById('option-remote').classList.remove('checked');
};

document.getElementById('option-remote').onclick = () => {
    document.getElementById('div-url-input').style.display = 'block';
    document.getElementById('div-api-input').style.display = 'block';
    document.getElementById('i-base_url').required = true;
    document.getElementById('i-api_key').required = true;
    document.getElementById('option-ollama').classList.remove('checked');
    document.getElementById('option-remote').classList.add('checked');
};

document.getElementById('option-remote').click();
