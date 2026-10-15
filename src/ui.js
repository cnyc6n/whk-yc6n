// ============================================================
// 完整 JavaScript 代码 (修改版)
// ============================================================

// ===== 学生状态统一钳制（防止事件把数值刷出合法范围） =====
// 压力/心情：0-100；各科成绩：0 ~ 该科满分 cap。
// 所有会改动学生数值的入口都应调用它，避免「钳了压力心情、漏了成绩」。
function clampStudentState(s) {
    if (!s) return;
    s.stress = Math.max(0, Math.min(100, s.stress || 0));
    s.mood = Math.max(0, Math.min(100, s.mood || 0));
    if (!s.mastery) s.mastery = {};
    CONFIG.SUBJECTS.forEach(sub => {
        const v = s.mastery[sub.id] || 0;
        s.mastery[sub.id] = Math.max(0, Math.min(sub.cap, v));
    });
}

// ===== UI 对象（不变） =====
const UI = {
    toggleTheme() {
        const html = document.documentElement;
        const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', next);
        document.getElementById('theme-toggle-btn').textContent = next === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('theme', next);
        if (document.getElementById('chart-page').classList.contains('active')) drawFullChart();
    },
    initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
            document.getElementById('theme-toggle-btn').textContent = saved === 'dark' ? '☀️' : '🌙';
        }
    },
    openChartPage() {
        const page = document.getElementById('chart-page');
        if (!page) return;
        page.style.display = 'flex';
        page.classList.add('active');
        page.offsetHeight;
        setTimeout(() => {
            drawFullChart();
        }, 150);
    },
    closeChartPage() {
        const page = document.getElementById('chart-page');
        if (page) {
            page.classList.remove('active');
            page.style.display = 'none';
        }
    },
    showHelp() {
        this.populateHelpContent();
        document.getElementById('help-modal').classList.remove('hidden');
        this.switchHelpTab('guide');
    },
    switchHelpTab(tab) {
        document.getElementById('help-content-guide').classList.toggle('hidden', tab !== 'guide');
        document.getElementById('help-content-intro').classList.toggle('hidden', tab !== 'intro');
        const gBtn = document.getElementById('help-tab-guide');
        const iBtn = document.getElementById('help-tab-intro');
        gBtn.style.background = tab === 'guide' ? 'var(--btn-accent)' : 'var(--bg-input)';
        iBtn.style.background = tab === 'intro' ? 'var(--btn-accent)' : 'var(--bg-input)';
        gBtn.style.color = tab === 'guide' ? 'white' : 'var(--text-secondary)';
        iBtn.style.color = tab === 'intro' ? 'white' : 'var(--text-secondary)';
    },
    populateHelpContent() {
        const eventList = document.getElementById('event-list');
        eventList.innerHTML = CONFIG.EVENTS.map(e =>
            `<div class="event-item" style="background:var(--bg-input);padding:4px 8px;border-radius:4px;font-size:.85em;border:1px solid var(--border-color);">
                <b>${e.title}</b><br><span style="font-size:.8em;color:var(--text-muted);">${e.desc}</span>
            </div>`
        ).join('');

        const talentList = document.getElementById('talent-list');
        const allTalents = CONFIG.TALENTS.map(t =>
            `<div class="talent-item" style="background:${t.t === 'pos' ? 'var(--tag-pos-bg)' : 'var(--tag-neg-bg)'};padding:4px 8px;border-radius:4px;font-size:.85em;border:1px solid ${t.t === 'pos' ? 'var(--tag-pos-border)' : 'var(--tag-neg-border)'};">
                <span style="font-weight:bold;color:${t.t === 'pos' ? 'var(--tag-pos-text)' : 'var(--tag-neg-text)'};">${t.n}</span>
                <span style="font-size:.75em;color:var(--text-muted);display:block;">${t.d}</span>
            </div>`
        ).join('');
        talentList.innerHTML = allTalents;
    },
    switchTab(id) {
        document.querySelectorAll('.panel-content').forEach(e => e.classList.remove('active'));
        document.querySelectorAll('.sidebar .tab-btn').forEach(e => e.classList.remove('active'));
        document.getElementById(`panel-${id}`).classList.add('active');
        const btns = document.querySelectorAll('.sidebar .tab-btn');
        if (id === 'action') btns[0].classList.add('active');
        else btns[1].classList.add('active');
    },
    toggleMenu(id) {
        const e = document.getElementById(id);
        if (e) e.classList.toggle('active');
    },
    hideAllMenus() {
        document.querySelectorAll('.sub-menu').forEach(e => e.classList.remove('active'));
    },
    closeModal(id) {
        document.getElementById(id).classList.add('hidden');
    },
    closeEventModal() {
        this.closeModal('event-system-modal');
    },
    closeExam() {
    console.log('🔵 closeExam 被调用');
    console.log('   State.week =', State.week);
    console.log('   State.month =', State.month);
    console.log('   Game._examWeek =', Game._examWeek);
    
    this.closeModal('exam-modal');
    
    if (!State.isMockExam) {
        if (Game._examWeek > 4) {
            console.log('   ✅ 检测到月末考试 (examWeek > 4)，生成月度报告');
            Game.generateMonthlyReport();
            Game._examWeek = 0;
        } else {
            console.log('   ❌ 不是月末考试，不生成月度报告');
        }
        
        console.log('   调用 Game.nextTurn()');
        Game.nextTurn();
    } else {
        State.isMockExam = false;
        Game.updateUI();
    }
},
    showHotpotModal() {
        document.getElementById('hotpot-modal').classList.remove('hidden');
    },
    showDoctorModal() {
        const sicks = State.students.map((s, i) => ({ s, i })).filter(x => x.s.sickTimer > 0);
        if (sicks.length === 0) { alert("没有学生生病！"); return; }
        document.getElementById('doctor-list').innerHTML = sicks.map(x =>
            `<div style="background:var(--bg-input);padding:10px;border-radius:6px;border:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                <div><b style="color:var(--text-primary);">${x.s.name}</b> <span style="color:var(--btn-danger);font-size:.8em;">(病假 ${x.s.sickTimer}周)</span></div>
                <button style="padding:6px 14px;background:var(--btn-success);color:white;font-size:.8em;" onclick="Game.healDoctor(${x.i})">治愈 ¥1000</button>
            </div>`
        ).join('');
        document.getElementById('doctor-modal').classList.remove('hidden');
    },
    showWeeklyModal() {
        if (State.isGraduated) return;
        State.tempAlloc = {};
        CONFIG.SUBJECTS.forEach(sub => State.tempAlloc[sub.id] = 0);
        this.renderWeeklyAlloc();
        document.getElementById('weekly-modal').classList.remove('hidden');
    },
    renderWeeklyAlloc() {
        const used = Object.values(State.tempAlloc).reduce((a, b) => a + b, 0);
        document.getElementById('weekly-pts').innerText = 3 - used;
        document.getElementById('weekly-alloc').innerHTML = CONFIG.SUBJECTS.map(sub =>
            `<div style="background:var(--bg-input);padding:6px 10px;border-radius:4px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border-color);font-size:.85em;">
                <b style="color:var(--text-primary);">${sub.n}</b>
                <div>
                    <button style="padding:0 6px;background:var(--border-color);color:var(--text-primary);border-radius:3px;" onclick="UI.modWeekly('${sub.id}',-1)">-</button>
                    <span style="display:inline-block;width:20px;text-align:center;color:var(--text-primary);">${State.tempAlloc[sub.id]||0}</span>
                    <button style="padding:0 6px;background:var(--btn-accent);color:white;border-radius:3px;" onclick="UI.modWeekly('${sub.id}',1)">+</button>
                </div>
            </div>`
        ).join('');
    },
    modWeekly(s, v) {
        if (State.isGraduated) return;
        const used = Object.values(State.tempAlloc).reduce((a, b) => a + b, 0);
        const remaining = 3 - used;
        if (v > 0 && remaining <= 0) return;
        if (v < 0 && (State.tempAlloc[s] || 0) <= 0) return;
        State.tempAlloc[s] = (State.tempAlloc[s] || 0) + v;
        this.renderWeeklyAlloc();
    },
    renderClassroom() {
        document.getElementById('view-classroom').innerHTML = State.students.map((s, idx) => {
            let debuffs = '';
            if (s.mood < 10) debuffs += `<span class="tag" style="background:var(--tag-neg-bg);color:var(--tag-neg-text);border:1px solid var(--tag-neg-border);">🤯 自我怀疑</span>`;
            else if (s.mood < 20) debuffs += `<span class="tag" style="background:var(--cost-bg);color:var(--cost-text);border:1px solid var(--gold-color);">😰 焦虑</span>`;
            else if (s.mood < 30) debuffs += `<span class="tag" style="background:var(--bg-input);color:var(--text-muted);border:1px solid var(--border-color);">😞 厌学</span>`;

            const talentTags = s.talents.map(t =>
                `<span class="tag ${t.t === 'neg' ? 'tag-neg' : 'tag-pos'}" title="${t.d}">${t.n}</span>`
            ).join('');

            const subs = CONFIG.SUBJECTS.map(sub => {
                const score = s.mastery[sub.id] || 0;
                const lv = getLevel(score, sub.cap);
                const eff = getNormalEfficiency(score, sub.cap);
                const estimate = Math.round(score / 10) * 10;
                return `<div class="sub-box">
                    <div class="sub-label">${sub.n}</div>
                    <div class="sub-val" style="color:${lv.color};">${lv.level}</div>
                    <div class="sub-estimate">${estimate}</div>
                    <div class="sub-eff">${Math.round(eff*100)}%</div>
                </div>`;
            }).join('');

            const total = Object.values(s.mastery).reduce((a, b) => a + b, 0);
            const avgEff = CONFIG.SUBJECTS.reduce((sum, sub) => sum + getNormalEfficiency(s.mastery[sub.id] || 0, sub.cap), 0) / CONFIG.SUBJECTS.length;
            const label = avgEff >= 1.3 ? '🚀 高速' : avgEff >= 0.9 ? '📈 稳步' : avgEff >= 0.5 ? '📊 瓶颈' : '🧗 冲刺';

            return `
            <div class="stu-card ${s.sickTimer > 0 ? 'sick' : ''}" id="stu-card-${idx}">
                <div class="stu-header">
                    <span class="stu-name">${s.name} ${s.sickTimer > 0 ? `<span class="badge">病假${s.sickTimer}周</span>` : ''}</span>
                    <span class="stu-label">${label}</span>
                </div>
                <div class="tag-pool">${talentTags}${debuffs}</div>
                <div style="font-size:.65em;color:var(--text-muted);margin-bottom:3px;">总分: <b style="color:var(--text-primary);">${Math.round(total)}</b></div>
                <div class="sub-grid">${subs}</div>
                <div class="eff-row"><span>📖 ${Math.round((s.effArts - 1) * 100)}%</span><span>🔬 ${Math.round((s.effSci - 1) * 100)}%</span></div>
                <div class="status-row">
                    <div class="status-item">
                        <span class="label">压力</span>
                        <span class="value" style="color:${s.stress > 85 ? 'var(--btn-danger)' : 'var(--text-primary)'}">${Math.round(s.stress)}%</span>
                        <div class="stress-bar"><div class="stress-fill" style="width:${Math.min(100, s.stress)}%;background:${s.stress > 85 ? 'var(--btn-danger)' : 'var(--btn-accent)'}"></div></div>
                    </div>
                    <div class="status-item">
                        <span class="label">心情</span>
                        <span class="value" style="color:${s.mood >= 70 ? 'var(--btn-success)' : s.mood >= 40 ? 'var(--gold-color)' : 'var(--btn-danger)'}">${Math.round(s.mood)}</span>
                        <div class="stress-bar"><div class="stress-fill" style="width:${Math.min(100, s.mood)}%;background:${s.mood >= 70 ? 'var(--btn-success)' : s.mood >= 40 ? 'var(--gold-color)' : 'var(--btn-danger)'}"></div></div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },
    renderFacilities() {
        document.getElementById('fac-container').innerHTML = CONFIG.FACILITIES.map(f => {
            const lv = State.fac[f.id] || 0;
            const cost = f.p[lv + 1];
            return `<div style="border:1px solid var(--border-color);border-radius:6px;padding:6px 10px;margin-bottom:5px;display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);font-size:.75em;">
                <div><b style="color:var(--text-primary);">${f.n}</b> <span style="color:var(--btn-accent);font-size:.8em;">Lv.${lv}</span><p style="margin:1px 0 0 0;font-size:.65em;color:var(--text-muted);">${f.d}</p></div>
                <button style="padding:3px 12px;background:var(--btn-primary);color:white;font-size:.75em;" ${lv >= 2 ? 'disabled' : ''} onclick="Game.buyFac('${f.id}')">${lv >= 2 ? '满级' : '¥' + cost}</button>
            </div>`;
        }).join('');
    },
    showEventModal(ev, options) {
        let html = `<div class="choice-grid">`;
        options.forEach((opt, idx) => {
            const disabled = !opt.available ? 'disabled' : '';
            const label = opt.text + (opt.cost ? ` (💰¥${opt.cost})` : '') +
                (opt.costAP ? ` (⚡${opt.costAP}AP)` : '') + opt.conditionText;
            html += `<button class="btn-choice" ${disabled} onclick="UI.handleEventChoice(${idx})">${label}</button>`;
        });
        html += `</div>`;
        document.getElementById('ev-modal-title').innerText = ev.title;
        document.getElementById('ev-modal-desc').innerText = ev.desc;
        document.getElementById('ev-modal-eff').innerHTML = html;
        document.getElementById('event-system-modal').classList.remove('hidden');
        window._currentEvent = ev;
        window._currentOptions = options;
    },
    handleEventChoice(idx) {
        const ev = window._currentEvent;
        const opt = window._currentOptions[idx];
        if (!opt.available) return;
        // ===== 余额兜底：钱/AP 不够就不执行该选项，避免扣成负数 =====
        if (opt.cost && State.money < opt.cost) {
            Game.log(`班费不足（需要 ¥${opt.cost}，当前 ¥${State.money}），无法选择「${opt.text}」`, "[事件]");
            alert(`班费不足！需要 ¥${opt.cost}，当前只有 ¥${State.money}`);
            return;
        }
        if (opt.costAP && State.ap < opt.costAP) {
            Game.log(`AP 不足（需要 ${opt.costAP}AP，当前 ${State.ap}），无法选择「${opt.text}」`, "[事件]");
            alert(`AP 不足！需要 ${opt.costAP}AP，当前只有 ${State.ap}`);
            return;
        }
        let effectDesc = '';
        if (opt.cost) { State.money -= opt.cost; effectDesc += `花费 ¥${opt.cost}；`; }
        if (opt.costAP) { State.ap -= opt.costAP; effectDesc += `消耗 ${opt.costAP}AP；`; }
        if (opt.effect) {
            const fn = opt.effect;
            if (fn.length === 1) {
                const target = Game.getRandStu(1)[0];
                if (target) {
                    const oldStress = target.stress;
                    const oldMood = target.mood;
                    fn(target);
                    // ===== 钳制压力、心情与各科成绩 =====
                    clampStudentState(target);
                    const stressChange = target.stress - oldStress;
                    const moodChange = target.mood - oldMood;
                    effectDesc += `影响学生 ${target.name}：压力${stressChange >= 0 ? '+' : ''}${Math.round(stressChange)}%，心情${moodChange >= 0 ? '+' : ''}${Math.round(moodChange)}%`;
                }
            } else {
                fn();
                // ===== 全班钳制（压力/心情/成绩） =====
                State.students.forEach(st => clampStudentState(st));
                effectDesc += '全班受到影响';
            }
        }
        // ===== 兜底：任何 effect 内部私自扣钱也不允许出现负班费 =====
        State.money = Math.max(0, State.money);
        Game.log(`事件【${ev.title}】已处理：${effectDesc}`, "[事件]");
        UI.closeModal('event-system-modal');
        Game.updateUI();
        saveGame();
    }
};
