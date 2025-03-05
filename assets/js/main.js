autosize(document.getElementById('ta-prompt-input'));

document.querySelectorAll('#model-option li').forEach(option => {
    option.addEventListener('click', function () {
        document.querySelector('#model-selected-value').textContent = this.textContent;
        document.querySelectorAll('#model-option li').forEach(li => li.classList.remove('selected'));
        this.classList.add('selected');
    });
});


function adjustDialogHeight() {
    const divDialog = document.getElementById('div-dialog');
    const divInput = document.getElementById('div-input');
    const divInputHeight = divInput.offsetHeight;
    const windowHeight = window.innerHeight;
    divDialog.style.height = `${windowHeight - divInputHeight}px`;
}

const taPromptInput = document.getElementById('ta-prompt-input');
const resizeObserver = new ResizeObserver(entries => {
    adjustDialogHeight();
});

resizeObserver.observe(taPromptInput);


document.getElementById('ta-prompt-input').addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') {
        handleCtrlEnter();
    }
});

function handleCtrlEnter() {

}
