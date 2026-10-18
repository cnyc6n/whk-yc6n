window.onload = () => {
    checkSavedGame();
    // 初始化班级人数选择后的名字输入框（默认 6 人）
    if (typeof Game.renderNameInputs === 'function') Game.renderNameInputs();
    document.querySelector('.mode-btn[data-mode="normal"]')?.classList.add('selected');
    window.addEventListener('resize', () => {
        if (document.getElementById('chart-page').classList.contains('active')) {
            drawFullChart();
        }
    });
};
