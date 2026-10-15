// ===== 图表配置（不变） =====
const ChartColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
let ChartState = [true, true, true, true, true, true];
let ChartHoverData = [];
// ===== 图表绘制 =====
function drawFullChart() {
    const cvs = document.getElementById('chartCanvas');
    if (!cvs) return;

    const container = cvs.parentElement;
    if (!container) return;

    let w = container.clientWidth || 600;
    let h = container.clientHeight || 400;
    if (w < 100) w = 600;
    if (h < 100) h = 400;

    const dpr = window.devicePixelRatio || 1;
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';

    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = w, H = h;
    ctx.clearRect(0, 0, W, H);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bgColor = isDark ? '#1e293b' : '#f8fafc';
    const gridColor = isDark ? '#475569' : '#cbd5e1';
    const textColor = isDark ? '#cbd5e1' : '#64748b';

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
    ChartHoverData = [];

    const activeStudents = State.students.filter((_, i) => ChartState[i]);
    const hasData = activeStudents.some(s => s.history && s.history.scores && s.history.scores.length > 0);

    if (!hasData) {
        ctx.fillStyle = textColor;
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('暂无考试数据', W / 2, H / 2);
        return;
    }

    let maxExams = 0;
    activeStudents.forEach(s => {
        if (s.history && s.history.scores) {
            maxExams = Math.max(maxExams, s.history.scores.length);
        }
    });

    let allScores = [];
    activeStudents.forEach(s => {
        if (s.history && s.history.scores) {
            allScores = allScores.concat(s.history.scores);
        }
    });

    const TARGET_PIXEL_GAP = 600;
    let yMin, yMax;

    if (allScores.length > 0) {
        const rawMin = Math.min(...allScores);
        const rawMax = Math.max(...allScores);
        const rawRange = rawMax - rawMin;

        const sorted = [...allScores].sort((a, b) => a - b);
        let minDiff = Infinity;
        for (let i = 1; i < sorted.length; i++) {
            const diff = sorted[i] - sorted[i-1];
            if (diff < minDiff) minDiff = diff;
        }
        if (minDiff === Infinity || minDiff === 0) minDiff = 1;

        const pad = { top: 35, bottom: 50, left: 65, right: 35 };
        const drawH = H - pad.top - pad.bottom;

        const requiredRange = (minDiff * drawH) / TARGET_PIXEL_GAP;

        let finalRange = Math.max(rawRange, requiredRange, 360);

        const margin = Math.max(finalRange * 0.20, 25);
        yMin = Math.max(0, rawMin - margin);
        yMax = rawMax + margin;

        if (yMax - yMin < 360) {
            const center = (yMax + yMin) / 2;
            yMin = Math.max(0, center - 180);
            yMax = center + 180;
        }

        if (rawMax < 650 && yMax < 700) {
            yMax = Math.max(700, rawMax + margin);
        }
        if (rawMin > 300 && yMin > 180) {
            yMin = Math.min(180, rawMin - margin);
        }
        if (yMax - yMin < 360) {
            const center = (yMax + yMin) / 2;
            yMin = Math.max(0, center - 180);
            yMax = center + 180;
        }
    } else {
        yMin = 0;
        yMax = 750;
    }

    const pad = { top: 35, bottom: 50, left: 65, right: 35 };
    const drawW = W - pad.left - pad.right;
    const drawH = H - pad.top - pad.bottom;

    let stepX = 0, offsetX = 0;
    if (maxExams > 1) {
        const FIXED_SPACING = 150;
        const totalNeeded = (maxExams - 1) * FIXED_SPACING;
        if (drawW >= totalNeeded) {
            stepX = FIXED_SPACING;
            offsetX = (drawW - totalNeeded) / 2;
        } else {
            const MIN_SPACING = 80;
            const minNeeded = (maxExams - 1) * MIN_SPACING;
            if (drawW >= minNeeded) {
                stepX = drawW / (maxExams - 1);
                offsetX = 0;
            } else {
                stepX = Math.max(60, drawW / (maxExams - 1));
                offsetX = 0;
            }
        }
    } else {
        stepX = drawW;
        offsetX = 0;
    }

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const value = yMin + (yMax - yMin) * (1 - i / 4);
        const y = pad.top + (i / 4) * drawH;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(value), pad.left - 8, y);
    }

    const firstStudent = activeStudents.find(s => s.history && s.history.scores && s.history.scores.length > 0);
    const examNames = firstStudent?.history?.scores?.map((_, i) => `第${i+1}次`) || [];
    if (examNames.length > 0) {
        examNames.forEach((name, i) => {
            const x = pad.left + offsetX + i * (maxExams > 1 ? stepX : 0);
            ctx.fillStyle = textColor;
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(name, x, pad.top + drawH + 8);
        });
    }

    ctx.save();
    ctx.translate(14, pad.top + drawH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = textColor;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('总分', 0, 0);
    ctx.restore();

    activeStudents.forEach((s, idx) => {
        const globalIndex = State.students.indexOf(s);
        if (!ChartState[globalIndex]) return;
        if (!s.history || !s.history.scores || s.history.scores.length === 0) return;

        const color = isDark ? '#ffffff' : ChartColors[globalIndex];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();

        const points = [];
        s.history.scores.forEach((score, j) => {
            const x = pad.left + offsetX + j * (maxExams > 1 ? stepX : 0);
            let y = pad.top + drawH - (score - yMin) / (yMax - yMin) * drawH;
            y = Math.max(pad.top, Math.min(pad.top + drawH, y));
            points.push({ x, y, score, index: j });
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            ChartHoverData.push({
                x, y,
                name: s.name,
                score,
                index: j + 1,
                color: color,
                student: s,
                examIndex: j,
                prevScore: j > 0 ? s.history.scores[j - 1] : null,
                yMin: yMin,
                yMax: yMax
            });
        });
        ctx.stroke();

        points.forEach((p) => {
            const radius = 5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius + 1, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        });
    });

    const controlsWrap = document.getElementById('chart-controls-page');
    if (controlsWrap && controlsWrap.children.length === 0) {
        controlsWrap.innerHTML = State.students.map((s, i) => `
            <label>
                <input type="checkbox" ${ChartState[i] ? 'checked' : ''} onchange="toggleChartLinePage(${i}, this.checked)">
                <span style="color:${ChartColors[i]}">${s.name}</span>
            </label>
        `).join('');
    }
}
function toggleChartLinePage(i, checked) {
    ChartState[i] = checked;
    drawFullChart();
}

