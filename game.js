// Tank Battle Game - Main Game Logic

// Game state
let game = {
    running: false,
    paused: false,
    gameOver: false,
    score: 0,
    level: 1,
    health: 100,
    maxHealth: 100,
    enemiesCount: 5,
    enemiesDestroyed: 0,
    time: 0,
    powerups: {
        speedBoost: 0,
        shield: 0,
        multishot: 0
    },
    difficulty: 'medium',
    soundEnabled: true
};

// Game objects
let player = {
    x: 400,
    y: 300,
    width: 40,
    height: 40,
    speed: 5,
    color: '#00eeff',
    direction: 0, // in radians
    bullets: [],
    lastShot: 0,
    shootCooldown: 300, // ms
    isShielded: false
};

let enemies = [];
let bullets = [];
let enemyBullets = [];
let powerups = [];
let walls = [];

// Canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI elements
const healthEl = document.getElementById('health');
const enemiesEl = document.getElementById('enemies');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const levelEl = document.getElementById('level');
const speedBoostEl = document.getElementById('speed-boost');
const shieldEl = document.getElementById('shield');
const multishotEl = document.getElementById('multishot');

// Buttons and controls
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');
const difficultySelect = document.getElementById('difficulty');
const playAgainBtn = document.getElementById('playAgainBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreEl = document.getElementById('finalScore');
const finalEnemiesEl = document.getElementById('finalEnemies');
const finalTimeEl = document.getElementById('finalTime');
const finalLevelEl = document.getElementById('finalLevel');

// Initialize game
function init() {
    // Reset game state
    game.running = false;
    game.paused = false;
    game.gameOver = false;
    game.score = 0;
    game.level = 1;
    game.health = 100;
    game.enemiesCount = 5;
    game.enemiesDestroyed = 0;
    game.time = 0;
    game.powerups = {
        speedBoost: 0,
        shield: 0,
        multishot: 0
    };
    game.difficulty = difficultySelect.value;

    // Reset player
    player.x = 400;
    player.y = 300;
    player.bullets = [];
    player.isShielded = false;
    player.speed = 5;

    // Clear arrays
    enemies = [];
    bullets = [];
    enemyBullets = [];
    powerups = [];
    walls = [];

    // Create initial walls
    createWalls();

    // Create initial enemies
    for (let i = 0; i < game.enemiesCount; i++) {
        createEnemy();
    }

    // Update UI
    updateUI();

    // Hide game over modal
    gameOverModal.style.display = 'none';

    // Draw initial state
    draw();
}

// Create walls for the level
function createWalls() {
    // Border walls
    walls.push({x: 0, y: 0, width: canvas.width, height: 20});
    walls.push({x: 0, y: 0, width: 20, height: canvas.height});
    walls.push({x: 0, y: canvas.height - 20, width: canvas.width, height: 20});
    walls.push({x: canvas.width - 20, y: 0, width: 20, height: canvas.height});

    // Some interior walls
    walls.push({x: 150, y: 150, width: 200, height: 20});
    walls.push({x: 450, y: 150, width: 20, height: 200});
    walls.push({x: 250, y: 400, width: 300, height: 20});
    walls.push({x: 150, y: 450, width: 20, height: 100});
}

// Create a new enemy tank
function createEnemy() {
    const size = 35;
    const x = Math.random() * (canvas.width - size * 2) + size;
    const y = Math.random() * (canvas.height - size * 2) + size;

    // Make sure enemy doesn't spawn too close to player
    if (Math.abs(x - player.x) < 100 && Math.abs(y - player.y) < 100) {
        return createEnemy(); // Try again
    }

    const enemy = {
        x: x,
        y: y,
        width: size,
        height: size,
        speed: getDifficultyValue(1, 2, 3, 4),
        color: '#ff5555',
        direction: Math.random() * Math.PI * 2,
        bullets: [],
        lastShot: 0,
        shootCooldown: getDifficultyValue(2000, 1500, 1000, 800),
        health: getDifficultyValue(2, 3, 4, 5),
        maxHealth: getDifficultyValue(2, 3, 4, 5),
        behavior: Math.floor(Math.random() * 3), // 0: wander, 1: chase, 2: patrol
        patrolPoint: {x: x, y: y},
        patrolRadius: 100 + Math.random() * 100
    };

    enemies.push(enemy);
    return enemy;
}

// Create a power-up at random location
function createPowerup() {
    const types = ['speed', 'shield', 'multishot'];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 25;

    const powerup = {
        x: Math.random() * (canvas.width - size * 2) + size,
        y: Math.random() * (canvas.height - size * 2) + size,
        width: size,
        height: size,
        type: type,
        color: type === 'speed' ? '#00eeff' : type === 'shield' ? '#ffaa00' : '#ff5555',
        duration: 10000 // 10 seconds
    };

    powerups.push(powerup);
}

// Get difficulty-based value
function getDifficultyValue(easy, medium, hard, insane) {
    switch(game.difficulty) {
        case 'easy': return easy;
        case 'medium': return medium;
        case 'hard': return hard;
        case 'insane': return insane;
        default: return medium;
    }
}

// Update UI elements
function updateUI() {
    healthEl.textContent = game.health;
    enemiesEl.textContent = enemies.length;
    scoreEl.textContent = game.score;
    timeEl.textContent = Math.floor(game.time);
    levelEl.textContent = game.level;
    speedBoostEl.textContent = (game.powerups.speedBoost / 1000).toFixed(1);
    shieldEl.textContent = (game.powerups.shield / 1000).toFixed(1);
    multishotEl.textContent = (game.powerups.multishot / 1000).toFixed(1);
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    drawGrid();

    // Draw walls
    drawWalls();

    // Draw power-ups
    drawPowerups();

    // Draw player
    drawTank(player, true);

    // Draw player bullets
    drawBullets(bullets, player.color);

    // Draw enemies
    enemies.forEach(enemy => {
        drawTank(enemy, false);
        // Draw enemy health bar
        drawHealthBar(enemy);
    });

    // Draw enemy bullets
    drawBullets(enemyBullets, '#ff5555');

    // Draw player health bar
    drawPlayerHealthBar();

    // Draw game info
    drawGameInfo();
}

// Draw grid background
function drawGrid() {
    ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw walls
function drawWalls() {
    ctx.fillStyle = '#666';
    walls.forEach(wall => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        // Add some texture
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    });
}

// Draw power-ups
function drawPowerups() {
    powerups.forEach(powerup => {
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x + powerup.width/2, powerup.y + powerup.height/2, powerup.width/2, 0, Math.PI * 2);
        ctx.fill();

        // Add icon based on type
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let symbol = '⚡';
        if (powerup.type === 'shield') symbol = '🛡️';
        if (powerup.type === 'multishot') symbol = '🔫';
        ctx.fillText(symbol, powerup.x + powerup.width/2, powerup.y + powerup.height/2);

        // Add glow effect
        ctx.shadowColor = powerup.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(powerup.x + powerup.width/2, powerup.y + powerup.height/2, powerup.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Draw a tank (player or enemy)
function drawTank(tank, isPlayer) {
    // Save context
    ctx.save();

    // Move to tank center and rotate
    ctx.translate(tank.x + tank.width/2, tank.y + tank.height/2);
    ctx.rotate(tank.direction);

    // Draw tank body
    ctx.fillStyle = tank.color;
    ctx.fillRect(-tank.width/2, -tank.height/2, tank.width, tank.height);

    // Draw tank tracks
    ctx.fillStyle = '#333';
    ctx.fillRect(-tank.width/2 - 5, -tank.height/2 - 5, tank.width + 10, 5);
    ctx.fillRect(-tank.width/2 - 5, tank.height/2, tank.width + 10, 5);

    // Draw tank turret
    ctx.fillStyle = isPlayer ? '#00ffaa' : '#ffaa00';
    ctx.fillRect(-5, -15, 10, 30);

    // Draw tank barrel
    ctx.fillStyle = '#666';
    ctx.fillRect(0, -3, 25, 6);

    // Draw shield if active
    if (isPlayer && player.isShielded) {
        ctx.strokeStyle = '#00eeff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, tank.width/2 + 10, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Restore context
    ctx.restore();
}

// Draw bullets
function drawBullets(bulletArray, color) {
    bulletArray.forEach(bullet => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add glow
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Draw health bar for enemy
function drawHealthBar(enemy) {
    const barWidth = enemy.width;
    const barHeight = 5;
    const x = enemy.x;
    const y = enemy.y - 10;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health
    const healthPercent = enemy.health / enemy.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
}

// Draw player health bar
function drawPlayerHealthBar() {
    const barWidth = 200;
    const barHeight = 15;
    const x = 10;
    const y = 10;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, barWidth, barHeight);

    // Health
    const healthPercent = game.health / game.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Health text
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText(`HP: ${game.health}/${game.maxHealth}`, x + barWidth/2 - 30, y + barHeight/2 + 4);
}

// Draw game info on canvas
function drawGameInfo() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Orbitron';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${game.score}`, canvas.width - 20, 30);
    ctx.fillText(`LEVEL: ${game.level}`, canvas.width - 20, 60);
    ctx.fillText(`ENEMIES: ${enemies.length}`, canvas.width - 20, 90);

    if (game.paused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffcc00';
        ctx.font = '48px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('GAME PAUSED', canvas.width/2, canvas.height/2);
        ctx.font = '24px Orbitron';
        ctx.fillText('Press P or click Resume to continue', canvas.width/2, canvas.height/2 + 50);
    }
}

// Update game state
function update(deltaTime) {
    if (!game.running || game.paused || game.gameOver) return;

    // Update game time
    game.time += deltaTime / 1000;

    // Update power-up timers
    updatePowerups(deltaTime);

    // Update player
    updatePlayer(deltaTime);

    // Update bullets
    updateBullets(deltaTime);

    // Update enemy bullets
    updateEnemyBullets(deltaTime);

    // Update enemies
    updateEnemies(deltaTime);

    // Check collisions
    checkCollisions();

    // Spawn new enemies if needed
    if (enemies.length < game.enemiesCount) {
        if (Math.random() < 0.01) { // 1% chance per frame
            createEnemy();
        }
    }

    // Spawn power-ups occasionally
    if (Math.random() < 0.001 && powerups.length < 3) { // 0.1% chance per frame
        createPowerup();
    }

    // Level up based on score
    const newLevel = Math.floor(game.score / 1000) + 1;
    if (newLevel > game.level) {
        game.level = newLevel;
        game.enemiesCount = 5 + game.level * 2;
        // Increase player speed slightly each level
        player.speed = 5 + game.level * 0.2;
    }

    // Update UI
    updateUI();

    // Draw everything
    draw();
}

// Update power-up timers
function updatePowerups(deltaTime) {
    // Speed boost
    if (game.powerups.speedBoost > 0) {
        game.powerups.speedBoost -= deltaTime;
        if (game.powerups.speedBoost <= 0) {
            player.speed = 5 + game.level * 0.2;
        }
    }

    // Shield
    if (game.powerups.shield > 0) {
        game.powerups.shield -= deltaTime;
        player.isShielded = true;
        if (game.powerups.shield <= 0) {
            player.isShielded = false;
        }
    }

    // Multishot
    if (game.powerups.multishot > 0) {
        game.powerups.multishot -= deltaTime;
    }
}

// Update player position and actions
function updatePlayer(deltaTime) {
    // Player movement is handled by key events, but we update position here
    // Boundary checking
    player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
    player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));

    // Update player bullets
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life -= deltaTime;

        // Remove if out of bounds or expired
        if (bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height ||
            bullet.life <= 0) {
            player.bullets.splice(i, 1);
        }
    }

    // Check wall collision for player
    checkWallCollision(player);
}

// Update enemy bullets
function updateEnemyBullets(deltaTime) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life -= deltaTime;

        // Remove if out of bounds or expired
        if (bullet.x < 0 || bullet.x > canvas.width ||
            bullet.y < 0 || bullet.y > canvas.height ||
            bullet.life <= 0) {
            enemyBullets.splice(i, 1);
        }
    }
}

