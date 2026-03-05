// ===== 开场动画 =====
const STORAGE_KEY = 'tribunal_members';
const USER_KEY = 'tribunal_current_user';

// 符文文字（装饰转盘用）
const runeTexts = [
    '正义', '审判', '秩序', '裁决', '公正', '法典',
    '制裁', '天平', '真相', '律令', '断罪', '誓约',
];

let introCanvas, introCtx;
let introAngle = 0;
let introSpeed = 0;
let introPhase = 0; // 0=加速 1=匀速 2=减速淡出

function startIntro() {
    introCanvas = document.getElementById('intro-wheel');
    introCtx = introCanvas.getContext('2d');
    introSpeed = 0;
    introPhase = 0;

    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;

        // 阶段控制
        if (elapsed < 800) {
            // 加速阶段
            introSpeed = (elapsed / 800) * 0.15;
        } else if (elapsed < 2200) {
            // 匀速旋转
            introSpeed = 0.15;
            // 1.2s 时显示文字
            if (elapsed > 1200 && introPhase === 0) {
                introPhase = 1;
                showIntroText();
            }
        } else if (elapsed < 3500) {
            // 减速 + 淡出
            const fadeProgress = (elapsed - 2200) / 1300;
            introSpeed = 0.15 * (1 - fadeProgress);
            document.getElementById('intro-overlay').style.opacity = 1 - fadeProgress;
        } else {
            // 动画结束，显示登录
            document.getElementById('intro-overlay').style.display = 'none';
            document.getElementById('login-page').classList.add('visible');
            initLoginPage();
            return;
        }

        introAngle += introSpeed;
        drawIntroWheel();
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function drawIntroWheel() {
    const w = introCanvas.width, h = introCanvas.height;
    const cx = w / 2, cy = h / 2;
    const radius = 160;
    const sliceAngle = (2 * Math.PI) / runeTexts.length;

    introCtx.clearRect(0, 0, w, h);

    // 外部光晕
    const glow = introCtx.createRadialGradient(cx, cy, radius - 20, cx, cy, radius + 40);
    glow.addColorStop(0, 'rgba(200,170,110,0)');
    glow.addColorStop(0.5, 'rgba(200,170,110,0.08)');
    glow.addColorStop(1, 'rgba(200,170,110,0)');
    introCtx.fillStyle = glow;
    introCtx.fillRect(0, 0, w, h);

    // 外圈
    introCtx.beginPath();
    introCtx.arc(cx, cy, radius + 5, 0, 2 * Math.PI);
    introCtx.strokeStyle = 'rgba(200,170,110,0.6)';
    introCtx.lineWidth = 2;
    introCtx.stroke();

    introCtx.beginPath();
    introCtx.arc(cx, cy, radius + 10, 0, 2 * Math.PI);
    introCtx.strokeStyle = 'rgba(200,170,110,0.2)';
    introCtx.lineWidth = 1;
    introCtx.stroke();

    // 刻度点
    for (let i = 0; i < 36; i++) {
        const a = introAngle * 0.3 + (i / 36) * Math.PI * 2;
        const x = cx + Math.cos(a) * (radius + 15);
        const y = cy + Math.sin(a) * (radius + 15);
        introCtx.beginPath();
        introCtx.arc(x, y, 1.5, 0, Math.PI * 2);
        introCtx.fillStyle = 'rgba(200,170,110,0.4)';
        introCtx.fill();
    }

    // 扇区
    runeTexts.forEach((text, i) => {
        const start = introAngle + i * sliceAngle;
        const end = start + sliceAngle;

        introCtx.beginPath();
        introCtx.moveTo(cx, cy);
        introCtx.arc(cx, cy, radius, start, end);
        introCtx.closePath();

        const base = i % 2 === 0 ? 'rgba(10,22,40,0.9)' : 'rgba(10,50,60,0.7)';
        introCtx.fillStyle = base;
        introCtx.fill();

        introCtx.strokeStyle = 'rgba(200,170,110,0.3)';
        introCtx.lineWidth = 0.5;
        introCtx.stroke();

        // 符文文字
        introCtx.save();
        introCtx.translate(cx, cy);
        introCtx.rotate(start + sliceAngle / 2);
        introCtx.textAlign = 'right';
        introCtx.fillStyle = 'rgba(200,170,110,0.7)';
        introCtx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        introCtx.fillText(text, radius - 15, 4);
        introCtx.restore();
    });

    // 内圈
    introCtx.beginPath();
    introCtx.arc(cx, cy, 35, 0, 2 * Math.PI);
    introCtx.fillStyle = '#0a1628';
    introCtx.fill();
    introCtx.strokeStyle = 'rgba(200,170,110,0.8)';
    introCtx.lineWidth = 2;
    introCtx.stroke();

    // 中心符号
    introCtx.fillStyle = '#c8aa6e';
    introCtx.font = '26px serif';
    introCtx.textAlign = 'center';
    introCtx.textBaseline = 'middle';
    introCtx.fillText('\u2696', cx, cy);
}

function showIntroText() {
    const lines = document.querySelectorAll('.intro-line');
    lines.forEach((line, i) => {
        setTimeout(() => line.classList.add('show'), i * 300);
    });
}

// ===== 登录页 =====
function initLoginPage() {
    initParticles();
    initLogoWheel();
    updateLoginCount();

    document.getElementById('username').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') enterTribunal();
        this.style.borderColor = '#a0844e';
    });

    document.getElementById('enter-btn').addEventListener('click', enterTribunal);

    // 如果已经登录过，自动填充
    const saved = sessionStorage.getItem(USER_KEY);
    if (saved) {
        document.getElementById('username').value = saved;
    }
}

