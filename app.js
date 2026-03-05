// ===== 数据管理 =====
const STORAGE_KEY = 'tribunal_members';
const HISTORY_KEY = 'tribunal_history';
const USER_KEY = 'tribunal_current_user';

function getMembers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveMembers(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}
function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}
function saveHistory(records) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

const colorPool = [
    '#1e90ff', '#ff69b4', '#e84057', '#00bfa5', '#4fc3f7',
    '#e91e63', '#ffd700', '#9c27b0', '#66bb6a', '#ff7043',
    '#42a5f5', '#78909c', '#ab47bc', '#ef5350', '#26c6da',
    '#8d6e63', '#7e57c2', '#d4e157', '#ff8a65', '#5c6bc0',
];
function getMemberColor(i) { return colorPool[i % colorPool.length]; }

// ===== 状态 =====
let canvas, ctx;
let currentAngle = 0;
let isSpinning = false;
let currentUser = '';

// ===== 初始化 =====
function init() {
    currentUser = sessionStorage.getItem(USER_KEY);
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('display-name').textContent = currentUser;

    // 入场过渡动画
    const transition = document.getElementById('enter-transition');
    document.getElementById('transition-name').textContent = currentUser;
    setTimeout(() => transition.classList.add('fade-out'), 1200);
    setTimeout(() => transition.style.display = 'none', 2000);

    document.getElementById('add-member-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addMemberManually();
    });

    refreshMemberList();
    initWheel();
    renderHistory();
}

// ===== 成员管理 =====
function refreshMemberList() {
    const members = getMembers();
    const list = document.getElementById('member-list');
    document.getElementById('member-count').textContent = members.length;

    if (members.length === 0) {
        list.innerHTML = '<p class="empty-members">暂无成员，请邀请召唤师登录加入</p>';
    } else {
        list.innerHTML = members.map((name, i) => {
            const color = getMemberColor(i);
            const isSelf = name === currentUser ? ' (你)' : '';
            return `<div class="member-tag" style="border-color:${color}">
                <span class="member-dot" style="background:${color}"></span>
                <span>${escapeHtml(name)}${isSelf}</span>
                <button class="member-remove" onclick="removeMember('${escapeHtml(name)}')" title="移除">&times;</button>
            </div>`;
        }).join('');
    }

    const btn = document.getElementById('spin-btn');
    const warning = document.getElementById('wheel-warning');
    if (members.length < 2) {
        btn.disabled = true;
        warning.classList.remove('hidden');
    } else {
        btn.disabled = false;
        warning.classList.add('hidden');
    }
}

function addMemberManually() {
    const input = document.getElementById('add-member-input');
    const name = input.value.trim();
    if (!name) return;
    const members = getMembers();
    if (members.includes(name)) { input.value = ''; return; }
    members.push(name);
    saveMembers(members);
    input.value = '';
    refreshMemberList();
    if (canvas) drawWheel(currentAngle);
}

function removeMember(name) {
    saveMembers(getMembers().filter(m => m !== name));
    refreshMemberList();
    if (canvas) drawWheel(currentAngle);
}

function clearMembers() {
    if (!confirm('确定要清空所有成员吗？')) return;
    saveMembers([]);
    refreshMemberList();
    if (canvas) drawWheel(currentAngle);
}

// ===== 转盘 =====
function initWheel() {
    canvas = document.getElementById('wheel-canvas');
    ctx = canvas.getContext('2d');
    drawWheel(0);
}

