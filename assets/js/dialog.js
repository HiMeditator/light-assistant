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