// Update all bullets
function updateBullets(deltaTime) {
    // Update player bullets are handled in updatePlayer
    // Update enemy bullets are handled separately
}

// Update enemies
function updateEnemies(deltaTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        // Enemy AI
        updateEnemyAI(enemy, deltaTime);

        // Boundary checking
        enemy.x = Math.max(enemy.width/2, Math.min(canvas.width - enemy.width/2, enemy.x));
        enemy.y = Math.max(enemy.height/2, Math.min(canvas.height - enemy.height/2, enemy.y));

        // Shooting
        enemy.lastShot += deltaTime;
        if (enemy.lastShot >= enemy.shootCooldown) {
            shootEnemy(enemy);
            enemy.lastShot = 0;
        }

        // Check wall collision
        checkWallCollision(enemy);

        // Remove dead enemies
        if (enemy.health <= 0) {
            enemies.splice(i, 1);
            game.enemiesDestroyed++;
            game.score += 100 * game.level;
            // Chance to drop power-up
            if (Math.random() < 0.2) { // 20% chance
                createPowerup();
            }
        }
    }
}

// Enemy AI
function updateEnemyAI(enemy, deltaTime) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    switch(enemy.behavior) {
        case 0: // Wander
            if (Math.random() < 0.01) {
                enemy.direction += (Math.random() - 0.5) * 1.5;
            }
            break;

        case 1: // Chase player
            if (distance < 300) { // Chase if player is within range
                enemy.direction = Math.atan2(dy, dx);
            } else {
                // Wander if player is far
                if (Math.random() < 0.01) {
                    enemy.direction += (Math.random() - 0.5) * 1.5;
                }
            }
            break;

        case 2: // Patrol around a point
            const patrolDx = enemy.patrolPoint.x - enemy.x;
            const patrolDy = enemy.patrolPoint.y - enemy.y;
            const patrolDistance = Math.sqrt(patrolDx * patrolDx + patrolDy * patrolDy);

            if (patrolDistance > enemy.patrolRadius) {
                enemy.direction = Math.atan2(patrolDy, patrolDx);
            } else {
                enemy.direction += 0.02;
            }
            break;
    }

    // Move enemy
    enemy.x += Math.cos(enemy.direction) * enemy.speed;
    enemy.y += Math.sin(enemy.direction) * enemy.speed;
}

