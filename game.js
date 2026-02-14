// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let gameState = {
    score: 0,
    balls: 0,
    outs: 0,
    maxOuts: 3,
    running: false,
    ballInMotion: false,
    fours: 0,
    sixes: 0,
    ones: 0,
    twos: 0,
    dots: 0
};

let ball = {
    x: 0,
    y: 0,
    speed: 3,
    size: 15,
    moving: false
};

let bat = {
    x: 300,
    y: 350,
    width: 80,
    height: 15,
    swinging: false,
    swingFrame: 0
};

let zones = {
    perfect: { start: 280, end: 340, color: '#4caf50', runs: [4, 6] },
    good: { start: 220, end: 380, color: '#ffc107', runs: [1, 2] },
    miss: { color: '#f44336' }
};

// Initialize game
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('playScreen').classList.remove('hidden');
    
    resetGameState();
    gameState.running = true;
    
    // Wait a moment then bowl first ball
    setTimeout(bowlBall, 1000);
}

function resetGameState() {
    gameState.score = 0;
    gameState.balls = 0;
    gameState.outs = 0;
    gameState.fours = 0;
    gameState.sixes = 0;
    gameState.ones = 0;
    gameState.twos = 0;
    gameState.dots = 0;
    
    updateScoreboard();
}

function bowlBall() {
    if (!gameState.running) return;
    
    ball.x = 300;
    ball.y = 50;
    ball.moving = true;
    ball.speed = 3 + (gameState.balls * 0.1); // Ball gets faster
    gameState.ballInMotion = true;
    
    document.getElementById('message').textContent = '';
    
    gameLoop();
}

function gameLoop() {
    if (!gameState.running || !ball.moving) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pitch
    drawPitch();
    
    // Draw zones
    drawZones();
    
    // Move ball
    ball.y += ball.speed;
    
    // Draw ball
    drawBall();
    
    // Draw bat
    drawBat();
    
    // Check if ball passed bat
    if (ball.y > bat.y + 50) {
        if (!bat.swinging) {
            ballMissed();
            return;
        }
    }
    
    // Continue loop
    if (ball.moving) {
        requestAnimationFrame(gameLoop);
    }
}

function drawPitch() {
    // Pitch
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(250, 0, 100, 400);
    
    // Crease lines
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(220, bat.y);
    ctx.lineTo(380, bat.y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(220, 50);
    ctx.lineTo(380, 50);
    ctx.stroke();
}

function drawZones() {
    // Perfect zone
    ctx.fillStyle = zones.perfect.color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(zones.perfect.start, bat.y - 60, zones.perfect.end - zones.perfect.start, 60);
    
    // Good zone
    ctx.fillStyle = zones.good.color;
    ctx.fillRect(zones.good.start, bat.y - 60, zones.good.end - zones.good.start, 60);
    
    ctx.globalAlpha = 1;
}

function drawBall() {
    ctx.fillStyle = '#dc143c';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Ball shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(ball.x - 5, ball.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();
}

function drawBat() {
    if (bat.swinging && bat.swingFrame < 10) {
        bat.swingFrame++;
        bat.x = 300 + Math.sin(bat.swingFrame * 0.5) * 30;
    }
    
    // Bat
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(bat.x - bat.width / 2, bat.y, bat.width, bat.height);
    
    // Bat handle
    ctx.fillStyle = '#654321';
    ctx.fillRect(bat.x - 5, bat.y - 30, 10, 35);
    
    // Grip
    ctx.fillStyle = '#000';
    ctx.fillRect(bat.x - 6, bat.y - 25, 12, 5);
    ctx.fillRect(bat.x - 6, bat.y - 15, 12, 5);
}

function swing() {
    if (!gameState.ballInMotion || bat.swinging) return;
    
    bat.swinging = true;
    bat.swingFrame = 0;
    
    // Check if ball is in hitting range
    const ballInRange = ball.y >= bat.y - 70 && ball.y <= bat.y;
    
    if (ballInRange) {
        checkHit();
    } else {
        // Swung too early or too late
        setTimeout(() => {
            if (ball.moving) {
                ballMissed();
            }
        }, 200);
    }
}

function checkHit() {
    const ballInPerfectZone = ball.y >= bat.y - 60 && ball.y <= bat.y - 20 &&
                               ball.x >= zones.perfect.start && ball.x <= zones.perfect.end;
    const ballInGoodZone = ball.y >= bat.y - 60 && ball.y <= bat.y - 20 &&
                           ball.x >= zones.good.start && ball.x <= zones.good.end;
    
    ball.moving = false;
    gameState.ballInMotion = false;
    
    let runs = 0;
    let message = '';
    
    if (ballInPerfectZone) {
        // Perfect shot!
        runs = zones.perfect.runs[Math.floor(Math.random() * zones.perfect.runs.length)];
        message = runs === 6 ? '🎉 SIX! What a shot!' : '🔥 FOUR! Boundary!';
        
        if (runs === 6) gameState.sixes++;
        else gameState.fours++;
        
    } else if (ballInGoodZone) {
        // Good shot
        runs = zones.good.runs[Math.floor(Math.random() * zones.good.runs.length)];
        message = runs === 2 ? '👍 Two runs!' : '✓ Single run';
        
        if (runs === 2) gameState.twos++;
        else gameState.ones++;
        
    } else {
        // Missed
        ballMissed();
        return;
    }
    
    gameState.score += runs;
    gameState.balls++;
    
    updateScoreboard();
    showMessage(message, runs >= 4 ? '#4caf50' : '#ffc107');
    
    setTimeout(() => {
        bat.swinging = false;
        bat.x = 300;
        bowlBall();
    }, 2000);
}

function ballMissed() {
    ball.moving = false;
    gameState.ballInMotion = false;
    gameState.balls++;
    gameState.outs++;
    gameState.dots++;
    
    updateScoreboard();
    showMessage('❌ OUT! You missed it!', '#f44336');
    
    if (gameState.outs >= gameState.maxOuts) {
        setTimeout(endGame, 2000);
    } else {
        setTimeout(() => {
            bat.swinging = false;
            bat.x = 300;
            bowlBall();
        }, 2000);
    }
}

function showMessage(text, color) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.style.color = color;
}

function updateScoreboard() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('balls').textContent = gameState.balls;
    document.getElementById('outs').textContent = `${gameState.outs}/${gameState.maxOuts}`;
}

function endGame() {
    gameState.running = false;
    
    document.getElementById('playScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalBalls').textContent = `Balls Faced: ${gameState.balls}`;
    
    const strikeRate = gameState.balls > 0 ? ((gameState.score / gameState.balls) * 100).toFixed(2) : 0;
    
    const statsHTML = `
        <p>⚡ Strike Rate: ${strikeRate}</p>
        <p>🏏 Sixes: ${gameState.sixes}</p>
        <p>🎯 Fours: ${gameState.fours}</p>
        <p>🏃 Twos: ${gameState.twos}</p>
        <p>👟 Singles: ${gameState.ones}</p>
        <p>⭕ Dots: ${gameState.dots}</p>
    `;
    
    document.getElementById('stats').innerHTML = statsHTML;
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('playScreen').classList.remove('hidden');
    
    resetGameState();
    gameState.running = true;
    
    setTimeout(bowlBall, 1000);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState.running) {
        e.preventDefault();
        swing();
    }
});
