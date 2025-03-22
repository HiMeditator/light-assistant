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

document.getElementById('form-add-model').addEventListener('submit', function(event) {
    event.preventDefault();
});

document.getElementById('btn-del-cancel').onclick = () => {
    document.getElementById('div-del-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};

document.getElementById('btn-add-cancel').onclick = () => {
    const form = document.getElementById('form-add-model');
    form.reset();
    document.getElementById('div-add-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};

document.getElementById('btn-del-submit').onclick = () => {
    vscode.postMessage({
        command: 'model.delete',
        modelData: g_toDeleteModel
    });
    document.getElementById('div-del-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};

document.getElementById('btn-add-submit').onclick = () => {
    const form = document.getElementById('form-add-model');
    if (!form.checkValidity()) { return; }
    const optionOllama = document.getElementById('option-ollama');
    let modelData = {};
    modelData['model'] = document.getElementById('i-model').value;
    modelData['title'] = document.getElementById('i-title').value;
    modelData['system'] = document.getElementById('i-system').value;
    if(modelData['title'].trim() === '') { delete modelData['title']; }
    if(modelData['system'].trim() === '') { delete modelData['system']; }
    if(optionOllama.classList.contains('checked')){
        modelData['type'] = 'ollama';
    }
    else{
        modelData['type'] = 'openai';
        modelData['base_url'] = document.getElementById('i-base_url').value;
        modelData['api_key'] = document.getElementById('i-api_key').value;
    }
    vscode.postMessage({
        command: 'model.add',
        modelData: JSON.stringify(modelData)
    });
    form.reset();
    document.getElementById('div-add-model').style.display = 'none';
    document.getElementById('popup-background').style.display = 'none';
};