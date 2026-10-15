window.onload = () => {
    checkSavedGame();
    document.querySelector('.mode-btn[data-mode="normal"]')?.classList.add('selected');
    window.addEventListener('resize', () => {
        if (document.getElementById('chart-page').classList.contains('active')) {
            drawFullChart();
        }
    });
};