document.addEventListener('mousemove', function(e) {
    const cvs = document.getElementById('chartCanvas');
    if (!cvs || !document.getElementById('chart-page').classList.contains('active')) return;

    const rect = cvs.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = cvs.width / rect.width / dpr;
    const scaleY = cvs.height / rect.height / dpr;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let closest = null, minDist = 25;
    ChartHoverData.forEach(d => {
        const dist = Math.sqrt(Math.pow(d.x - mx, 2) + Math.pow(d.y - my, 2));
        if (dist < minDist) { minDist = dist; closest = d; }
    });

    const tip = document.getElementById('chart-tooltip-page');
    if (closest) {
        const s = closest.student;
        let details = '';
        if (s && s.mastery) {
            details = CONFIG.SUBJECTS.map(sub =>
                `<div class="detail-row"><span class="label">${sub.n}</span><span class="value">${Math.round(s.mastery[sub.id] || 0)}</span></div>`
            ).join('');
        }
        let changeHtml = '';
        if (closest.prevScore !== null && closest.prevScore !== undefined) {
            const diff = closest.score - closest.prevScore;
            const sign = diff > 0 ? '+' : '';
            const cls = diff > 0 ? 'up' : (diff < 0 ? 'down' : '');
            changeHtml = `<div class="change-row">较上次: <span class="${cls}">${sign}${Math.round(diff)}分</span></div>`;
        }
        tip.style.display = 'block';
        tip.style.left = (closest.x / scaleX) + 'px';
        tip.style.top = (closest.y / scaleY) + 'px';
        tip.innerHTML = `
            <div style="font-weight:bold;margin-bottom:4px;color:${closest.color}">${closest.name}</div>
            <div class="detail-row"><span class="label">第${closest.index}次考试</span><span class="value" style="color:#fcd34d;">${closest.score}分</span></div>
            ${details ? `<div style="border-top:1px solid var(--border-color);margin-top:4px;padding-top:4px;">${details}</div>` : ''}
            ${changeHtml}
        `;
    } else {
        tip.style.display = 'none';
    }
});

// ===== 启动 =====
