const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const coinsElement = document.getElementById('coins');
const finalScoreElement = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const shopScreen = document.getElementById('shop-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const shopBtnStart = document.getElementById('shop-btn-start');
const shopBtnOver = document.getElementById('shop-btn-over');
const shopCloseBtn = document.getElementById('shop-close-btn');

// Mobile controls
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

// Game constants
const gridSize = 25;
const tileCount = canvas.width / gridSize;
let gameSpeed = 120; // ms per frame

// Colors (Base)
const colors = {
    apple: '#ff3366',
    appleGlow: 'rgba(255, 51, 102, 0.8)',
    eye: '#0f0f13',
    tongue: '#ff3366',
    gold: '#ffd700',
    goldGlow: 'rgba(255, 215, 0, 0.8)'
};

// --- SHOP DATA ---
const skins = [
    { id: 'skin-classic', name: 'Классическая Неоновая', desc: 'Стандартный цвет', price: 0, color: '#00cc6a', headColor: '#00ff88', glow: 'rgba(0, 255, 136, 0.6)' },
    { id: 'skin-cyber', name: 'Кибер-Синяя', desc: 'Холодные синие оттенки', price: 50, color: '#0088ff', headColor: '#00ccff', glow: 'rgba(0, 204, 255, 0.6)' },
    { id: 'skin-toxic', name: 'Токсичная Пурпурная', desc: 'Яркий фиолетовый', price: 100, color: '#aa00ff', headColor: '#ff00ff', glow: 'rgba(255, 0, 255, 0.6)' },
    { id: 'skin-gold', name: 'Золотая Элита', desc: 'Переливающийся золотой', price: 250, color: '#ccaa00', headColor: '#ffcc00', glow: 'rgba(255, 204, 0, 0.6)' },
    { id: 'skin-ghost', name: 'Призрачная Белая', desc: 'Чистый белый свет', price: 400, color: '#dddddd', headColor: '#ffffff', glow: 'rgba(255, 255, 255, 0.8)' },
    { id: 'skin-demon', name: 'Огненный Демон', desc: 'Пылающий красный', price: 600, color: '#ff3300', headColor: '#ff6600', glow: 'rgba(255, 51, 0, 0.6)' },
    { id: 'skin-acid', name: 'Радиоактивная', desc: 'Токсичный желто-зеленый', price: 800, color: '#ccff00', headColor: '#e6ff00', glow: 'rgba(204, 255, 0, 0.6)' }
];

const trails = [
    { id: 'trail-none', name: 'Без следа', desc: 'Обычное движение', price: 0 },
    { id: 'trail-dust', name: 'Звездная пыль', desc: 'Маленькие белые искры', price: 50 },
    { id: 'trail-fire', name: 'Огненный след', desc: 'Частицы пламени', price: 150 },
    { id: 'trail-rainbow', name: 'Радуга', desc: 'Все цвета радуги', price: 300 },
    { id: 'trail-bubbles', name: 'Пузырьки', desc: 'Синие водяные пузырьки', price: 500 },
    { id: 'trail-matrix', name: 'Матрица', desc: 'Цифровой зеленый след', price: 700 },
    { id: 'trail-pixels', name: 'Квадратные Пиксели', desc: 'Ретро след', price: 1000 }
];

// --- USER DATA ---
let userData = {
    coins: 0,
    inventory: {
        skins: ['skin-classic'],
        trails: ['trail-none']
    },
    equipped: {
        skin: 'skin-classic',
        trail: 'trail-none'
    }
};

function loadUserData() {
    const saved = localStorage.getItem('snakeUserData');
    if (saved) {
        userData = JSON.parse(saved);
        // Ensure defaults exist if old save format
        if (!userData.inventory) userData.inventory = { skins: ['skin-classic'], trails: ['trail-none'] };
        if (!userData.equipped) userData.equipped = { skin: 'skin-classic', trail: 'trail-none' };
        if (userData.coins === undefined) userData.coins = 0;
    }
    updateCoinsUI();
}

function saveUserData() {
    localStorage.setItem('snakeUserData', JSON.stringify(userData));
    updateCoinsUI();
}

function updateCoinsUI() {
    coinsElement.textContent = userData.coins;
}

function addCoins(amount) {
    userData.coins += amount;
    saveUserData();
    coinsElement.classList.add('pop');
    setTimeout(() => coinsElement.classList.remove('pop'), 300);
}

// --- SHOP LOGIC ---
function openShop() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
    renderShop();
}

function closeShop() {
    shopScreen.classList.add('hidden');
    if (score === 0 && !isPlaying) {
        startScreen.classList.remove('hidden');
    } else {
        gameOverScreen.classList.remove('hidden');
    }
}

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById('tab-' + e.target.dataset.tab).classList.add('active');
    });
});

