// ===== 状态 =====
let State = {
    week: 1, month: 8, year: 2025, money: 0, ap: 3, maxAp: 3,
    diff: 'normal', mode: 'normal', isGraduated: false, isMockExam: false,
    weather: { i: '☀️', n: '晴朗', eff: '' }, season: '秋',
    fac: { desk: 0, tech: 0, ac: 0, music: 0, psy: 0 },
    tempAlloc: {}, students: [],
    eventCooldowns: {},
    birthdayTriggered: {},
    monthStartScores: []
};

function saveGame() {
    try { if (State.students && State.students.length > 0) localStorage.setItem('whk_save_v2', JSON.stringify(State)); } catch (e) {}
}

function checkSavedGame() {
    try {
        const s = localStorage.getItem('whk_save_v2');
        if (s) {
            const btn = document.createElement('button');
            btn.className = 'btn-action';
            btn.style.marginTop = '12px';
            btn.style.borderColor = 'var(--btn-accent)';
            btn.style.textAlign = 'center';
            btn.innerHTML = `<h5 style="color:var(--btn-accent);font-size:1.1em;justify-content:center;">继续游戏</h5><p>发现存档，点击恢复</p>`;
            btn.onclick = () => {
                const parsed = JSON.parse(s);
                if (!parsed.eventCooldowns) parsed.eventCooldowns = {};
                if (!parsed.fac.music) parsed.fac.music = 0;
                if (!parsed.fac.psy) parsed.fac.psy = 0;
                if (!parsed.birthdayTriggered) parsed.birthdayTriggered = {};
                if (!parsed.monthStartScores) parsed.monthStartScores = [];
                parsed.students.forEach(st => {
                    if (typeof st.mood === 'undefined') st.mood = 60;
                    if (typeof st.continuousGood === 'undefined') st.continuousGood = 0;
                    if (typeof st.effArts === 'undefined') st.effArts = 1.0;
                    if (typeof st.effSci === 'undefined') st.effSci = 1.0;
                    if (!st.history) st.history = { scores: [], ranks: [] };
                    if (!st.history.scores) st.history.scores = [];
                    if (!st.history.ranks) st.history.ranks = [];
                    if (typeof st.birthdayMonth === 'undefined') st.birthdayMonth = 0;
                    if (typeof st.skipStudy === 'undefined') st.skipStudy = false; // 新增
                });
                State = parsed;
                document.getElementById('start-screen').classList.add('hidden');
                document.getElementById('main-header').classList.remove('hidden');
                document.getElementById('main-body').classList.remove('hidden');
                Game.updateUI();
                updateDiffBadge();
                Game.updateCountdown();
                if (!localStorage.getItem('tutorial_shown')) {
                    UI.showHelp();
                    localStorage.setItem('tutorial_shown', 'true');
                }
            };
            document.getElementById('start-box-inner').appendChild(btn);
        }
    } catch (e) {}
}

function updateDiffBadge() {
    const badge = document.getElementById('diff-badge');
    const names = { easy: '简单', normal: '普通', hard: '困难' };
    badge.textContent = names[State.diff] || '普通';
    badge.className = 'diff-badge ' + (State.diff || 'normal');
}

