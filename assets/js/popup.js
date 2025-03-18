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