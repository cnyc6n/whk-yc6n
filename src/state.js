// ===== 状态 =====

// 标准状态模板：初始状态与老存档补齐共用这一份来源，避免两处各自漂移
const DEFAULT_STATE = {
    week: 1, month: 8, year: 2025, money: 0, ap: 3, maxAp: 3,
    diff: 'normal', mode: 'normal', isGraduated: false, isMockExam: false,
    weather: { i: '☀️', n: '晴朗', eff: '' }, season: '秋',
    fac: { desk: 0, tech: 0, ac: 0, music: 0, psy: 0 },
    tempAlloc: {}, students: [],
    eventCooldowns: {},
    birthdayTriggered: {},
    monthStartScores: []
};

// 学生默认形状（与 game.js 中 startGame 生成的学生字段保持一致）
const DEFAULT_STUDENT = {
    name: '',
    status: 'normal',
    stress: 0,
    sickTimer: 0,
    mood: 60,
    continuousGood: 0,
    history: { scores: [], ranks: [] },
    talents: [],
    mastery: {},
    effArts: 1.0,
    effSci: 1.0,
    birthdayMonth: 0,
    skipStudy: false
};

// 初始状态由模板深拷贝而来（两者永不漂移）
let State = JSON.parse(JSON.stringify(DEFAULT_STATE));

function saveGame() {
    try { if (State.students && State.students.length > 0) localStorage.setItem('whk_save_v2', JSON.stringify(State)); } catch (e) {}
}

// 把一份存档合并成"完整的 State 形状"：老存档缺什么就补什么，
// 已有的数值原样保留（不会被默认值覆盖）。纯函数，方便出错时单独排查。
function migrateSave(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error('存档内容不是有效的对象');
    }
    const merged = Object.assign({}, DEFAULT_STATE, raw);
    // 嵌套对象必须逐层合并：顶层 Object.assign 是浅拷贝，raw 里缺失的嵌套字段
    // 会整体退回默认值，而缺失的子字段（如老存档的 fac.psy）也要在这里补齐
    merged.weather = Object.assign({}, DEFAULT_STATE.weather, merged.weather || {});
    merged.fac = Object.assign({}, DEFAULT_STATE.fac, merged.fac || {});
    merged.tempAlloc = Object.assign({}, merged.tempAlloc || {});
    merged.eventCooldowns = Object.assign({}, merged.eventCooldowns || {});
    merged.birthdayTriggered = Object.assign({}, merged.birthdayTriggered || {});
    merged.monthStartScores = Array.isArray(merged.monthStartScores) ? merged.monthStartScores : [];
    merged.students = Array.isArray(merged.students) ? merged.students : [];

    merged.students = merged.students.map(st => {
        const s = Object.assign({}, DEFAULT_STUDENT, st || {});
        s.history = Object.assign({}, DEFAULT_STUDENT.history, s.history || {});
        s.history.scores = Array.isArray(s.history.scores) ? s.history.scores : [];
        s.history.ranks = Array.isArray(s.history.ranks) ? s.history.ranks : [];
        s.mastery = Object.assign({}, s.mastery || {});
        // 六个科目 key 必须都在，缺失的补 0（老存档可能缺整块 mastery）
        if (typeof CONFIG !== 'undefined' && CONFIG.SUBJECTS) {
            CONFIG.SUBJECTS.forEach(sub => {
                if (typeof s.mastery[sub.id] !== 'number') s.mastery[sub.id] = 0;
            });
        }
        s.talents = Array.isArray(s.talents) ? s.talents : [];
        return s;
    });
    return merged;
}

function checkSavedGame() {
    const s = localStorage.getItem('whk_save_v2');
    if (!s) return; // 没有存档：什么都不做，属于正常情况
    try {
        const btn = document.createElement('button');
        btn.className = 'btn-action';
        btn.style.marginTop = '12px';
        btn.style.borderColor = 'var(--btn-accent)';
        btn.style.textAlign = 'center';
        btn.innerHTML = `<h5 style="color:var(--btn-accent);font-size:1.1em;justify-content:center;">继续游戏</h5><p>发现存档，点击恢复</p>`;
        btn.onclick = () => {
            // 读档失败必须让玩家看到原因，不能再静默无反应
            let parsed;
            try {
                parsed = migrateSave(JSON.parse(s));
            } catch (e) {
                console.error('[存档] 恢复失败：', e);
                alert('存档已损坏或不兼容，无法继续游戏。\n请点击「重新开始」开始新的一局。\n\n（详情：' + e.message + '）');
                return;
            }
            State = parsed;
            try {
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
            } catch (e) {
                console.error('[存档] 读档已合并但界面刷新失败：', e);
                alert('存档已读取，但界面刷新失败：' + e.message + '\n请刷新页面重试。');
            }
        };
        document.getElementById('start-box-inner').appendChild(btn);
    } catch (e) {
        // 生成「继续游戏」按钮本身失败：记录并告知玩家，避免毫无反应
        console.error('[存档] 无法生成继续游戏按钮：', e);
        try {
            alert('检测到存档，但恢复入口创建失败：' + e.message + '\n请刷新页面重试，或重新开始新的一局。');
        } catch (e2) { /* 连 alert 都不可用时只能保留 console.error */ }
    }
}

function updateDiffBadge() {
    const badge = document.getElementById('diff-badge');
    const names = { easy: '简单', normal: '普通', hard: '困难' };
    badge.textContent = names[State.diff] || '普通';
    badge.className = 'diff-badge ' + (State.diff || 'normal');
}