// Enemy shooting
function shootEnemy(enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);
    const speed = 7;

    const bullet = {
        x: enemy.x + Math.cos(angle) * (enemy.width/2 + 10),
        y: enemy.y + Math.sin(angle) * (enemy.height/2 + 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 5,
        life: 3000 // 3 seconds
    };

    enemyBullets.push(bullet);
}

// Check all collisions
function checkCollisions() {
    // Player bullets vs enemies
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (circleRectCollision(bullet, enemy)) {
                enemy.health--;
                player.bullets.splice(i, 1);
                game.score += 10;
                break;
            }
        }
    }

    // Enemy bullets vs player
    if (!player.isShielded) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            if (circleRectCollision(bullet, player)) {
                game.health -= getDifficultyValue(5, 10, 15, 20);
                enemyBullets.splice(i, 1);
                if (game.health <= 0) {
                    gameOver();
                }
                break;
            }
        }
    }

    // Player vs enemies (collision damage)
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        if (rectRectCollision(player, enemy)) {
            game.health -= getDifficultyValue(2, 5, 8, 12);
            enemy.health -= 1;
            if (game.health <= 0) {
                gameOver();
            }
            if (enemy.health <= 0) {
                enemies.splice(i, 1);
                game.enemiesDestroyed++;
                game.score += 100 * game.level;
            }
            // Push player and enemy apart
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const pushForce = 5;
            player.x += (dx / distance) * pushForce;
            player.y += (dy / distance) * pushForce;
            enemy.x -= (dx / distance) * pushForce;
            enemy.y -= (dy / distance) * pushForce;
        }
    }

    // Player vs power-ups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        if (rectRectCollision(player, powerup)) {
            collectPowerup(powerup.type);
            powerups.splice(i, 1);
            game.score += 50;
        }
    }
}