function drawWheel(rotation) {
    const members = getMembers();
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const radius = Math.min(cx, cy) - 15;

    ctx.clearRect(0, 0, w, h);

    if (members.length === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(10,22,40,0.95)';
        ctx.fill();
        ctx.strokeStyle = '#c8aa6e';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'rgba(200,170,110,0.4)';
        ctx.font = '16px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('等待召唤师加入...', cx, cy);
        return;
    }

    const sliceAngle = (2 * Math.PI) / members.length;

    // 外圈
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, 2 * Math.PI);
    ctx.strokeStyle = '#c8aa6e';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, radius + 12, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(200,170,110,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    members.forEach((name, i) => {
        const startAngle = rotation + i * sliceAngle;
        const endAngle = startAngle + sliceAngle;
        const color = getMemberColor(i);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = i % 2 === 0 ? 'rgba(10,22,40,0.95)' : 'rgba(10,50,60,0.8)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(200,170,110,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 彩色条
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, startAngle + 0.03);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // 文字
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#c8aa6e';
        const fs = members.length <= 6 ? 16 : members.length <= 12 ? 14 : 11;
        ctx.font = `bold ${fs}px "Microsoft YaHei", sans-serif`;
        const dn = name.length > 6 ? name.slice(0, 5) + '..' : name;
        ctx.fillText(dn, radius - 20, 5);
        ctx.restore();
    });

    // 中心
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#0a1628';
    ctx.fill();
    ctx.strokeStyle = '#c8aa6e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#c8aa6e';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('审判', cx, cy);
}

// ===== 旋转 =====
function spinWheel() {
    const members = getMembers();
    if (isSpinning || members.length < 2) return;
    isSpinning = true;

    const btn = document.getElementById('spin-btn');
    btn.disabled = true;
    btn.textContent = '抽选中...';
    document.getElementById('result-panel').classList.add('hidden');

    const totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
    const duration = 4000 + Math.random() * 1000;
    const startAngle = currentAngle;
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        currentAngle = startAngle + totalRotation * eased;
        drawWheel(currentAngle);
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            onSpinComplete();
        }
    }
    requestAnimationFrame(animate);
}

function onSpinComplete() {
    const members = getMembers();
    isSpinning = false;
    const btn = document.getElementById('spin-btn');
    btn.disabled = false;
    btn.textContent = '开始抽选法官';

    const sliceAngle = (2 * Math.PI) / members.length;
    let norm = currentAngle % (2 * Math.PI);
    if (norm < 0) norm += 2 * Math.PI;
    const pointer = (2 * Math.PI - norm + Math.PI * 1.5) % (2 * Math.PI);
    const idx = Math.floor(pointer / sliceAngle) % members.length;

    showResult(members[idx]);
}

// ===== 结果 =====
function showResult(judgeName) {
    const panel = document.getElementById('result-panel');
    panel.classList.remove('hidden');

    const caseNum = 'TRB-' + Date.now().toString(36).toUpperCase().slice(-6);
    document.getElementById('result-title').textContent = `法官: ${judgeName}`;
    document.getElementById('result-desc').textContent = `召唤师「${judgeName}」已被选为本次审判的法官，将以公正之名裁决！`;
    document.getElementById('result-judge').textContent = judgeName;
    document.getElementById('result-summoner').textContent = currentUser;
    document.getElementById('result-case').textContent = caseNum;

    const records = getHistory();
    const now = new Date();
    const timeStr = now.toLocaleDateString('zh-CN') + ' ' + now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    records.unshift({ judge: judgeName, summoner: currentUser, caseNum, time: timeStr });
    if (records.length > 50) records.length = 50;
    saveHistory(records);
    renderHistory();
    panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderHistory() {
    const records = getHistory();
    const list = document.getElementById('history-list');
    if (records.length === 0) {
        list.innerHTML = '<p class="empty-history">暂无审判记录</p>';
        return;
    }
    list.innerHTML = records.map(h => `
        <div class="history-item">
            <span>法官 <span class="hi-judge">${escapeHtml(h.judge)}</span> | 发起人: ${escapeHtml(h.summoner)} | ${h.caseNum}</span>
            <span class="hi-time">${h.time}</span>
        </div>
    `).join('');
}

function resetWheel() {
    document.getElementById('result-panel').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

init();