// 小型 logo 转盘（持续慢速旋转）
let logoCanvas, logoCtx, logoAngle = 0;

function initLogoWheel() {
    logoCanvas = document.getElementById('logo-wheel');
    logoCtx = logoCanvas.getContext('2d');

    function animateLogo() {
        logoAngle += 0.005;
        drawLogoWheel();
        requestAnimationFrame(animateLogo);
    }
    animateLogo();
}

function drawLogoWheel() {
    const w = logoCanvas.width, h = logoCanvas.height;
    const cx = w / 2, cy = h / 2;
    const radius = 65;
    const count = 12;
    const sliceAngle = (2 * Math.PI) / count;

    logoCtx.clearRect(0, 0, w, h);

    // 光晕
    const glow = logoCtx.createRadialGradient(cx, cy, 30, cx, cy, radius + 10);
    glow.addColorStop(0, 'rgba(200,170,110,0.05)');
    glow.addColorStop(1, 'rgba(200,170,110,0)');
    logoCtx.fillStyle = glow;
    logoCtx.fillRect(0, 0, w, h);

    logoCtx.beginPath();
    logoCtx.arc(cx, cy, radius + 3, 0, 2 * Math.PI);
    logoCtx.strokeStyle = 'rgba(200,170,110,0.5)';
    logoCtx.lineWidth = 1.5;
    logoCtx.stroke();

    for (let i = 0; i < count; i++) {
        const start = logoAngle + i * sliceAngle;
        const end = start + sliceAngle;

        logoCtx.beginPath();
        logoCtx.moveTo(cx, cy);
        logoCtx.arc(cx, cy, radius, start, end);
        logoCtx.closePath();

        logoCtx.fillStyle = i % 2 === 0 ? 'rgba(10,22,40,0.8)' : 'rgba(10,50,60,0.6)';
        logoCtx.fill();
        logoCtx.strokeStyle = 'rgba(200,170,110,0.2)';
        logoCtx.lineWidth = 0.5;
        logoCtx.stroke();
    }

    logoCtx.beginPath();
    logoCtx.arc(cx, cy, 18, 0, 2 * Math.PI);
    logoCtx.fillStyle = '#0a1628';
    logoCtx.fill();
    logoCtx.strokeStyle = 'rgba(200,170,110,0.6)';
    logoCtx.lineWidth = 1.5;
    logoCtx.stroke();

    logoCtx.fillStyle = '#c8aa6e';
    logoCtx.font = '16px serif';
    logoCtx.textAlign = 'center';
    logoCtx.textBaseline = 'middle';
    logoCtx.fillText('\u2696', cx, cy);
}

function updateLoginCount() {
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    document.getElementById('login-member-count').textContent = members.length;
}

function enterTribunal() {
    const input = document.getElementById('username');
    const name = input.value.trim();
    if (!name) {
        input.style.borderColor = '#e84057';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }

    // 存储用户 & 加入成员列表
    sessionStorage.setItem(USER_KEY, name);
    const members = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!members.includes(name)) {
        members.push(name);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    }

    // 播放退出过渡动画后跳转
    const overlay = document.getElementById('exit-overlay');
    document.getElementById('exit-name').textContent = name;
    overlay.classList.add('active');

    setTimeout(() => {
        window.location.href = 'tribunal.html';
    }, 1500);
}

// ===== 粒子 =====
function initParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (6 + Math.random() * 8) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
        container.appendChild(p);
    }
}

// ===== 启动 =====
startIntro();
