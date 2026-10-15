// ============================================================
// 调试面板（dev-tools）
// ============================================================
// 触发方式：按 D 键 → 3 秒内依次输入 y c 6 n → 自动弹出面板
//
// 设计要点：
//   1. 全程不影响正常游戏：不在输入框里时按 D 才记录，输入框内打字会被忽略
//   2. 单键 'd' 不会被任何现有功能占用（本项目此前没有任何键盘监听）
//   3. 面板只在内存里操作 State，所有改动都走 saveGame() + Game.updateUI()
//   4. 不引入任何外部依赖，符合 file:// 单文件约束

const DebugPanel = {
    // ---- 触发序列 ----
    SECRET: ['y', 'c', '6', 'n'],
    TRIGGER_KEY: 'd',
    WINDOW_MS: 3000,

    _armed: false,      // 是否已按下 D，等待输入暗号
    _armedAt: 0,        // 按下 D 的时间戳
    _progress: [],      // 暗号已匹配到第几位
    _timer: null,       // 3 秒倒计时
    _installed: false,
    _open: false,

    // ============================================================
    // 安装键盘监听
    // ============================================================
    install() {
        if (this._installed) return;
        this._installed = true;
        document.addEventListener('keydown', (e) => this.onKeyDown(e), true);
    },

    /** 当前焦点是否在可输入元素里（避免抢用户打字） */
    _isTyping() {
        const el = document.activeElement;
        if (!el) return false;
        const tag = (el.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
        if (el.isContentEditable) return true;
        return false;
    },

    onKeyDown(e) {
        // 允许 Esc 直接关闭面板（无论焦点在哪）
        if (e.key === 'Escape' && this._open) {
            this.close();
            return;
        }
        // 带修饰键的组合（Ctrl+D 收藏等）不拦截，交还浏览器
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        // 正在输入框里打字 → 完全不干预
        if (this._isTyping()) return;

        const key = (e.key || '').toLowerCase();

        // ---- 第一击：D ----
        if (!this._armed) {
            if (key === this.TRIGGER_KEY) {
                this._arm();
                e.preventDefault();
            }
            return;
        }

        // ---- 已进入 3 秒窗口，匹配暗号 ----
        this._matchSecret(key, e);
    },

    // ============================================================
    // 触发逻辑
    // ============================================================
    _arm() {
        this._armed = true;
        this._armedAt = Date.now();
        this._progress = [];
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this._disarm(), this.WINDOW_MS);
    },

    _matchSecret(key, e) {
        const elapsed = Date.now() - this._armedAt;
        if (elapsed > this.WINDOW_MS) {
            this._disarm();
            return;
        }

        const expect = this.SECRET[this._progress.length];
        if (key === expect) {
            this._progress.push(key);
            e.preventDefault();

            if (this._progress.length === this.SECRET.length) {
                // 全中
                this._disarm();
                this.open();
            }
        } else {
            // 输错即作废：立刻取消，必须重新按 D 开始。
            // （这是开发者工具，宽松匹配没有必要，严格更可预期。）
            this._disarm();
        }
    },

    _disarm() {
        this._armed = false;
        this._progress = [];
        clearTimeout(this._timer);
        this._timer = null;
    },

    // ============================================================
    // 面板开关
    // ============================================================
    open() {
        let el = document.getElementById('debug-panel');
        if (!el) {
            el = document.createElement('div');
            el.id = 'debug-panel';
            el.className = 'overlay hidden';
            document.body.appendChild(el);
        }
        el.innerHTML = this.render();
        el.classList.remove('hidden');
        this._open = true;
        // 首次打开时必须主动渲染默认标签页的内容，
        // 否则 #dbg-body 是空的，要切一次标签才出现。
        this._tab = this._tab || 'res';
        this.renderBody();
        this.refreshLive();
    },

    close() {
        const el = document.getElementById('debug-panel');
        if (el) el.classList.add('hidden');
        this._open = false;
    },

    /** 是否已开局（没开局时很多操作没有意义） */
    _started() {
        return !!(State.students && State.students.length);
    },

    // ============================================================
    // 渲染
    // ============================================================
    render() {
        const started = this._started();
        const warn = started ? '' :
            `<div class="dbg-warn">⚠️ 尚未开局：请先在开始界面点「开始游戏」，否则下列多数操作无效。</div>`;

        return `
        <div class="modal-box dbg-box">
            <div class="dbg-head">
                <h2 class="modal-title" style="margin:0;">🛠️ 调试面板</h2>
                <button class="dbg-close" onclick="DebugPanel.close()" title="Esc 关闭">✕</button>
            </div>
            ${warn}
            <div class="dbg-tabs">
                <button class="dbg-tab active" data-dbg-tab="res" onclick="DebugPanel.tab('res')">💰 资源</button>
                <button class="dbg-tab" data-dbg-tab="stu" onclick="DebugPanel.tab('stu')">👥 学生</button>
                <button class="dbg-tab" data-dbg-tab="fac" onclick="DebugPanel.tab('fac')">🏫 设施</button>
                <button class="dbg-tab" data-dbg-tab="time" onclick="DebugPanel.tab('time')">📅 时间</button>
                <button class="dbg-tab" data-dbg-tab="raw" onclick="DebugPanel.tab('raw')">📋 状态</button>
            </div>
            <div class="dbg-body" id="dbg-body"></div>
            <div class="dbg-foot">
                <span class="dbg-live" id="dbg-live"></span>
                <button class="dbg-btn dbg-btn-danger" onclick="DebugPanel.resetProgress()">重新开局</button>
                <button class="dbg-btn" onclick="DebugPanel.clearSave()">清存档</button>
            </div>
        </div>`;
    },

    tab(name) {
        document.querySelectorAll('#debug-panel .dbg-tab').forEach(b => {
            b.classList.toggle('active', b.dataset.dbgTab === name);
        });
        this._tab = name;
        this.renderBody();
    },

    renderBody() {
        const body = document.getElementById('dbg-body');
        if (!body) return;
        const t = this._tab || 'res';
        if (t === 'res') body.innerHTML = this.viewRes();
        else if (t === 'stu') body.innerHTML = this.viewStu();
        else if (t === 'fac') body.innerHTML = this.viewFac();
        else if (t === 'time') body.innerHTML = this.viewTime();
        else body.innerHTML = this.viewRaw();
    },

    // ---------- 资源 ----------
    viewRes() {
        const g = (id, label, val, step) => `
            <div class="dbg-row">
                <label>${label}</label>
                <input type="number" id="${id}" class="dbg-num" value="${val}" step="${step || 1}">
                <button class="dbg-btn" onclick="DebugPanel.applyNum('${id}')">设置</button>
            </div>`;
        return `
            <div class="dbg-sec">
                ${g('dbg-money', '💰 金钱 ¥', Math.round(State.money || 0), 100)}
                ${g('dbg-ap', '⚡ 行动力 AP', State.ap ?? 0, 1)}
                ${g('dbg-maxap', '⚡ AP 上限', State.maxAp ?? 3, 1)}
            </div>
            <div class="dbg-sec dbg-quick">
                <button class="dbg-btn" onclick="DebugPanel.addMoney(1000)">+¥1000</button>
                <button class="dbg-btn" onclick="DebugPanel.addMoney(10000)">+¥10000</button>
                <button class="dbg-btn" onclick="DebugPanel.setAp(99)">AP 拉满</button>
            </div>
            <div class="dbg-sec">
                <div class="dbg-row">
                    <label>难度</label>
                    <select id="dbg-diff" class="dbg-num">
                        ${['easy', 'normal', 'hard'].map(d =>
                            `<option value="${d}"${State.diff === d ? ' selected' : ''}>${({ easy: '简单', normal: '普通', hard: '困难' })[d]}</option>`).join('')}
                    </select>
                    <button class="dbg-btn" onclick="DebugPanel.applyDiff()">应用</button>
                </div>
            </div>`;
    },

    // ---------- 学生 ----------
    viewStu() {
        if (!this._started()) return `<div class="dbg-empty">尚未开局</div>`;
        const subIds = CONFIG.SUBJECTS.map(s => s.id);
        const rows = State.students.map((s, i) => {
            const total = Object.values(s.mastery).reduce((a, b) => a + b, 0);
            const subs = CONFIG.SUBJECTS.map(sub => `
                <div class="dbg-subrow">
                    <span class="dbg-subname">${sub.n}</span>
                    <input type="number" class="dbg-mini" id="dbg-m-${i}-${sub.id}"
                           value="${Math.round(s.mastery[sub.id] || 0)}" step="5" min="0" max="${sub.cap}">
                    <span class="dbg-cap">/${sub.cap}</span>
                </div>`).join('');
            return `
            <div class="dbg-stu">
                <div class="dbg-stu-head">
                    <strong>${i + 1}. ${s.name}</strong>
                    <span class="dbg-total">总分 ${Math.round(total)}</span>
                </div>
                <div class="dbg-meters">
                    <div class="dbg-row">
                        <label>压力</label>
                        <input type="number" class="dbg-num" id="dbg-stress-${i}" value="${Math.round(s.stress)}" step="5">
                        <button class="dbg-btn" onclick="DebugPanel.setStress(${i},0)">归零</button>
                    </div>
                    <div class="dbg-row">
                        <label>心情</label>
                        <input type="number" class="dbg-num" id="dbg-mood-${i}" value="${Math.round(s.mood)}" step="5">
                        <button class="dbg-btn" onclick="DebugPanel.setMood(${i},100)">拉满</button>
                    </div>
                    <div class="dbg-row">
                        <label>病假</label>
                        <input type="number" class="dbg-num" id="dbg-sick-${i}" value="${s.sickTimer || 0}" step="1">
                        <button class="dbg-btn" onclick="DebugPanel.heal(${i})">治愈</button>
                    </div>
                </div>
                <div class="dbg-subs">${subs}</div>
                <div class="dbg-tags">天赋：${(s.talents || []).map(t => `<span class="dbg-tag">${t.n}</span>`).join('') || '无'}</div>
                <div class="dbg-quick">
                    <button class="dbg-btn" onclick="DebugPanel.setAllSubjects(${i},0.95)">全科 95%</button>
                    <button class="dbg-btn" onclick="DebugPanel.setAllSubjects(${i},0.60)">全科 60%</button>
                    <button class="dbg-btn" onclick="DebugPanel.applyStu(${i})">应用本卡</button>
                </div>
            </div>`;
        }).join('');
        return `<div class="dbg-sec">${rows}</div>
            <div class="dbg-sec dbg-quick">
                <button class="dbg-btn" onclick="DebugPanel.allStress(0)">全班压力归零</button>
                <button class="dbg-btn" onclick="DebugPanel.allMood(100)">全班心情拉满</button>
                <button class="dbg-btn" onclick="DebugPanel.clearNegTalents()">清除全班负面天赋</button>
            </div>`;
    },

    // ---------- 设施 ----------
    viewFac() {
        const rows = CONFIG.FACILITIES.map(f => {
            const lv = State.fac[f.id] || 0;
            const max = f.lv.length - 1;
            return `
            <div class="dbg-row">
                <label>${f.n}</label>
                <span class="dbg-faclv">Lv.${lv} / ${max}　${f.lv[lv] || '—'}</span>
                <button class="dbg-btn" onclick="DebugPanel.setFac('${f.id}',${Math.min(max, lv + 1)})">+1</button>
                <button class="dbg-btn" onclick="DebugPanel.setFac('${f.id}',${max})">满级</button>
                <button class="dbg-btn" onclick="DebugPanel.setFac('${f.id}',0)">归零</button>
            </div>`;
        }).join('');
        return `<div class="dbg-sec">${rows}</div>
            <div class="dbg-sec dbg-quick">
                <button class="dbg-btn" onclick="DebugPanel.allFacMax()">全部满级</button>
                <button class="dbg-btn" onclick="DebugPanel.allFacZero()">全部归零</button>
            </div>`;
    },

    // ---------- 时间 ----------
    viewTime() {
        return `
            <div class="dbg-sec">
                <div class="dbg-row">
                    <label>年</label><input type="number" class="dbg-num" id="dbg-y" value="${State.year}" step="1">
                </div>
                <div class="dbg-row">
                    <label>月</label><input type="number" class="dbg-num" id="dbg-mo" value="${State.month}" step="1" min="1" max="12">
                </div>
                <div class="dbg-row">
                    <label>周</label><input type="number" class="dbg-num" id="dbg-wk" value="${State.week}" step="1" min="1" max="4">
                </div>
                <button class="dbg-btn" onclick="DebugPanel.applyTime()">应用时间</button>
            </div>
            <div class="dbg-sec dbg-quick">
                <button class="dbg-btn" onclick="DebugPanel.advanceMonth(1)">+1 月</button>
                <button class="dbg-btn" onclick="DebugPanel.advanceMonth(3)">+3 月</button>
                <button class="dbg-btn" onclick="DebugPanel.jumpToGaokao()">⏩ 跳到高考</button>
            </div>
            <div class="dbg-sec dbg-quick">
                <button class="dbg-btn" onclick="Game.prepareExam('调试月考')">立即触发月考</button>
                <button class="dbg-btn" onclick="DebugPanel.cooldownReset()">清空事件冷却</button>
            </div>`;
    },

    // ---------- 原始状态 ----------
    viewRaw() {
        let json = '';
        try { json = JSON.stringify(State, null, 2); } catch (e) { json = String(e); }
        return `
            <div class="dbg-sec">
                <div class="dbg-quick" style="margin-bottom:8px;">
                    <button class="dbg-btn" onclick="DebugPanel.copyState()">复制 JSON</button>
                    <button class="dbg-btn" onclick="DebugPanel.renderBody()">刷新</button>
                </div>
                <textarea class="dbg-json" id="dbg-json" spellcheck="false">${json.replace(/</g, '&lt;')}</textarea>
                <button class="dbg-btn dbg-btn-danger" onclick="DebugPanel.importState()">导入上面的 JSON</button>
            </div>`;
    },

    // ============================================================
    // 操作实现
    // ============================================================
    /** 改动后统一收尾：存档 + 刷新界面 */
    _commit(msg) {
        try { saveGame(); } catch (e) { }
        try { Game.updateUI(); } catch (e) { }
        try { Game.updateCountdown(); } catch (e) { }
        this.refreshLive();
        if (msg) {
            try { Game.log(`[调试] ${msg}`, "[调试]"); } catch (e) { }
        }
    },

    _num(id, fallback) {
        const el = document.getElementById(id);
        if (!el) return fallback;
        const v = parseFloat(el.value);
        return isNaN(v) ? fallback : v;
    },

    applyNum(id) {
        const v = this._num(id, null);
        if (v === null) return;
        if (id === 'dbg-money') { State.money = Math.round(v); this._commit(`金钱 → ¥${State.money}`); }
        else if (id === 'dbg-ap') { State.ap = Math.max(0, Math.round(v)); this._commit(`AP → ${State.ap}`); }
        else if (id === 'dbg-maxap') { State.maxAp = Math.max(1, Math.round(v)); this._commit(`AP 上限 → ${State.maxAp}`); }
    },

    addMoney(n) {
        State.money = Math.round((State.money || 0) + n);
        this._commit(`金钱 +${n} → ¥${State.money}`);
        this.renderBody();
    },

    setAp(n) {
        State.ap = n;
        this._commit(`AP → ${n}`);
        this.renderBody();
    },

    applyDiff() {
        const el = document.getElementById('dbg-diff');
        if (!el) return;
        State.diff = el.value;
        State.mode = el.value;
        try { updateDiffBadge(); } catch (e) { }
        this._commit(`难度 → ${el.value}`);
    },

    // ---- 学生 ----
    setStress(i, v) {
        const s = State.students[i];
        if (!s) return;
        s.stress = v;
        this._commit(`${s.name} 压力 → ${v}`);
        this.renderBody();
    },

    setMood(i, v) {
        const s = State.students[i];
        if (!s) return;
        s.mood = v;
        this._commit(`${s.name} 心情 → ${v}`);
        this.renderBody();
    },

    heal(i) {
        const s = State.students[i];
        if (!s) return;
        s.sickTimer = 0;
        this._commit(`${s.name} 已治愈`);
        this.renderBody();
    },

    setAllSubjects(i, ratio) {
        const s = State.students[i];
        if (!s) return;
        CONFIG.SUBJECTS.forEach(sub => {
            s.mastery[sub.id] = Math.round(sub.cap * ratio);
        });
        this._commit(`${s.name} 全科 → ${Math.round(ratio * 100)}%`);
        this.renderBody();
    },

    /** 把某张学生卡片上所有输入框的值一次性写回 */
    applyStu(i) {
        const s = State.students[i];
        if (!s) return;

        const stress = this._num(`dbg-stress-${i}`, null);
        const mood = this._num(`dbg-mood-${i}`, null);
        const sick = this._num(`dbg-sick-${i}`, null);
        if (stress !== null) s.stress = Math.max(0, Math.min(100, stress));
        if (mood !== null) s.mood = Math.max(0, Math.min(100, mood));
        if (sick !== null) s.sickTimer = Math.max(0, Math.round(sick));

        CONFIG.SUBJECTS.forEach(sub => {
            const v = this._num(`dbg-m-${i}-${sub.id}`, null);
            if (v !== null) {
                s.mastery[sub.id] = Math.max(0, Math.min(sub.cap, v));
            }
        });
        this._commit(`${s.name} 已应用`);
        this.renderBody();
    },

    allStress(v) {
        State.students.forEach(s => { s.stress = v; });
        this._commit(`全班压力 → ${v}`);
        this.renderBody();
    },

    allMood(v) {
        State.students.forEach(s => { s.mood = v; });
        this._commit(`全班心情 → ${v}`);
        this.renderBody();
    },

    clearNegTalents() {
        const negIds = CONFIG.TALENTS.filter(t => t.t === 'neg').map(t => t.id);
        let n = 0;
        State.students.forEach(s => {
            const before = s.talents.length;
            s.talents = s.talents.filter(t => !negIds.includes(t.id));
            n += before - s.talents.length;
        });
        this._commit(`清除 ${n} 个负面天赋`);
        this.renderBody();
    },

    // ---- 设施 ----
    setFac(id, lv) {
        State.fac[id] = lv;
        this._commit(`设施 ${id} → Lv.${lv}`);
        this.renderBody();
    },

    allFacMax() {
        CONFIG.FACILITIES.forEach(f => { State.fac[f.id] = f.lv.length - 1; });
        this._commit('全部设施满级');
        this.renderBody();
    },

    allFacZero() {
        CONFIG.FACILITIES.forEach(f => { State.fac[f.id] = 0; });
        this._commit('全部设施归零');
        this.renderBody();
    },

    // ---- 时间 ----
    applyTime() {
        const y = this._num('dbg-y', null);
        const mo = this._num('dbg-mo', null);
        const wk = this._num('dbg-wk', null);
        if (y !== null) State.year = Math.round(y);
        if (mo !== null) State.month = Math.max(1, Math.min(12, Math.round(mo)));
        if (wk !== null) State.week = Math.max(1, Math.min(4, Math.round(wk)));
        this._commit(`时间 → ${State.year}/${State.month} W${State.week}`);
        this.renderBody();
    },

    advanceMonth(n) {
        let m = State.month + n;
        let y = State.year;
        while (m > 12) { m -= 12; y++; }
        State.month = m;
        State.year = y;
        const s = SEASONS[String(m)];
        if (s) State.season = s;
        this._commit(`时间 +${n} 月 → ${State.year}/${State.month}`);
        this.renderBody();
    },

    jumpToGaokao() {
        State.year = 2026;
        State.month = 6;
        State.week = 1;
        State.season = SEASONS['6'] || '夏';
        this._commit('已跳到 2026/6 高考周');
        this.renderBody();
    },

    cooldownReset() {
        State.eventCooldowns = {};
        this._commit('事件冷却已清空');
        this.renderBody();
    },

    // ---- 原始状态 ----
    copyState() {
        const ta = document.getElementById('dbg-json');
        if (!ta) return;
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        if (!ok && navigator.clipboard) {
            navigator.clipboard.writeText(ta.value).catch(() => { });
        }
        try { Game.log('[调试] 状态 JSON 已复制到剪贴板', "[调试]"); } catch (e) { }
    },

    importState() {
        const ta = document.getElementById('dbg-json');
        if (!ta) return;
        if (!confirm('导入会覆盖当前全部进度，确定？')) return;
        let parsed;
        try {
            parsed = JSON.parse(ta.value);
        } catch (e) {
            alert('JSON 解析失败：' + e.message);
            return;
        }
        State = parsed;
        this._commit('已导入状态');
        this.renderBody();
    },

    // ============================================================
    // 底部实时信息
    // ============================================================
    refreshLive() {
        const el = document.getElementById('dbg-live');
        if (!el) return;
        const avg = this._started()
            ? Math.round(State.students.reduce((a, s) => a + Object.values(s.mastery).reduce((x, y) => x + y, 0), 0) / State.students.length)
            : '—';
        el.textContent = `${State.year}/${State.month} W${State.week}　¥${Math.round(State.money || 0)}　AP ${State.ap}/${State.maxAp}　均分 ${avg}`;
    },

    // ============================================================
    // 危险操作
    // ============================================================
    resetProgress() {
        if (!confirm('确定要重新开局吗？当前进度会丢失（存档也会清除）。')) return;
        this.close();
        try { localStorage.removeItem('whk_save_v2'); } catch (e) { }
        location.reload();
    },

    clearSave() {
        if (!confirm('确定清除存档吗？（当前这局仍可继续，刷新后丢失）')) return;
        try { localStorage.removeItem('whk_save_v2'); } catch (e) { }
        alert('存档已清除。');
    }
};

DebugPanel.install();
