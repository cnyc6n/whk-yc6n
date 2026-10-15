// ============================================================
// Game 对象 (修改)
// ============================================================
const Game = {
    _examWeek: 0,
    selectMode(mode) {
        State.mode = mode;
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
        document.querySelector(`.mode-btn[data-mode="${mode}"]`).classList.add('selected');
    },

    confirmBackToMenu() {
        if (State.isGraduated) {
            if (confirm('确认要回到主菜单吗？进度将丢失！')) location.reload();
            return;
        }
        if (confirm('确认要回到主菜单吗？当前进度将丢失！')) location.reload();
    },

    calculateInitialEfficiency(talents) {
        let sciCount = 0, artsCount = 0;
        talents.forEach(t => {
            if (t.type === 'sci') sciCount++;
            if (t.type === 'arts') artsCount++;
            if (t.type === 'all') { if (Math.random() < 0.5) sciCount += 0.3; else artsCount += 0.3; }
        });
        const baseSci = 0.85 + Math.random() * 0.3;
        const baseArts = 0.85 + Math.random() * 0.3;
        let effSci = Math.min(1.4, baseSci + sciCount * 0.08);
        let effArts = Math.min(1.4, baseArts + artsCount * 0.08);
        if (talents.some(t => t.id === 'n3')) {
            if (Math.random() < 0.5) effSci = Math.max(0.7, effSci - 0.15);
            else effArts = Math.max(0.7, effArts - 0.15);
        }
        if (talents.some(t => t.id === 'n4')) effSci = Math.max(0.7, effSci - 0.10);
        if (talents.some(t => t.id === 'n5')) effArts = Math.max(0.7, effArts - 0.08);
        return { effSci, effArts };
    },

    distributeStats(talents, targetTotal) {
        const w = { chi: 1, mat: 1, eng: 1, phy: 1, che: 1, bio: 1 };
        talents.forEach(t => {
            if (t.id === 't1') { w.mat += 0.5; w.phy += 0.5; w.che += 0.4; w.bio += 0.4; }
            if (t.id === 't2') { w.chi += 0.5; w.eng += 0.5; }
            if (t.id === 't4') { w.che += 0.6; w.bio += 0.6; }
            if (t.id === 't5') { Object.keys(w).forEach(k => w[k] += 0.2); }
            if (t.id === 'n1') { Object.keys(w).forEach(k => w[k] -= 0.1); }
            if (t.id === 'n3') { const keys = Object.keys(w); w[keys[Math.floor(Math.random() * keys.length)]] -= 0.6; }
            if (t.id === 'n4') { w.mat -= 0.3; w.phy -= 0.3; }
        });
        Object.keys(w).forEach(k => { w[k] = Math.max(0.1, w[k] * (0.85 + Math.random() * 0.3)); });
        const sum = Object.values(w).reduce((a, b) => a + b, 0);
        const mastery = {};
        CONFIG.SUBJECTS.forEach(sub => {
            mastery[sub.id] = Math.max(15, Math.min(sub.cap - 5, Math.round(targetTotal * (w[sub.id] / sum))));
        });
        return mastery;
    },

    startGame() {
        const diff = State.mode;
        State.diff = diff;
        const defaultNames = ["Debug618", "cyrel", "Snoozing_QwQ", "lxy_qwq", "Groyhj", "zenghaoran"];
        const names = [];
        for (let i = 0; i < 6; i++) {
            const input = document.getElementById(`name-${i}`).value.trim();
            names.push(input || defaultNames[i]);
        }

        let targetScore = 380;
        if (diff === 'easy') { State.money = 10000; targetScore = 440; }
        else if (diff === 'normal') { State.money = 5000; targetScore = 380; }
        else { State.money = 1000; targetScore = 330; }

        const posPool = CONFIG.TALENTS.filter(t => t.t === 'pos');
        const negPool = CONFIG.TALENTS.filter(t => t.t === 'neg');

        State.students = names.map(n => {
            const talents = [...this.shuffleArray([...posPool]).slice(0, 2), ...this.shuffleArray([...negPool]).slice(0, 1)];
            const cost = talents.reduce((s, t) => s + (t.cost || 0), 0);
            const target = Math.max(300, Math.min(580, targetScore + (Math.random() * 40 - 20) - cost * 8));
            const mastery = this.distributeStats(talents, target);
            const { effSci, effArts } = this.calculateInitialEfficiency(talents);
            return {
                name: n,
                status: 'normal',
                stress: 20 + Math.random() * 30,
                sickTimer: 0,
                mood: 50 + Math.floor(Math.random() * 31),
                continuousGood: 0,
                history: { scores: [], ranks: [] },
                talents: talents,
                mastery: mastery,
                effArts: effArts,
                effSci: effSci,
                birthdayMonth: 0,
                skipStudy: false // 新增
            };
        });

        // ---- 彩蛋：Snoozing ----
        State.students.forEach(s => {
            if (s.name === 'Snoozing') {
                s.mastery.chi = 10;
                s.mastery.eng = 148;
                s.effSci = 1.2;
                s.effArts = 0.01;
                const diff = State.diff;
                let baseTotal = 380;
                if (diff === 'easy') baseTotal = 440;
                else if (diff === 'normal') baseTotal = 380;
                else baseTotal = 330;
                const remaining = Math.max(0, baseTotal - 158);
                const per = Math.floor(remaining / 4);
                s.mastery.mat = Math.min(150, Math.max(20, per + 10));
                s.mastery.phy = Math.min(100, Math.max(15, per));
                s.mastery.che = Math.min(100, Math.max(15, per));
                s.mastery.bio = Math.min(100, Math.max(15, per));
                let newTotal = Object.values(s.mastery).reduce((a, b) => a + b, 0);
                let diffTotal = baseTotal - newTotal;
                if (diffTotal > 0) s.mastery.mat = Math.min(150, s.mastery.mat + diffTotal);
                else if (diffTotal < 0) s.mastery.mat = Math.max(20, s.mastery.mat + diffTotal);
                this.log(`✨ 彩蛋：Snoozing 特殊属性已激活 (语文E，英语SSS，理科效率+20%，文科效率-99%)`, "[彩蛋:语文比英语差这一块]");
            }
        });

        State.monthStartScores = State.students.map(s => Object.values(s.mastery).reduce((a, b) => a + b, 0));

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('main-header').classList.remove('hidden');
        document.getElementById('main-body').classList.remove('hidden');
        updateDiffBadge();

        this.updateWeather();
        this.log("新学期开始！", "[档案建立]");
        this.updateUI();
        this.updateCountdown();
        saveGame();

        if (!localStorage.getItem('tutorial_shown')) {
            UI.showHelp();
            localStorage.setItem('tutorial_shown', 'true');
        }
    },

    shuffleArray(arr) {
        const r = [...arr];
        for (let i = r.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [r[i], r[j]] = [r[j], r[i]];
        }
        return r;
    },

    getDiffMultiplier() {
        if (State.diff === 'easy') return 1.15;
        if (State.diff === 'hard') return 0.70;
        return 0.85;
    },

    calculateGain(subjectId, currentScore, baseGain, student) {
        const cap = CONFIG.SUBJECTS.find(x => x.id === subjectId).cap;
        let eff = getNormalEfficiency(currentScore, cap);
        const isArts = (subjectId === 'chi' || subjectId === 'eng');
        const isSci = !isArts;
        student.talents.forEach(t => {
            if (t.id === 't1' && isSci) eff *= 1.15;
            if (t.id === 't2' && isArts) eff *= 1.15;
            if (t.id === 't4' && (subjectId === 'che' || subjectId === 'bio')) eff *= 1.20;
            if (t.id === 't5') eff *= 1.05;
        });
        if (isArts) eff *= student.effArts;
        if (isSci) eff *= student.effSci;
        if (student.stress > 80) eff *= Math.max(0, 1 - (student.stress - 80) / 100);
        if (student.skipStudy) { // 如果本周逃课，增益为0
            return { gain: 0, efficiency: eff };
        }
        return { gain: Math.max(0.02, baseGain * eff), efficiency: eff };
    },

    doAction(cat, sub) {
        if (State.isGraduated) {
            if (cat === 'rest' && sub === 'snack') {
                State.students.forEach(s => { s.stress = Math.max(0, s.stress - 20); s.mood = Math.min(100, s.mood + 5); });
                this.log("同学们请你吃了小吃！", "[温馨回忆]");
                this.updateUI();
                return;
            }
            if (cat === 'rest' && sub === 'movie') {
                State.students.forEach(s => { s.mood = Math.min(100, s.mood + 10); });
                this.log("同学们一起看电影，心情大好！", "[温馨回忆]");
                this.updateUI();
                return;
            }
            if (cat === 'work' && sub === 'earn') {
                State.money += 1000;
                this.log("毕业生勤工俭学，班费+1000", "[温馨回忆]");
                this.updateUI();
                return;
            }
            return alert("已经毕业啦！");
        }

        // BUG-6 修复：用独立布尔标志表达「无限 AP」，不再把 ap 污染成字符串 'INF'。
        // State.unlimitedAp 缺失（老存档）时按 false 处理，行为与修复前完全一致。
        const infiniteAp = State.unlimitedAp === true;

        // ===== 勤工俭学 =====
        if (cat === 'work' && sub === 'earn') {
            if (!infiniteAp && State.ap < 1) return alert("AP不足！");
            if (!infiniteAp) State.ap -= 1;
            State.money += 1000;
            this.log("💼 勤工俭学，赚取 ¥1000", "[资金]");
            UI.hideAllMenus();
            this.updateUI();
            saveGame();
            return;
        }

        if (cat === 'eff') {
            if (State.money < 1500 || (!infiniteAp && State.ap < 1)) return alert("资源不足！");
            State.money -= 1500;
            if (!infiniteAp) State.ap -= 1;
            State.students.forEach(s => {
                if (sub === 'arts') s.effArts = Math.min(1.5, s.effArts + 0.08);
                if (sub === 'sci') s.effSci = Math.min(1.5, s.effSci + 0.08);
            });
            this.log(`${sub === 'arts' ? '文' : '理'}科指导`, `[效率提升]`);
            UI.hideAllMenus();
            this.updateUI();
            saveGame();
            return;
        }

        if (!infiniteAp && State.ap < 1) return alert("AP不足！");
        let costAP = cat === 'train' ? 2 : (cat === 'intensive' ? 3 : 1);
        let costMoney = cat === 'train' ? 2000 : cat === 'intensive' ? 3000 : cat === 'test' ? 500 : (cat === 'rest' && sub === 'snack' ? 400 : (cat === 'rest' && sub === 'movie' ? 500 : 0));
        if (!infiniteAp && State.ap < costAP) return alert("AP不足！");
        if (State.money < costMoney) return alert("班费不足！");
        if (!infiniteAp) State.ap -= costAP;
        if (costMoney > 0) State.money -= costMoney;

        const techBonus = 1 + (State.fac.tech * 0.15);
        const diffMod = this.getDiffMultiplier();

        State.students.forEach(s => {
            if (s.sickTimer > 0) return;
            if (s.skipStudy) {
                // 逃课学生不获得学习增益，但可能增加压力或降低心情
                s.stress = Math.min(100, s.stress + 5);
                s.mood = Math.max(0, s.mood - 3);
                return; // 跳过该学生
            }
            if (cat === 'study' || cat === 'test') {
                let baseGain = (sub === 'chi' ? 1.2 : 2.0) * techBonus * diffMod;
                if (cat === 'test') baseGain *= 1.3;
                const result = this.calculateGain(sub, s.mastery[sub] || 0, baseGain, s);
                const cap = CONFIG.SUBJECTS.find(x => x.id === sub).cap;
                s.mastery[sub] = Math.min(cap, (s.mastery[sub] || 0) + result.gain);
                s.stress = Math.min(100, s.stress + Math.max(2, (cat === 'test' ? 20 : 15) - State.fac.desk * 5));
            } else if (cat === 'train') {
                sub.split('_').forEach(su => {
                    const baseGain = (su === 'chi' ? 1.2 : 2.0) * 1.6 * techBonus * diffMod;
                    const result = this.calculateGain(su, s.mastery[su] || 0, baseGain, s);
                    const cap = CONFIG.SUBJECTS.find(x => x.id === su).cap;
                    s.mastery[su] = Math.min(cap, (s.mastery[su] || 0) + result.gain);
                });
                s.stress = Math.min(100, s.stress + Math.max(10, 30 - State.fac.desk * 5));
            } else if (cat === 'intensive') {
                const baseGain = (sub === 'chi' ? 1.2 : 2.0) * 5.0 * techBonus * diffMod;
                const result = this.calculateGain(sub, s.mastery[sub] || 0, baseGain, s);
                const cap = CONFIG.SUBJECTS.find(x => x.id === sub).cap;
                s.mastery[sub] = Math.min(cap, (s.mastery[sub] || 0) + result.gain);
                s.stress = Math.min(100, s.stress + Math.max(10, 35 - State.fac.desk * 5));
            } else if (cat === 'rest') {
                if (sub === 'walk') { s.stress = Math.max(0, s.stress - 20); s.mood = Math.min(100, s.mood + 2); }
                if (sub === 'snack') { s.stress = Math.max(0, s.stress - 30); s.mood = Math.min(100, s.mood + 5); }
                if (sub === 'movie') { s.mood = Math.min(100, s.mood + 10); }
            }
        });

        UI.hideAllMenus();
        const name = CONFIG.SUBJECTS.find(x => x.id === sub);
        let actionName = '';
        if (cat === 'study') actionName = '自习';
        else if (cat === 'test') actionName = '小测';
        else if (cat === 'train') actionName = '专项训练';
        else if (cat === 'intensive') actionName = '🔥特训';
        else if (cat === 'rest') {
            if (sub === 'walk') actionName = '散步';
            else if (sub === 'snack') actionName = '小吃';
            else if (sub === 'movie') actionName = '看电影';
        }
        this.log(`${actionName} ${name ? name.n : ''}`);
        this.updateUI();
        saveGame();
    },

    buyFac(id) {
        if (State.isGraduated) return alert("已毕业！");
        const f = CONFIG.FACILITIES.find(x => x.id === id);
        const lv = State.fac[id] || 0;
        const cost = f.p[lv + 1];
        if (!cost) return alert("已满级！");
        if (State.money >= cost) {
            State.money -= cost;
            State.fac[id] = lv + 1;
            this.updateUI();
            this.log(`升级 ${f.n}`, `[资金-${cost}]`);
            saveGame();
        } else alert("班费不足！");
    },

    confirmHotpot() {
        if (State.isGraduated) {
            State.students.forEach(s => { s.stress = 0; s.mood = Math.min(100, s.mood + 20); });
            UI.closeModal('hotpot-modal');
            this.log("同学们请你吃了回忆火锅！", "[温馨]");
            this.updateUI();
            return;
        }
        if (State.money < 2500 || (!(State.unlimitedAp === true) && State.ap < 2)) return alert("资源不足！");
        State.money -= 2500;
        if (!(State.unlimitedAp === true)) State.ap -= 2;
        State.students.forEach(s => {
            s.stress = 0;
            s.mood = Math.min(100, s.mood + 20);
            s.talents = s.talents.filter(t => t.t !== 'neg' || Math.random() > 0.7);
        });
        UI.closeModal('hotpot-modal');
        this.log("包场火锅！", "[压力清空]");
        this.updateUI();
        saveGame();
    },

    doMockExam() {
        if (State.isGraduated) return alert("已经毕业啦！");
        if (State.money < 4000 || (!(State.unlimitedAp === true) && State.ap < 2)) return alert("资源不足！");
        State.money -= 4000;
        if (!(State.unlimitedAp === true)) State.ap -= 2;
        State.isMockExam = true;
        this.log("全真模拟考！", "[实战]");
        this.prepareExam("模拟考试", true);
    },

    nextTurn() {
        if (State.isGraduated) return;
        State.week++;
        State.students.forEach(s => { if (s.sickTimer > 0) s.sickTimer--; });
        
        if (State.week === 2 && State.month !== 6) { 
            UI.showWeeklyModal(); 
            return; 
        }
        
        if (State.week > 4) {
            this._examWeek = State.week;
            State.week = 1;
            State.month++;
            if (State.month > 12) { State.month = 1; State.year++; }
            this.updateWeather();
            this.checkBirthdayEvents();
            State.monthStartScores = State.students.map(s => Object.values(s.mastery).reduce((a, b) => a + b, 0));
            if (State.month === 6 && State.year === 2026) {
                document.getElementById('gaokao-modal').classList.remove('hidden');
                this.updateUI();
                this.updateCountdown();
                return;
            } else {
                this.prepareExam();
                this.updateCountdown();
                return;
            }
        }
        this.finishTurnLogic();
        this.updateCountdown();
    },

    generateMonthlyReport() {
        console.log('🟢 生成月度报告（对比上一次月考）');

        const hasHistory = State.students.some(s => s.history && s.history.scores && s.history.scores.length > 0);
        if (!hasHistory) {
            console.log('❌ 没有考试记录，跳过月度报告');
            return;
        }

        const monthLabel = `${State.year}年${State.month}月`;
        document.getElementById('report-month-label').textContent = monthLabel + ' 月度报告（与上次月考对比）';

        let html = '';
        let totalPrev = 0, totalCurr = 0;
        let totalChange = 0;
        let maxImprove = -Infinity;
        let maxImproveName = '';
        let hasValidData = false;

        State.students.forEach(s => {
            const scores = s.history && s.history.scores ? s.history.scores : [];
            const subjectScores = s.history && s.history.subjectScores ? s.history.subjectScores : [];

            const currScore = scores.length >= 1 ? scores[scores.length - 1] : null;
            const prevScore = scores.length >= 2 ? scores[scores.length - 2] : null;

            if (currScore === null) {
                html += `
                    <div class="report-item">
                        <div><span class="name">${s.name}</span> <span class="change same">无数据</span></div>
                        <div class="detail">暂无考试记录</div>
                    </div>
                `;
                return;
            }

            const isFirstExam = (prevScore === null);
            const change = isFirstExam ? 0 : currScore - prevScore;
            const sign = change > 0 ? '+' : '';
            const cls = change > 0 ? 'up' : (change < 0 ? 'down' : 'same');

            totalPrev += isFirstExam ? currScore : prevScore;
            totalCurr += currScore;
            totalChange += change;
            hasValidData = true;

            if (!isFirstExam && change > maxImprove) {
                maxImprove = change;
                maxImproveName = s.name;
            }

            let subDetails = '';
            if (!isFirstExam && subjectScores.length >= 2) {
                const currSub = subjectScores[subjectScores.length - 1];
                const prevSub = subjectScores[subjectScores.length - 2];
                if (currSub && prevSub) {
                    subDetails = CONFIG.SUBJECTS.map(sub => {
                        const diff = (currSub[sub.id] || 0) - (prevSub[sub.id] || 0);
                        return `${sub.n}${diff >= 0 ? '+' : ''}${Math.round(diff)}`;
                    }).join(' | ');
                }
            } else if (isFirstExam && subjectScores.length >= 1) {
                const currSub = subjectScores[subjectScores.length - 1];
                if (currSub) {
                    subDetails = CONFIG.SUBJECTS.map(sub => {
                        return `${sub.n}${Math.round(currSub[sub.id] || 0)}`;
                    }).join(' | ');
                }
            }

            const changeDisplay = isFirstExam ? '首次考试' : `${sign}${Math.round(change)}分`;
            const detailDisplay = isFirstExam ? `首次：${Math.round(currScore)}` : `${Math.round(prevScore)} → ${Math.round(currScore)}`;

            html += `
                <div class="report-item">
                    <div>
                        <span class="name">${s.name}</span>
                        <span class="change ${cls}">${changeDisplay}</span>
                    </div>
                    <div class="detail">${detailDisplay}</div>
                    <div style="font-size:.7em;color:var(--text-muted);margin-top:2px;">${subDetails || '暂无科目详情'}</div>
                </div>
            `;
        });

        document.getElementById('report-content').innerHTML = html;

        if (!hasValidData) {
            document.getElementById('report-summary').innerHTML = `
                <div style="text-align:center;color:var(--text-muted);padding:10px;">暂无有效考试数据</div>
            `;
            document.getElementById('monthly-report-modal').classList.remove('hidden');
            return;
        }

        const avgPrev = totalPrev / State.students.length;
        const avgCurr = totalCurr / State.students.length;
        const avgChange = avgCurr - avgPrev;

        if (maxImprove === -Infinity) maxImprove = 0;

        document.getElementById('report-summary').innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;">
                <div>
                    <div style="font-size:.7em;color:var(--text-muted);">班级均分变化</div>
                    <div style="font-weight:bold;color:${avgChange >= 0 ? 'var(--btn-success)' : 'var(--btn-danger)'};">${avgChange >= 0 ? '+' : ''}${Math.round(avgChange)}分</div>
                </div>
                <div>
                    <div style="font-size:.7em;color:var(--text-muted);">进步最大</div>
                    <div style="font-weight:bold;color:var(--btn-success);">${maxImproveName || '无'} ${maxImprove !== 0 ? '(' + (maxImprove > 0 ? '+' : '') + Math.round(maxImprove) + ')' : ''}</div>
                </div>
                <div>
                    <div style="font-size:.7em;color:var(--text-muted);">班级均分</div>
                    <div style="font-weight:bold;">${Math.round(avgCurr)}</div>
                </div>
            </div>
        `;

        document.getElementById('monthly-report-modal').classList.remove('hidden');
    },

    checkBirthdayEvents() {
        State.students.forEach(s => {
            if (s.birthdayMonth === State.month) return;
            if (Math.random() < 0.20) {
                s.birthdayMonth = State.month;
                const gifts = [
                    { msg: `🎂 ${s.name} 生日！全班庆祝！`, effect: () => { s.stress = Math.max(0, s.stress - 40); s.mood = Math.min(100, s.mood + 20); CONFIG.SUBJECTS.forEach(sub => { s.mastery[sub.id] = Math.min(sub.cap, s.mastery[sub.id] + 3); }); } },
                    { msg: `🎉 ${s.name} 生日许愿！士气大振！`, effect: () => { State.students.forEach(st => { st.stress = Math.max(0, st.stress - 15); st.mood = Math.min(100, st.mood + 5); }); } },
                    { msg: `🎁 ${s.name} 收到家人鼓励！`, effect: () => { s.stress = Math.max(0, s.stress - 30); s.mood = Math.min(100, s.mood + 15); CONFIG.SUBJECTS.forEach(sub => { s.mastery[sub.id] = Math.min(sub.cap, s.mastery[sub.id] + 2); }); } }
                ];
                const gift = gifts[Math.floor(Math.random() * gifts.length)];
                this.log(gift.msg, "[生日]");
                gift.effect();
                this.updateUI();
            }
        });
    },

    confirmWeekly() {
        if (State.isGraduated) return;
        const pts = parseInt(document.getElementById('weekly-pts').innerText);
        if (pts > 0) { alert("请分配完所有点数！"); return; }
        State.students.forEach(s => {
            if (s.sickTimer > 0) return;
            if (s.skipStudy) return; // 逃课学生不获得周考加成
            for (const k in State.tempAlloc) {
                if (State.tempAlloc[k] > 0) {
                    const cap = CONFIG.SUBJECTS.find(x => x.id === k).cap;
                    s.mastery[k] = Math.min(cap, s.mastery[k] + State.tempAlloc[k] * 1.5);
                }
            }
        });
        UI.closeModal('weekly-modal');
        this.log("周考复盘完成。");
        this.finishTurnLogic();
    },

    finishTurnLogic() {
        if (State.isGraduated) return;

        // ===== 事件冷却递减（BUG-3 修复）=====
        // 时序推理（位置：本函数开头，且必须早于下方 60% 触发判定）：
        //   1) 冷却只在「成功触发某个事件」时置为 3（见 triggerEnhancedEvent）。
        //   2) 第 N 回合触发（cd=3）后：
        //        N+1 回合开头减到 2 → 过滤时 2 为真值 → 禁用
        //        N+2 回合开头减到 1 → 过滤时 1 为真值 → 禁用
        //        N+3 回合开头减到 0 → delete，本回合的触发判定里已重新可选
        //      即「触发后隔 3 个回合可再次抽中」，事件系统不会再永久枯竭。
        //      注：严格被整回合禁用的是 N+1、N+2 两个回合，N+3 即恢复 ——
        //      这是把递减放在「判定之前」的必然结果，与「放到判定之后（函数末尾）」
        //      只差一回合，语义在同一量级，不改。
        //   3) 为什么不挪到 nextTurn() 开头：
        //      nextTurn 的 week===2 分支只弹周考面板然后 return，要等用户点
        //      confirmWeekly() 才结算；若用户没分配完点数，confirmWeekly 会
        //      alert 后 return（不结算），此时「已递减但未结算」就错位了。
        //      放在 finishTurnLogic 开头能保证「递减」与「结算+触发判定」严格同批次。
        //   4) 月末考试周（nextTurn 的 week>4 分支，月考/高考）直接 return，
        //      不调用 finishTurnLogic，因此该周不递减。但该周同样不会触发事件
        //      （60% 触发判定就写在 finishTurnLogic 里），所以只会让恢复慢 1 个回合，
        //      绝不会重新出现「13 个事件全部点完后永久枯竭」的原 BUG。属可接受取舍。
        //   5) 降到 0 时 delete 键，避免 eventCooldowns 里堆积 0 值键
        //      （虽然 0 是 falsy 也能通过过滤，但残留键会让调试面板/存档出现脏数据）。
        if (!State.eventCooldowns) State.eventCooldowns = {}; // 老存档兜底
        Object.keys(State.eventCooldowns).forEach(k => {
            const next = (Number(State.eventCooldowns[k]) || 0) - 1;
            if (next <= 0) delete State.eventCooldowns[k];
            else State.eventCooldowns[k] = next;
        });

        State.ap = State.maxAp;
        // ===== 经济修改：按难度 =====
        let income = 1000; // 默认普通
        if (State.diff === 'easy') income = 1500;
        else if (State.diff === 'hard') income = 500;
        State.money += income;

        const moodRegen = State.fac.music * 5;
        const stressRed = State.fac.psy * 8;

        // ===== 网瘾机制 =====
        // 1. 重置所有学生的 skipStudy
        State.students.forEach(s => s.skipStudy = false);
        // 2. 处理网瘾逃课和传播
        let addicts = State.students.filter(s => s.talents.some(t => t.id === 'n4'));
        addicts.forEach(s => {
            // 20% 概率翘课
            if (Math.random() < 0.20) {
                s.skipStudy = true;
                s.stress = Math.min(100, s.stress + 10);
                s.mood = Math.max(0, s.mood - 5);
                this.log(`${s.name} 因网瘾逃课打游戏！`, "[网瘾]");
            }
            // 10% 概率传播给随机一个无网瘾的学生
            let candidates = State.students.filter(st => st !== s && !st.talents.some(t => t.id === 'n4'));
            if (candidates.length > 0 && Math.random() < 0.10) {
                let target = candidates[Math.floor(Math.random() * candidates.length)];
                // 添加网瘾特质（如果未满6个且没有该特质）
                if (target.talents.length < 6 && !target.talents.some(t => t.id === 'n4')) {
                    target.talents.push({ id: 'n4', n: '网瘾', t: 'neg', cost: -0.6, type: 'sci', d: '有概率翘课打游戏，且可能传播' });
                    this.log(`${target.name} 被 ${s.name} 传染了网瘾！`, "[网瘾传播]");
                }
            }
        });

        // 正常状态恢复
        State.students.forEach(s => {
            const baseDecay = s.talents.some(t => t.id === 't3') ? 8 : 4;
            s.stress = Math.max(0, s.stress - baseDecay - stressRed);
            const moodDecay = s.talents.some(t => t.id === 'n5') ? -5 : 0;
            const moodBoost = s.talents.some(t => t.id === 't7') ? 5 : 0;
            s.mood = Math.min(100, Math.max(0, s.mood + moodRegen + moodDecay + moodBoost));
            if (State.weather.eff === 'cold' || State.weather.eff === 'hot') {
                if (State.fac.ac === 0 && Math.random() < 0.08 && s.sickTimer === 0) {
                    s.sickTimer = 4;
                    this.log(`${s.name} 病倒了！`, "[生病]");
                }
            }
        });

        // 心情特质
        State.students.forEach(s => {
            if (s.mood >= 80 && Math.random() < 0.30) {
                const posTalents = CONFIG.TALENTS.filter(t => t.t === 'pos');
                const available = posTalents.filter(t => !s.talents.some(ex => ex.id === t.id));
                if (available.length > 0 && s.talents.length < 6) {
                    const newT = available[Math.floor(Math.random() * available.length)];
                    s.talents.push({ ...newT });
                    this.log(`${s.name} 因近日情绪极佳，获得了特质【${newT.n}】`, "[心情特质]");
                }
            } else if (s.mood <= 20 && Math.random() < 0.30) {
                const negTalents = CONFIG.TALENTS.filter(t => t.t === 'neg');
                const available = negTalents.filter(t => !s.talents.some(ex => ex.id === t.id));
                if (available.length > 0 && s.talents.length < 6) {
                    const newT = available[Math.floor(Math.random() * available.length)];
                    s.talents.push({ ...newT });
                    this.log(`${s.name} 因近日情绪奇差，获得了负面特质【${newT.n}】`, "[心情特质]");
                }
            }
        });

        // 事件触发（60%概率）
        if (Math.random() < 0.60) {
            this.triggerEnhancedEvent();
        }

        this.updateUI();
        saveGame();
    },

    triggerEnhancedEvent() {
        // 过滤掉冷却中的事件
        let available = CONFIG.EVENTS.filter(e => !State.eventCooldowns[e.id]);
        // 针对网瘾事件，如果班级没有网瘾学生则不触发 ev13
        const hasAddict = State.students.some(s => s.talents.some(t => t.id === 'n4'));
        if (!hasAddict) {
            available = available.filter(e => e.id !== 'ev13');
        }
        if (available.length === 0) return;
        const ev = available[Math.floor(Math.random() * available.length)];
        State.eventCooldowns[ev.id] = 3;

        const options = ev.options.map(opt => {
            let availableFlag = true;
            let conditionText = '';
            if (opt.condition && !opt.condition()) {
                availableFlag = false;
                conditionText = ' ❌ 条件不满足';
            } else if (opt.condition) {
                conditionText = ' ✅ 条件满足';
            }
            return { ...opt, available: availableFlag, conditionText };
        });

        UI.showEventModal(ev, options);
    },

    getRandStu(num) {
        const arr = [...State.students];
        for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
        return arr.slice(0, num);
    },

    updateWeather() {
        // BUG-5 修复：SEASONS 只配置了 8~6 月共 11 个键，没有 '7'。
        // 调试面板的月份输入是 1..12（7 是合法输入），month=0/13 等越界值也可能被存档导入带进来，
        // 此时 SEASONS[...] 为 undefined → WEATHER_POOL[undefined].length 抛 TypeError。
        // 这里做两级兜底：季节回退到 '秋'，天气数组为空时再回退到默认天气对象。
        // 注意：不改 config.js（那是另一个队员的文件），只在 game.js 内防御。
        const DEFAULT_WEATHER = { i: '☀️', n: '晴朗', eff: '' };
        const key = String(State.month);
        let season = SEASONS[key];
        if (!season) season = SEASONS['8'] || '秋'; // 未知月份统一回退到 8 月所属的「秋」
        State.season = season;
        const pool = WEATHER_POOL[season];
        if (!pool || pool.length === 0) {
            State.weather = DEFAULT_WEATHER; // 万一天气池没配置该季节，也不能崩
        } else {
            State.weather = pool[Math.floor(Math.random() * pool.length)];
        }
    },

    getRealRank(score) {
        if (score >= 720) return 1;
        if (score >= 681) { const f = (720 - score) / 39; return Math.floor(1 + 158 * f * f); }
        const table = [{ s: 681, r: 159 }, { s: 680, r: 176 }, { s: 650, r: 1701 }, { s: 600, r: 11716 }, { s: 550, r: 32260 }, { s: 500, r: 62078 }, { s: 450, r: 91261 }, { s: 400, r: 112843 }, { s: 350, r: 126882 }, { s: 300, r: 134938 }, { s: 250, r: 138444 }, { s: 200, r: 139415 }, { s: 180, r: 139478 }, { s: 0, r: 140000 }];
        for (let i = 0; i < table.length - 1; i++) {
            if (score >= table[i + 1].s) {
                const rangeS = table[i].s - table[i + 1].s;
                const rangeR = table[i + 1].r - table[i].r;
                const f = (table[i].s - score) / rangeS;
                return Math.max(1, Math.round(table[i].r + f * rangeR));
            }
        }
        return 140000;
    },

    prepareExam(forcedName = "", isMock = false) {
        UI._examClosed = false;
    
        if (State.isGraduated) return;
        const m = document.getElementById('exam-modal');
        const title = forcedName || (State.month === 9 ? "起点摸底" : State.month === 1 ? "一诊" : State.month === 3 ? "二诊" : "月度联考");
        document.getElementById('exam-title').innerText = title;
        document.getElementById('exam-rewards-txt').innerText = isMock ? "（模拟考试，不计入档案）" : "";
        document.getElementById('exam-close-btn').classList.add('hidden');

        let rData = State.students.map(s => {
            const obj = { name: s.name, scores: {}, total: 0, ref: s, events: [] };
            CONFIG.SUBJECTS.forEach(sub => {
                const base = s.mastery[sub.id] || 0;
                let raw = base * (1 - Math.min(s.stress, 80) / 600) * (s.sickTimer > 0 ? 0.7 : 1) + (Math.random() * 10 - 5);
                obj.scores[sub.id] = raw;
            });
            return obj;
        });

        rData.forEach(row => {
            const mult = row.ref.mood < 10 ? 0.5 : row.ref.mood < 20 ? 0.7 : row.ref.mood < 30 ? 0.85 : 1;
            for (const k in row.scores) row.scores[k] *= mult;
        });

        rData.forEach(row => {
            CONFIG.SUBJECTS.forEach(sub => {
                const pool = CONFIG.EXAM_EVENTS[sub.id] || [];
                const posChance = 0.3 + (row.ref.mood / 100) * 0.4;
                let ev = null;
                if (Math.random() < posChance) {
                    const pos = pool.filter(e => e.v > 0);
                    if (pos.length > 0) ev = pos[Math.floor(Math.random() * pos.length)];
                } else {
                    const neg = pool.filter(e => e.v < 0);
                    if (neg.length > 0) ev = neg[Math.floor(Math.random() * neg.length)];
                }
                if (!ev) ev = pool[Math.floor(Math.random() * pool.length)];
                if (ev) {
                    row.events.push(`[${sub.n}]${ev.t}(${ev.v > 0 ? '+' : ''}${ev.v})`);
                    row.scores[sub.id] += ev.v;
                }
            });
        });

        rData.forEach(row => {
            let sum = 0;
            CONFIG.SUBJECTS.forEach(sub => {
                row.scores[sub.id] = Math.max(0, Math.min(sub.cap, Math.round(row.scores[sub.id])));
                sum += row.scores[sub.id];
            });
            row.total = sum;
            const p = sum / 7.5;
            // ----- 绝对分数影响心情（原有） -----
            if (p >= 80) row.ref.mood = Math.min(100, row.ref.mood + 8);
            else if (p >= 60) row.ref.mood = Math.min(100, row.ref.mood + 2);
            else if (p < 40) row.ref.mood = Math.max(0, row.ref.mood - 20);
            else if (p < 60) row.ref.mood = Math.max(0, row.ref.mood - 10);
            row.ref.mood = Math.max(0, Math.min(100, row.ref.mood));
        });

        rData.sort((a, b) => b.total - a.total);
        rData.forEach((row, idx) => {
            if (idx > 0 && row.total === rData[idx - 1].total) row.rank = rData[idx - 1].rank;
            else row.rank = Math.max(this.getRealRank(row.total), idx + 1);
        });

        // ===== 新增：排名变化 + 分数变化 影响心情 =====
        if (!isMock) {
            rData.forEach(row => {
                const s = row.ref;
                const history = s.history;
                if (history && history.scores && history.scores.length > 0) {
                    const prevScore = history.scores[history.scores.length - 1];
                    const prevRank = history.ranks && history.ranks.length > 0 ? history.ranks[history.ranks.length - 1] : null;
                    
                    // 分数变化影响
                    const scoreDiff = row.total - prevScore;
                    if (Math.abs(scoreDiff) > 1) {
                        const moodDelta = Math.min(10, Math.max(-10, Math.round(scoreDiff / 8)));
                        if (moodDelta > 0) {
                            s.mood = Math.min(100, s.mood + moodDelta);
                            this.log(`${s.name} 分数进步 ${Math.round(scoreDiff)} 分，心情 +${moodDelta}`, "[心情]");
                        } else if (moodDelta < 0) {
                            s.mood = Math.max(0, s.mood + moodDelta);
                            this.log(`${s.name} 分数退步 ${Math.round(-scoreDiff)} 分，心情 ${moodDelta}`, "[心情]");
                        }
                    }
                    
                    // 排名变化影响
                    if (prevRank !== null && prevRank !== row.rank) {
                        const rankDiff = prevRank - row.rank; // 正数表示排名上升（数值变小）
                        if (Math.abs(rankDiff) >= 2) {
                            const moodDelta = Math.min(8, Math.max(-8, Math.round(rankDiff / 3)));
                            if (moodDelta > 0) {
                                s.mood = Math.min(100, s.mood + moodDelta);
                                this.log(`${s.name} 排名上升 ${rankDiff} 名，心情 +${moodDelta}`, "[心情]");
                            } else if (moodDelta < 0) {
                                s.mood = Math.max(0, s.mood + moodDelta);
                                this.log(`${s.name} 排名下降 ${-rankDiff} 名，心情 ${moodDelta}`, "[心情]");
                            }
                        }
                    }
                    
                    // 绝对分数段额外心情修正
                    if (row.total >= 650) s.mood = Math.min(100, s.mood + 3);
                    else if (row.total >= 600) s.mood = Math.min(100, s.mood + 2);
                    else if (row.total >= 550) s.mood = Math.min(100, s.mood + 1);
                    else if (row.total < 350) s.mood = Math.max(0, s.mood - 3);
                    else if (row.total < 400) s.mood = Math.max(0, s.mood - 1);
                    
                    s.mood = Math.max(0, Math.min(100, s.mood));
                }
            });
        }

        const execRender = () => {
            
            m.classList.remove('hidden');
            const tb = document.getElementById('exam-table');
            tb.innerHTML =
                `<tr><th>姓名</th>${CONFIG.SUBJECTS.map(s => `<th>${s.n}</th>`).join('')}<th style="background:var(--btn-danger)">总分</th><th style="background:#8b5cf6">排名</th><th style="background:var(--gold-color);width:180px;">考场动态</th></tr>`;
            rData.forEach((row, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td>${row.name}${row.ref.sickTimer > 0 ? ' 🤒' : ''}</td>`;
                CONFIG.SUBJECTS.forEach(sub => tr.innerHTML += `<td id="c-${idx}-${sub.id}" class="exam-cell"></td>`);
                tr.innerHTML += `<td id="c-${idx}-total" class="exam-cell" style="color:var(--btn-danger);"></td>`;
                tr.innerHTML += `<td id="c-${idx}-rank" class="exam-cell" style="color:#8b5cf6;"></td>`;
                tr.innerHTML += `<td id="c-${idx}-events" class="exam-cell event-col"></td>`;
                tb.appendChild(tr);
            });
            CONFIG.SUBJECTS.forEach((sub, i) => {
                setTimeout(() => {
                    rData.forEach((row, idx) => {
                        const cell = document.getElementById(`c-${idx}-${sub.id}`);
                        if (cell) {
                            cell.innerText = row.scores[sub.id] || 0;
                            const ratio = (row.scores[sub.id] || 0) / sub.cap;
                            cell.style.background = ratio >= 0.8 ? '#ea580c' : ratio >= 0.6 ? '#16a34a' :
                                'var(--border-color)';
                            if (ratio >= 0.6) cell.style.color = 'white';
                            cell.classList.add('pop');
                        }
                    });
                }, i * 300);
            });
            setTimeout(() => {
                rData.forEach((row, idx) => {
                    const tc = document.getElementById(`c-${idx}-total`);
                    if (tc) { tc.innerText = row.total; tc.classList.add('pop', 'flash-gold'); }
                    const rc = document.getElementById(`c-${idx}-rank`);
                    if (rc) { rc.innerText = `第${row.rank}名`; rc.classList.add('pop'); }
                    const ec = document.getElementById(`c-${idx}-events`);
                    if (ec) { ec.innerHTML = row.events.slice(0, 3).join('<br>') || '-'; ec.classList.add('pop'); }
                });
                setTimeout(() => {
                    if (!isMock) {
                        let rewardMsg = '🏆 补助¥1000';
                        let bonusTotal = 0;
                        
                        // 存储历史数据 & 计算进步奖金
                        rData.forEach(r => {
                            if (r.ref.history) {
                                if (!r.ref.history.scores) r.ref.history.scores = [];
                                r.ref.history.scores.push(r.total);
                                if (!r.ref.history.ranks) r.ref.history.ranks = [];
                                r.ref.history.ranks.push(r.rank);
                                
                                if (!r.ref.history.subjectScores) r.ref.history.subjectScores = [];
                                let subScores = {};
                                CONFIG.SUBJECTS.forEach(sub => {
                                    subScores[sub.id] = r.scores[sub.id] || 0;
                                });
                                r.ref.history.subjectScores.push(subScores);
                                
                                // ===== 进步奖金逻辑 =====
                                const scores = r.ref.history.scores;
                                if (scores.length >= 2) {
                                    const prevScore = scores[scores.length - 2];
                                    const currScore = scores[scores.length - 1];
                                    const progress = currScore - prevScore;
                                    // 如果上次生病了（sickTimer > 0）则不算
                                    // 注意：sickTimer 是考试时的状态，我们检查考试时是否生病
                                    // 但历史数据中没有存储 sickTimer，所以用当前状态判断可能不准
                                    // 用 r.ref.sickTimer 但那是当前状态，考试时可能已经好了
                                    // 改用 r.ref.history 中是否存储了 sick 信息？
                                    // 简单处理：检查考试时是否生病，我们用 r.ref.sickTimer > 0 来判断
                                    // 但 r.ref.sickTimer 是当前状态，不是考试时的状态
                                    // 折中：如果当前 sickTimer > 0，不发放进步奖金
                                    // 更准确的做法是在历史中存储 sick 状态，但为了简化，我们检查当前是否生病
                                    // 如果当前生病，不发放
                                    if (r.ref.sickTimer === 0 && progress > 50) {
                                        let bonus = 0;
                                        if (progress > 100) { bonus = 5000; }
                                        else if (progress > 80) { bonus = 2000; }
                                        else if (progress > 50) { bonus = 1000; }
                                        if (bonus > 0) {
                                            State.money += bonus;
                                            bonusTotal += bonus;
                                            this.log(`🏅 ${r.name} 进步 ${Math.round(progress)} 分，获得进步奖金 ¥${bonus}`, "[进步奖]");
                                        }
                                    }
                                }
                            }
                        });
                        
                        // 基础补助
                        State.money += 1000;
                        if (bonusTotal > 0) {
                            rewardMsg = `🏆 补助¥1000 + 进步奖金¥${bonusTotal}`;
                        }
                        document.getElementById('exam-rewards-txt').innerText = rewardMsg;
                    }
                    document.getElementById('exam-close-btn').classList.remove('hidden');
                }, 600);
            }, CONFIG.SUBJECTS.length * 300 + 200);
        };
        execRender();
    },

    startGaokao() {
        if (State.isGraduated) return;
        document.getElementById('gaokao-modal').classList.add('hidden');
        this.prepareExam("全国统一高考");
        const btn = document.getElementById('exam-close-btn');
        btn.innerText = "查看录取";
        btn.onclick = () => { 
            State.isGraduated = true; 
            this.showEnding(); 
        };
    },

    showEnding() {
        document.getElementById('exam-modal').classList.add('hidden');
        document.getElementById('ending-modal').classList.remove('hidden');
        let html = "", total = 0;
        State.students.forEach(s => {
            const scores = s.history && s.history.scores ? s.history.scores : [];
            const fs = scores.length > 0 ? scores[scores.length - 1] : 400;
            total += fs;
            const tier = CONFIG.UNIS.find(u => fs >= u.min) || CONFIG.UNIS[4];
            const uni = tier.list[Math.floor(Math.random() * tier.list.length)];
            html += `<div style="background:var(--bg-input);border:1px solid var(--border-color);padding:8px;border-radius:6px;display:flex;align-items:center;gap:8px;">
                <div style="font-size:1.2em;">📍</div>
                <div><b style="color:var(--text-primary);">${s.name}</b><br><span style="color:var(--btn-accent);font-size:.85em;">${uni} (${fs}分)</span></div>
            </div>`;
        });
        document.getElementById('ending-cengfan').innerHTML = html;
        const avg = total / State.students.length;
        const evalText = avg >= 685 ? '🎉 神级！全员清北！' : avg >= 650 ? '🌟 全员C9！' : avg >= 600 ? '👍 全员985！' :
            avg >= 500 ? '✅ 全员211！' : '😅 还需努力！';
        document.getElementById('ending-player').innerHTML = `
            <p style="font-weight:bold;color:var(--text-primary);">平均分: ${Math.round(avg)}</p>
            <p style="color:var(--text-secondary);">${evalText}</p>
            <p style="color:var(--text-muted);font-size:.9em;">感谢您的游玩！</p>
        `;
        saveGame();
    },

    returnToClass() {
        document.getElementById('ending-modal').classList.add('hidden');
        // BUG-6 修复：原来写 State.ap = 'INF'（字符串），
        // 会导致 'INF' - costAP === NaN 且被 JSON.stringify 原样落盘成 "ap": "INF"。
        // 改为独立布尔标志 unlimitedAp，ap 始终保持数字（存档自洽）。
        // 老存档没有该字段时，所有读取处都用 === true 判断，缺失即按 false 处理。
        State.unlimitedAp = true;
        State.ap = State.maxAp;
        document.getElementById('ui-ap').innerText = 'INF';
        document.getElementById('ap-max-txt').innerText = '';
        document.getElementById('btn-next-turn').innerText = '已毕业 🎓';
        document.getElementById('btn-next-turn').disabled = true;
        this.log("同学们毕业了，偶尔会回来看你。", "[完结]");
        this.updateUI();
        this.updateCountdown();
    },

    healDoctor(sIdx) {
        if (State.isGraduated) return alert("已毕业！");
        if (State.money < 1000) return alert("班费不足！");
        State.money -= 1000;
        State.students[sIdx].sickTimer = 0;
        UI.closeModal('doctor-modal');
        this.log(`治好了 ${State.students[sIdx].name}。`, "[康复]");
        this.updateUI();
        saveGame();
    },

    log(msg, eff = "") {
        const area = document.getElementById('log-area');
        const timeStr = `${State.year}/${String(State.month).padStart(2, '0')} W${State.week}`;
        area.innerHTML =
            `<div class="log-entry"><span class="log-time">[${timeStr}]</span> ${msg} ${eff ? `<span class="log-eff">${eff}</span>` : ''}</div>` +
            area.innerHTML;
    },

    updateUI() {
        document.getElementById('ui-time').innerText = `${State.year}/${State.month} W${State.week}`;
        document.getElementById('ui-money').innerText = Math.round(State.money);
        if (!State.isGraduated && typeof State.ap === 'number') {
            document.getElementById('ui-ap').innerText = State.ap;
            document.getElementById('ap-max-txt').innerText = `/${State.maxAp}`;
        }
        document.getElementById('ui-weather').innerText = State.weather.i;
        document.getElementById('ui-weather-txt').innerText = State.weather.n;
        document.getElementById('ui-season').innerText = State.season + "季";
        document.getElementById('sprint-tag').classList.toggle('hidden', !(State.month === 5 && State.year === 2026));
        UI.renderClassroom();
        UI.renderFacilities();
        updateDiffBadge();
        this.updateCountdown();
    },

    updateCountdown() {
        const targetYear = 2026, targetMonth = 6, targetWeek = 1;
        let totalMonths = (targetYear - State.year) * 12 + (targetMonth - State.month);
        let totalWeeks = totalMonths * 4 + (targetWeek - State.week);
        if (totalWeeks < 0) totalWeeks = 0;
        document.getElementById('countdown').textContent = `⏳ 剩余 ${totalWeeks} 周`;
    }
};