function renderShop() {
    const skinsContainer = document.getElementById('tab-skins');
    const trailsContainer = document.getElementById('tab-trails');
    skinsContainer.innerHTML = '';
    trailsContainer.innerHTML = '';

    skins.forEach(skin => skinsContainer.appendChild(createShopItem(skin, 'skins', 'skin')));
    trails.forEach(trail => trailsContainer.appendChild(createShopItem(trail, 'trails', 'trail')));
}

function createShopItem(item, category, equipKey) {
    const isOwned = userData.inventory[category].includes(item.id);
    const isEquipped = userData.equipped[equipKey] === item.id;
    const canAfford = userData.coins >= item.price;

    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
        <div class="shop-item-info">
            <div class="shop-item-title">${item.name}</div>
            <div class="shop-item-desc">${item.desc}</div>
        </div>
        <div class="shop-item-action">
            ${isEquipped 
                ? `<button class="btn-equipped">Надето</button>` 
                : isOwned 
                    ? `<button class="btn-equip" data-id="${item.id}" data-type="${equipKey}">Надеть</button>`
                    : `<button class="btn-buy ${canAfford ? '' : 'disabled'}" data-id="${item.id}" data-type="${category}" data-price="${item.price}">🪙 ${item.price}</button>`
            }
        </div>
    `;

    // Event listeners
    const btn = div.querySelector('button');
    if (btn.classList.contains('btn-buy') && !btn.classList.contains('disabled')) {
        btn.addEventListener('click', () => buyItem(item.id, category, equipKey, item.price));
    } else if (btn.classList.contains('btn-equip')) {
        btn.addEventListener('click', () => equipItem(item.id, equipKey));
    }

    return div;
}

function buyItem(id, category, equipKey, price) {
    if (userData.coins >= price) {
        userData.coins -= price;
        userData.inventory[category].push(id);
        userData.equipped[equipKey] = id; // Auto-equip
        saveUserData();
        renderShop();
    }
}

function equipItem(id, equipKey) {
    userData.equipped[equipKey] = id;
    saveUserData();
    renderShop();
}

shopBtnStart.addEventListener('click', openShop);
shopBtnOver.addEventListener('click', openShop);
shopCloseBtn.addEventListener('click', closeShop);


// --- GAME LOGIC ---
let snake = [];
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let apple = { x: 15, y: 15 };
let goldenCoin = null; // { x, y, lifeTimer }
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let isPlaying = false;
let isJoyful = 0;
let particles = [];
let trailParticles = [];
let gameLoopId = null;
let lastTime = 0;
let accumulator = 0;

highScoreElement.textContent = highScore;

function initSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    direction = { x: 0, y: -1 };
    nextDirection = { x: 0, y: -1 };
}

function startGame() {
    initSnake();
    score = 0;
    gameSpeed = 130;
    goldenCoin = null;
    updateScore();
    placeApple();
    particles = [];
    trailParticles = [];
    isPlaying = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    shopScreen.classList.add('hidden');
    
    lastTime = performance.now();
    accumulator = 0;
    cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameLoop(currentTime) {
    if (!isPlaying) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    accumulator += deltaTime;
    
    if (accumulator >= gameSpeed) {
        update();
        accumulator = 0;
    }
    
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

function update() {
    direction = nextDirection;
    
    const head = { 
        x: snake[0].x + direction.x, 
        y: snake[0].y + direction.y 
    };
    
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount || checkCollision(head)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    let ateSomething = false;
    
    // Check apple
    if (head.x === apple.x && head.y === apple.y) {
        eatApple();
        ateSomething = true;
    } 
    // Check golden coin
    else if (goldenCoin && head.x === goldenCoin.x && head.y === goldenCoin.y) {
        eatGoldenCoin();
        ateSomething = true;
    }
    
    if (!ateSomething) {
        snake.pop(); // Remove tail
    }
    
    if (isJoyful > 0) isJoyful--;
    
    // Golden coin logic
    if (goldenCoin) {
        goldenCoin.lifeTimer--;
        if (goldenCoin.lifeTimer <= 0) {
            goldenCoin = null; // despawn
        }
    }
    
    // Create trail particles at tail if moving
    if (direction.x !== 0 || direction.y !== 0) {
        createTrailParticles();
    }
}

function checkCollision(pos) {
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === pos.x && snake[i].y === pos.y) return true;
    }
    return false;
}

function placeItem() {
    let newPos;
    let valid = false;
    while (!valid) {
        valid = true;
        newPos = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
        for (let segment of snake) {
            if (segment.x === newPos.x && segment.y === newPos.y) {
                valid = false;
                break;
            }
        }
    }
    return newPos;
}

function placeApple() {
    apple = placeItem();
}

function spawnGoldenCoin() {
    if (!goldenCoin && Math.random() < 0.20) { // 20% chance on eating apple
        goldenCoin = placeItem();
        goldenCoin.lifeTimer = 40; // ~5 seconds based on update rate
    }
}

function eatApple() {
    score += 10;
    updateScore();
    addCoins(10);
    placeApple();
    spawnGoldenCoin();
    
    isJoyful = 15;
    createExplosion(apple.x * gridSize + gridSize/2, apple.y * gridSize + gridSize/2, colors.apple);
    
    if (gameSpeed > 70) gameSpeed -= 2;
    scoreElement.classList.add('pop');
    setTimeout(() => scoreElement.classList.remove('pop'), 200);
}

function eatGoldenCoin() {
    addCoins(50);
    createExplosion(goldenCoin.x * gridSize + gridSize/2, goldenCoin.y * gridSize + gridSize/2, colors.gold);
    goldenCoin = null;
    isJoyful = 15;
}

function updateScore() {
    scoreElement.textContent = score;
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
}

function gameOver() {
    isPlaying = false;
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// --- DRAWING ---
function draw() {
    ctx.fillStyle = '#1a1a24';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    for(let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    drawApple();
    if (goldenCoin) drawGoldenCoin();
    drawTrailParticles();
    drawParticles();
    drawSnake();
}

function drawApple() {
    const x = apple.x * gridSize;
    const y = apple.y * gridSize;
    const size = gridSize - 4;
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.appleGlow;
    const pulse = Math.sin(performance.now() / 200) * 2;
    
    ctx.fillStyle = colors.apple;
    ctx.beginPath();
    ctx.arc(x + gridSize/2, y + gridSize/2, (size/2) + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawGoldenCoin() {
    const x = goldenCoin.x * gridSize;
    const y = goldenCoin.y * gridSize;
    const size = gridSize - 6;
    
    ctx.shadowBlur = 20;
    ctx.shadowColor = colors.goldGlow;
    
    // Blink if about to despawn
    if (goldenCoin.lifeTimer < 15 && Math.floor(performance.now() / 150) % 2 === 0) {
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.5;
    }
    
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.arc(x + gridSize/2, y + gridSize/2, size/2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', x + gridSize/2, y + gridSize/2 + 1);
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawSnake() {
    const skinData = skins.find(s => s.id === userData.equipped.skin) || skins[0];
    
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        const isHead = i === 0;
        
        const x = segment.x * gridSize;
        const y = segment.y * gridSize;
        
        let currentGridSize = gridSize - 2;
        
        if (isHead) {
            ctx.fillStyle = skinData.headColor;
            ctx.shadowBlur = 10;
            ctx.shadowColor = skinData.glow;
            
            ctx.save();
            if (isJoyful > 0) {
                currentGridSize += 4;
                const wiggle = Math.sin(performance.now() / 50) * 2;
                ctx.translate(x + gridSize/2 + (direction.y !== 0 ? wiggle : 0), y + gridSize/2 + (direction.x !== 0 ? wiggle : 0));
                ctx.beginPath();
                ctx.roundRect(-currentGridSize/2, -currentGridSize/2, currentGridSize, currentGridSize, 6);
                ctx.fill();
                drawEyes(0, 0, true);
            } else {
                ctx.translate(x + gridSize/2, y + gridSize/2);
                ctx.beginPath();
                ctx.roundRect(-currentGridSize/2, -currentGridSize/2, currentGridSize, currentGridSize, 6);
                ctx.fill();
                drawEyes(0, 0, false);
            }
            ctx.restore();
        } else {
            ctx.fillStyle = skinData.color;
            ctx.shadowBlur = 0;
            
            const shrink = Math.min((snake.length - i) / snake.length + 0.5, 1);
            const size = currentGridSize * shrink;
            const diff = (gridSize - size) / 2;
            
            ctx.beginPath();
            ctx.roundRect(x + diff, y + diff, size, size, 4);
            ctx.fill();
        }
    }
    ctx.shadowBlur = 0;
}

function drawEyes(cx, cy, isHappy) {
    ctx.save();
    if (direction.x === 1) ctx.rotate(Math.PI / 2);
    else if (direction.x === -1) ctx.rotate(-Math.PI / 2);
    else if (direction.y === 1) ctx.rotate(Math.PI);
    
    const eyeSpacing = 5;
    const eyeY = -4;
    
    ctx.fillStyle = colors.eye;
    
    if (isHappy) {
        ctx.strokeStyle = colors.eye;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 3, Math.PI, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(eyeSpacing, eyeY, 3, Math.PI, 0);
        ctx.stroke();
        
        ctx.fillStyle = colors.tongue;
        ctx.fillRect(-2, -12, 4, 6);
    } else {
        ctx.beginPath();
        ctx.arc(-eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.arc(eyeSpacing, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-eyeSpacing - 1, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.arc(eyeSpacing - 1, eyeY - 1, 1, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// --- PARTICLES ---
function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: Math.random() > 0.5 ? color : '#ffffff'
        });
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createTrailParticles() {
    const trailType = userData.equipped.trail;
    if (trailType === 'trail-none') return;
    
    const tail = snake[snake.length - 1];
    if (!tail) return;
    
    const px = tail.x * gridSize + gridSize/2 + (Math.random()-0.5)*10;
    const py = tail.y * gridSize + gridSize/2 + (Math.random()-0.5)*10;
    
    let color = '#ffffff';
    let vx = (Math.random() - 0.5);
    let vy = (Math.random() - 0.5);
    let lifeDecay = 0.02;
    let size = 2;
    let shape = 'circle';
    
    if (trailType === 'trail-dust') {
        color = '#ffffff';
        lifeDecay = 0.03;
    } else if (trailType === 'trail-fire') {
        const fireColors = ['#ff0000', '#ff5500', '#ffaa00'];
        color = fireColors[Math.floor(Math.random() * fireColors.length)];
        size = 3;
        lifeDecay = 0.05;
    } else if (trailType === 'trail-rainbow') {
        color = `hsl(${(performance.now() / 10) % 360}, 100%, 50%)`;
        size = 3;
    } else if (trailType === 'trail-bubbles') {
        const bubbleColors = ['#00ccff', '#0088ff', '#ffffff'];
        color = bubbleColors[Math.floor(Math.random() * bubbleColors.length)];
        size = Math.random() * 3 + 2;
        vy = (Math.random() - 1); // bubbles float up slightly relative to tail
        lifeDecay = 0.015;
        shape = 'stroke-circle';
    } else if (trailType === 'trail-matrix') {
        color = '#00ff00';
        size = 2;
        vy = Math.random() * 0.5 + 0.5; // fall down
        vx = 0;
        lifeDecay = 0.02;
        shape = 'rect';
    } else if (trailType === 'trail-pixels') {
        color = `hsl(${(performance.now() / 5) % 360}, 80%, 60%)`;
        size = 4;
        vx = (Math.random() - 0.5) * 0.5;
        vy = (Math.random() - 0.5) * 0.5;
        lifeDecay = 0.04;
        shape = 'rect';
    }
    
    trailParticles.push({ x: px, y: py, vx, vy, life: 1, color, size, lifeDecay, shape });
}

function drawTrailParticles() {
    for (let i = trailParticles.length - 1; i >= 0; i--) {
        const p = trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.lifeDecay;
        
        if (p.life <= 0) {
            trailParticles.splice(i, 1);
            continue;
        }
        
        ctx.globalAlpha = p.life;
        
        if (p.shape === 'stroke-circle') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.stroke();
        } else if (p.shape === 'rect') {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - (p.size * p.life)/2, p.y - (p.size * p.life)/2, p.size * p.life, p.size * p.life);
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
}

// --- INPUT ---
function setDirection(newDirX, newDirY) {
    if (!isPlaying) return;
    if (direction.x !== 0 && newDirX === -direction.x) return;
    if (direction.y !== 0 && newDirY === -direction.y) return;
    nextDirection = { x: newDirX, y: newDirY };
}

window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
    
    if (e.key === ' ' && !isPlaying && shopScreen.classList.contains('hidden')) {
        startGame();
        return;
    }
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W': setDirection(0, -1); break;
        case 'ArrowDown':
        case 's':
        case 'S': setDirection(0, 1); break;
        case 'ArrowLeft':
        case 'a':
        case 'A': setDirection(-1, 0); break;
        case 'ArrowRight':
        case 'd':
        case 'D': setDirection(1, 0); break;
    }
});

const bindBtn = (btn, dx, dy) => {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); setDirection(dx, dy); });
    btn.addEventListener('mousedown', () => setDirection(dx, dy));
};
bindBtn(btnUp, 0, -1);
bindBtn(btnDown, 0, 1);
bindBtn(btnLeft, -1, 0);
bindBtn(btnRight, 1, 0);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Init
loadUserData();
ctx.fillStyle = '#1a1a24';
ctx.fillRect(0, 0, canvas.width, canvas.height);
