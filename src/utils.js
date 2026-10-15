// ===== 工具函数 =====
function getNormalEfficiency(score, cap) {
    const ratio = score / cap;
    let eff;
    if (ratio < 0.25) eff = 2.0 - (ratio / 0.25) * 0.2;
    else if (ratio < 0.40) eff = 1.8 - ((ratio - 0.25) / 0.15) * 0.3;
    else if (ratio < 0.55) eff = 1.5 - ((ratio - 0.40) / 0.15) * 0.5;
    else if (ratio < 0.70) eff = 1.0 - ((ratio - 0.55) / 0.15) * 0.4;
    else if (ratio < 0.85) eff = 0.6 - ((ratio - 0.70) / 0.15) * 0.3;
    else eff = 0.3 * Math.exp(-6 * (ratio - 0.85));
    return Math.max(0.02, Math.min(2.0, eff));
}

function getLevel(score, cap) {
    const r = score / cap;
    if (r >= 0.95) return { level: 'SSS', color: '#dc2626' };
    if (r >= 0.88) return { level: 'SS', color: '#ea580c' };
    if (r >= 0.80) return { level: 'S', color: '#9333ea' };
    if (r >= 0.70) return { level: 'A', color: '#16a34a' };
    if (r >= 0.55) return { level: 'B', color: '#2563eb' };
    if (r >= 0.40) return { level: 'C', color: '#64748b' };
    if (r >= 0.25) return { level: 'D', color: '#94a3b8' };
    return { level: 'E', color: '#cbd5e1' };
}