// Check collision between circle and rectangle
function circleRectCollision(circle, rect) {
    const closestX = Math.max(rect.x - rect.width/2, Math.min(circle.x, rect.x + rect.width/2));
    const closestY = Math.max(rect.y - rect.height/2, Math.min(circle.y, rect.y + rect.height/2));
    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return (dx * dx + dy * dy) < (circle.radius * circle.radius);
}

// Check collision between two rectangles
function rectRectCollision(rect1, rect2) {
    return rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
           rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
           rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
           rect1.y + rect1.height/2 > rect2.y - rect2.height/2;
}

// Check wall collision for a tank
function checkWallCollision(tank) {
    for (const wall of walls) {
        if (rectRectCollision(tank, wall)) {
            // Simple collision response: push tank out
            const tankRight = tank.x + tank.width/2;
            const tankLeft = tank.x - tank.width/2;
            const tankBottom = tank.y + tank.height/2;
            const tankTop = tank.y - tank.height/2;

            const wallRight = wall.x + wall.width;
            const wallLeft = wall.x;
            const wallBottom = wall.y + wall.height;
            const wallTop = wall.y;

            // Calculate overlap on each side
            const overlapLeft = tankRight - wallLeft;
            const overlapRight = wallRight - tankLeft;
            const overlapTop = tankBottom - wallTop;
            const overlapBottom = wallBottom - tankTop;

            // Find smallest overlap
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            // Push tank in direction of smallest overlap
            if (minOverlap === overlapLeft) {
                tank.x -= overlapLeft;
            } else if (minOverlap === overlapRight) {
                tank.x += overlapRight;
            } else if (minOverlap === overlapTop) {
                tank.y -= overlapTop;
            } else if (minOverlap === overlapBottom) {
                tank.y += overlapBottom;
            }
        }
    }
}

// Collect power-up
function collectPowerup(type) {
    const duration = 10000; // 10 seconds

    switch(type) {
        case 'speed':
            game.powerups.speedBoost = duration;
            player.speed *= 1.5;
            break;
        case 'shield':
            game.powerups.shield = duration;
            player.isShielded = true;
            break;
        case 'multishot':
            game.powerups.multishot = duration;
            break;
    }
}

// Player shooting
function shoot() {
    const now = Date.now();
    if (now - player.lastShot < player.shootCooldown) return;

    player.lastShot = now;

    let bulletCount = 1;
    let spread = 0;

    if (game.powerups.multishot > 0) {
        bulletCount = 3;
        spread = 0.2;
    }

    for (let i = 0; i < bulletCount; i++) {
        const angle = player.direction + (i - (bulletCount - 1) / 2) * spread;
        const speed = 10;

        const bullet = {
            x: player.x + Math.cos(angle) * (player.width/2 + 10),
            y: player.y + Math.sin(angle) * (player.height/2 + 10),
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 4,
            life: 2000 // 2 seconds
        };

        player.bullets.push(bullet);
        bullets.push(bullet);
    }
}

// Game over
function gameOver() {
    game.running = false;
    game.gameOver = true;

    // Update final stats
    finalScoreEl.textContent = game.score;
    finalEnemiesEl.textContent = game.enemiesDestroyed;
    finalTimeEl.textContent = Math.floor(game.time);
    finalLevelEl.textContent = game.level;

    // Show game over modal
    gameOverModal.style.display = 'flex';
}

// Start game
function startGame() {
    if (!game.running) {
        game.running = true;
        game.paused = false;
        game.gameOver = false;
        startBtn.innerHTML = '<i class="fas fa-play"></i> Restart';
        gameLoop();
    }
}

// Pause game
function togglePause() {
    if (!game.running) return;

    game.paused = !game.paused;
    pauseBtn.innerHTML = game.paused ?
        '<i class="fas fa-play"></i> Resume' :
        '<i class="fas fa-pause"></i> Pause';
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp = 0) {
    if (!game.running) return;

    const deltaTime = timestamp - lastTime || 0;
    lastTime = timestamp;

    update(deltaTime);

    if (!game.gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Keyboard controls
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false
};

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }

    // Shooting
    if (e.key === ' ' && game.running && !game.paused) {
        shoot();
    }

    // Pause with P key
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }

    // Restart with R key
    if (e.key === 'r' || e.key === 'R') {
        init();
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

// Update player movement based on keys
function updatePlayerMovement() {
    if (!game.running || game.paused) return;

    let moved = false;

    if (keys.ArrowUp) {
        player.y -= player.speed;
        moved = true;
    }
    if (keys.ArrowDown) {
        player.y += player.speed;
        moved = true;
    }
    if (keys.ArrowLeft) {
        player.x -= player.speed;
        moved = true;
    }
    if (keys.ArrowRight) {
        player.x += player.speed;
        moved = true;
    }

    // Update player direction if moving
    if (moved) {
        if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
            // Calculate direction based on keys
            let dx = 0, dy = 0;
            if (keys.ArrowLeft) dx -= 1;
            if (keys.ArrowRight) dx += 1;
            if (keys.ArrowUp) dy -= 1;
            if (keys.ArrowDown) dy += 1;

            player.direction = Math.atan2(dy, dx);
        }
    }
}

// Update player movement in a separate loop for smoother controls
setInterval(updatePlayerMovement, 16); // ~60fps

// Event listeners for buttons
startBtn.addEventListener('click', () => {
    if (!game.running || game.gameOver) {
        init();
        startGame();
    } else {
        // If game is running, restart
        init();
        startGame();
    }
});

pauseBtn.addEventListener('click', togglePause);

restartBtn.addEventListener('click', () => {
    init();
    startGame();
});

soundBtn.addEventListener('click', () => {
    game.soundEnabled = !game.soundEnabled;
    soundBtn.innerHTML = game.soundEnabled ?
        '<i class="fas fa-volume-up"></i> Sound On' :
        '<i class="fas fa-volume-mute"></i> Sound Off';
});

difficultySelect.addEventListener('change', () => {
    game.difficulty = difficultySelect.value;
});

playAgainBtn.addEventListener('click', () => {
    init();
    startGame();
});

// Initialize game on load
window.addEventListener('load', init);

// Make some functions global for debugging
window.game = game;
window.player = player;
window.enemies = enemies;