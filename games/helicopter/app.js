// Game Configuration
const gameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: 'gameCanvas'
};

// Game Variables
let game = null;
let helicopter;
let obstacles;
let particles;
let score = 0;
let highScore = 0;
let gameStarted = false;
let gameOver = false;
let gamePaused = false;
let autoSolveMode = false;
let hintsEnabled = false;
let soundEnabled = true;
let musicEnabled = true;
let obstacleTimer = 0;
let difficultyLevel = 1;
let helicopterThrustSound, explosionSound, scoreSound, clickSound;
let gameScene;

// Game Settings
const HELICOPTER_SPEED = 200;
const OBSTACLE_SPEED = 150;
const GRAVITY = 300;
const JUMP_FORCE = -350;
const OBSTACLE_GAP = 150;
const OBSTACLE_SPAWN_RATE = 2000; // milliseconds

// UI Elements
const elements = {};

// Initialize Game
window.addEventListener('load', () => {
    initializeElements();
    loadHighScore();
    initializeUI();
    hideLoading();
    showMainMenu(); // Ensure we start at main menu
});

function initializeElements() {
    elements.loading = document.getElementById('loading');
    elements.mainMenu = document.getElementById('mainMenu');
    elements.gameContainer = document.getElementById('gameContainer');
    elements.pauseMenu = document.getElementById('pauseMenu');
    elements.gameOverScreen = document.getElementById('gameOverScreen');
    elements.instructionsModal = document.getElementById('instructionsModal');
    elements.settingsModal = document.getElementById('settingsModal');
    elements.statusMessage = document.getElementById('statusMessage');
    elements.touchArea = document.getElementById('touchArea');
    elements.currentScore = document.getElementById('currentScore');
    elements.finalScore = document.getElementById('finalScore');
    elements.bestScore = document.getElementById('bestScore');
    elements.highScoreDisplay = document.getElementById('highScoreDisplay');
    elements.newRecord = document.getElementById('newRecord');
}

function hideLoading() {
    if (elements.loading) {
        elements.loading.style.display = 'none';
    }
}

function showMainMenu() {
    // Hide all screens first
    hideAllScreens();
    
    // Show main menu
    if (elements.mainMenu) {
        elements.mainMenu.classList.remove('hidden');
        elements.mainMenu.style.display = 'flex';
    }
}

function hideAllScreens() {
    const screens = [
        elements.gameContainer,
        elements.gameOverScreen,
        elements.pauseMenu,
        elements.instructionsModal,
        elements.settingsModal
    ];
    
    screens.forEach(screen => {
        if (screen) {
            screen.classList.add('hidden');
            screen.style.display = 'none';
        }
    });
}

function loadHighScore() {
    try {
        highScore = parseInt(localStorage.getItem('helicopterHighScore')) || 0;
        if (elements.highScoreDisplay) {
            elements.highScoreDisplay.textContent = highScore;
        }
    } catch (e) {
        highScore = 0;
    }
}

function saveHighScore() {
    try {
        localStorage.setItem('helicopterHighScore', highScore.toString());
    } catch (e) {
        console.log('Unable to save high score');
    }
}

function initializeUI() {
    // Start Game Button
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            playClickSound();
            startGame();
        });
    }

    // Instructions
    const instructionsBtn = document.getElementById('instructionsBtn');
    const closeInstructions = document.getElementById('closeInstructions');
    
    if (instructionsBtn) {
        instructionsBtn.addEventListener('click', () => {
            playClickSound();
            if (elements.instructionsModal) {
                elements.instructionsModal.classList.remove('hidden');
                elements.instructionsModal.style.display = 'flex';
            }
        });
    }

    if (closeInstructions) {
        closeInstructions.addEventListener('click', () => {
            playClickSound();
            if (elements.instructionsModal) {
                elements.instructionsModal.classList.add('hidden');
                elements.instructionsModal.style.display = 'none';
            }
        });
    }

    // Settings
    const settingsBtn = document.getElementById('settingsBtn');
    const closeSettings = document.getElementById('closeSettings');
    
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            playClickSound();
            if (elements.settingsModal) {
                elements.settingsModal.classList.remove('hidden');
                elements.settingsModal.style.display = 'flex';
            }
        });
    }

    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            playClickSound();
            if (elements.settingsModal) {
                elements.settingsModal.classList.add('hidden');
                elements.settingsModal.style.display = 'none';
            }
        });
    }

    const soundToggle = document.getElementById('soundToggle');
    const musicToggle = document.getElementById('musicToggle');
    const resetHighScore = document.getElementById('resetHighScore');

    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            soundEnabled = e.target.checked;
        });
    }

    if (musicToggle) {
        musicToggle.addEventListener('change', (e) => {
            musicEnabled = e.target.checked;
        });
    }

    if (resetHighScore) {
        resetHighScore.addEventListener('click', () => {
            playClickSound();
            highScore = 0;
            saveHighScore();
            if (elements.highScoreDisplay) {
                elements.highScoreDisplay.textContent = '0';
            }
            showStatusMessage('High score reset!');
        });
    }

    // Game Controls
    const pauseBtn = document.getElementById('pauseBtn');
    const autoSolveBtn = document.getElementById('autoSolveBtn');
    const hintsBtn = document.getElementById('hintsBtn');

    if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
    if (autoSolveBtn) autoSolveBtn.addEventListener('click', toggleAutoSolve);
    if (hintsBtn) hintsBtn.addEventListener('click', toggleHints);

    // Pause Menu
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    const mainMenuBtn = document.getElementById('mainMenuBtn');

    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            playClickSound();
            togglePause();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            playClickSound();
            restartGame();
        });
    }

    if (mainMenuBtn) {
        mainMenuBtn.addEventListener('click', () => {
            playClickSound();
            returnToMainMenu();
        });
    }

    // Game Over Screen
    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');

    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            playClickSound();
            restartGame();
        });
    }

    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => {
            playClickSound();
            returnToMainMenu();
        });
    }

    // Touch Controls
    let touchActive = false;

    if (elements.touchArea) {
        elements.touchArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameStarted || gameOver || gamePaused) return;
            touchActive = true;
            helicopterJump();
        });

        elements.touchArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            touchActive = false;
        });

        // Mouse Controls
        elements.touchArea.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (!gameStarted || gameOver || gamePaused) return;
            touchActive = true;
            helicopterJump();
        });

        elements.touchArea.addEventListener('mouseup', (e) => {
            e.preventDefault();
            touchActive = false;
        });
    }

    // Keyboard Controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && gameStarted && !gameOver && !gamePaused) {
            e.preventDefault();
            helicopterJump();
        }
        if (e.code === 'Escape') {
            e.preventDefault();
            if (gameStarted && !gameOver) {
                togglePause();
            }
        }
    });

    // Close modals on backdrop click
    if (elements.instructionsModal) {
        elements.instructionsModal.addEventListener('click', (e) => {
            if (e.target === elements.instructionsModal) {
                elements.instructionsModal.classList.add('hidden');
                elements.instructionsModal.style.display = 'none';
            }
        });
    }

    if (elements.settingsModal) {
        elements.settingsModal.addEventListener('click', (e) => {
            if (e.target === elements.settingsModal) {
                elements.settingsModal.classList.add('hidden');
                elements.settingsModal.style.display = 'none';
            }
        });
    }
}

function startGame() {
    hideAllScreens();
    
    if (elements.gameContainer) {
        elements.gameContainer.classList.remove('hidden');
        elements.gameContainer.style.display = 'block';
    }
    
    // Reset game state
    resetGameState();
    
    if (!game) {
        game = new Phaser.Game(gameConfig);
    } else {
        game.scene.restart();
    }
    
    gameStarted = true;
    gameOver = false;
    gamePaused = false;
}

function preload() {
    gameScene = this;
    
    // Create simple colored rectangles as sprites
    this.add.graphics()
        .fillStyle(0x4CAF50)
        .fillRect(0, 0, 60, 30)
        .generateTexture('helicopter', 60, 30);
    
    this.add.graphics()
        .fillStyle(0x8BC34A)
        .fillRect(0, 0, 40, 15)
        .generateTexture('rotor', 40, 15);
    
    this.add.graphics()
        .fillStyle(0xFF5722)
        .fillRect(0, 0, 50, 200)
        .generateTexture('pipe', 50, 200);
    
    this.add.graphics()
        .fillStyle(0x607D8B)
        .fillRect(0, 0, 80, 150)
        .generateTexture('building', 80, 150);
    
    this.add.graphics()
        .fillStyle(0xFFEB3B)
        .fillRect(0, 0, 4, 4)
        .generateTexture('particle', 4, 4);
        
    this.add.graphics()
        .fillStyle(0x00BCD4)
        .fillRect(0, 0, 30, 30)
        .generateTexture('shield', 30, 30);
}

function create() {
    gameScene = this;
    
    // Create background gradient effect
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x6a11cb, 0x6a11cb, 0xffffff, 0xffffff);
    gradient.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Create groups
    obstacles = this.physics.add.group();
    particles = this.add.group();

    // Create helicopter
    helicopter = this.physics.add.sprite(100, this.cameras.main.height / 2, 'helicopter');
    helicopter.setCollideWorldBounds(true);
    helicopter.setBounce(0.2);
    helicopter.body.setSize(50, 25);

    // Create rotor animation
    const rotor = this.add.sprite(helicopter.x, helicopter.y - 8, 'rotor');
    rotor.setOrigin(0.5, 0.5);
    
    this.tweens.add({
        targets: rotor,
        angle: 360,
        duration: 100,
        repeat: -1
    });

    // Update rotor position with helicopter
    this.time.addEvent({
        delay: 16,
        callback: () => {
            if (helicopter && rotor) {
                rotor.x = helicopter.x;
                rotor.y = helicopter.y - 8;
            }
        },
        loop: true
    });

    // Collision detection
    this.physics.add.overlap(helicopter, obstacles, handleCollision, null, this);

    // Obstacle spawning timer
    this.time.addEvent({
        delay: OBSTACLE_SPAWN_RATE,
        callback: spawnObstacle,
        callbackScope: this,
        loop: true
    });

    // Particle emitter for helicopter thrust
    const thrustParticles = this.add.particles(0, 0, 'particle', {
        speed: { min: 50, max: 100 },
        scale: { start: 0.5, end: 0 },
        lifespan: 300,
        alpha: { start: 0.8, end: 0 },
        tint: 0xFFEB3B
    });

    thrustParticles.startFollow(helicopter, -30, 10);

    // Create simple audio placeholders
    createAudioSystem.call(this);
}

function createAudioSystem() {
    // Simple beep sounds using Web Audio API
    helicopterThrustSound = {
        play: () => {
            if (soundEnabled) playBeep(220, 100);
        }
    };
    
    explosionSound = {
        play: () => {
            if (soundEnabled) playBeep(150, 300);
        }
    };
    
    scoreSound = {
        play: () => {
            if (soundEnabled) playBeep(440, 200);
        }
    };
}

function playBeep(frequency, duration) {
    if (!soundEnabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        // Audio not available
    }
}

function playClickSound() {
    if (soundEnabled) playBeep(800, 100);
}

function update(time, delta) {
    if (!gameStarted || gameOver || gamePaused) return;

    // Auto-solve mode
    if (autoSolveMode) {
        autoSolveControl();
    }

    // Update obstacle movement and cleanup
    obstacles.children.entries.forEach(obstacle => {
        if (obstacle.x < -obstacle.width) {
            if (!obstacle.scored) {
                score++;
                if (elements.currentScore) {
                    elements.currentScore.textContent = score;
                }
                scoreSound.play();
                obstacle.scored = true;
                
                // Increase difficulty
                if (score % 5 === 0) {
                    increaseDifficulty();
                }
            }
            obstacle.destroy();
        }
    });

    // Show hints
    if (hintsEnabled) {
        showTrajectoryHints();
    }

    // Keep helicopter in bounds
    if (helicopter.y < 0) {
        helicopter.y = 0;
        helicopter.body.setVelocityY(0);
    }
    
    if (helicopter.y > gameScene.cameras.main.height - helicopter.height) {
        handleCollision();
    }
}

function helicopterJump() {
    if (helicopter && gameStarted && !gameOver && !gamePaused) {
        helicopter.body.setVelocityY(JUMP_FORCE);
        helicopterThrustSound.play();
    }
}

function spawnObstacle() {
    if (!gameStarted || gameOver || gamePaused || !gameScene) return;

    const height = gameScene.cameras.main.height;
    const width = gameScene.cameras.main.width;
    const gapSize = OBSTACLE_GAP + (difficultyLevel > 3 ? -20 : 0);
    const gapPosition = Phaser.Math.Between(100, height - gapSize - 100);
    
    // Top obstacle
    const topObstacle = obstacles.create(width + 25, gapPosition - 100, 'pipe');
    topObstacle.body.setVelocityX(-OBSTACLE_SPEED - (difficultyLevel * 10));
    topObstacle.setOrigin(0.5, 1);
    topObstacle.scored = false;
    
    // Bottom obstacle
    const bottomObstacle = obstacles.create(width + 25, gapPosition + gapSize + 100, 'pipe');
    bottomObstacle.body.setVelocityX(-OBSTACLE_SPEED - (difficultyLevel * 10));
    bottomObstacle.setOrigin(0.5, 0);
    bottomObstacle.scored = false;
}

function handleCollision() {
    if (gameOver) return;
    
    gameOver = true;
    gameStarted = false;
    explosionSound.play();
    
    // Create explosion effect
    createExplosion();
    
    // Check for high score
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        if (elements.highScoreDisplay) {
            elements.highScoreDisplay.textContent = highScore;
        }
        if (elements.newRecord) {
            elements.newRecord.classList.remove('hidden');
        }
    } else {
        if (elements.newRecord) {
            elements.newRecord.classList.add('hidden');
        }
    }
    
    // Show game over screen
    if (elements.finalScore) {
        elements.finalScore.textContent = score;
    }
    if (elements.bestScore) {
        elements.bestScore.textContent = highScore;
    }
    
    setTimeout(() => {
        if (elements.gameOverScreen) {
            elements.gameOverScreen.classList.remove('hidden');
            elements.gameOverScreen.style.display = 'flex';
        }
    }, 1000);
}

function createExplosion() {
    if (!gameScene || !helicopter) return;
    
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
        const particle = gameScene.add.sprite(helicopter.x, helicopter.y, 'particle');
        particle.setTint(Phaser.Math.Between(0xFF0000, 0xFFFF00));
        
        gameScene.tweens.add({
            targets: particle,
            x: helicopter.x + Phaser.Math.Between(-100, 100),
            y: helicopter.y + Phaser.Math.Between(-100, 100),
            alpha: 0,
            duration: 500,
            onComplete: () => particle.destroy()
        });
    }
}

function increaseDifficulty() {
    difficultyLevel++;
    showStatusMessage(`Level ${difficultyLevel}! Difficulty increased!`);
}

function autoSolveControl() {
    if (!helicopter || gameOver || !gameScene) return;
    
    // Simple AI: find nearest obstacle and navigate around it
    let nearestObstacle = null;
    let minDistance = Infinity;
    
    obstacles.children.entries.forEach(obstacle => {
        const distance = obstacle.x - helicopter.x;
        if (distance > 0 && distance < minDistance) {
            minDistance = distance;
            nearestObstacle = obstacle;
        }
    });
    
    if (nearestObstacle && minDistance < 200) {
        // Calculate safe position
        const obstacleTop = nearestObstacle.y;
        const obstacleBottom = obstacleTop + OBSTACLE_GAP;
        const safeY = (obstacleTop + obstacleBottom) / 2;
        
        if (helicopter.y > safeY + 20) {
            helicopter.body.setVelocityY(JUMP_FORCE * 0.7);
        }
    }
}

function showTrajectoryHints() {
    if (!gameScene) return;
    
    // Visual hint showing safe trajectory (simplified)
    obstacles.children.entries.forEach(obstacle => {
        const distance = obstacle.x - helicopter.x;
        if (distance > 50 && distance < 150) {
            // Highlight safe zone
            const graphics = gameScene.add.graphics();
            graphics.fillStyle(0x00FF00, 0.3);
            
            const safeTop = obstacle.y;
            const safeBottom = safeTop + OBSTACLE_GAP;
            graphics.fillRect(obstacle.x - 25, safeTop, 50, OBSTACLE_GAP);
            
            gameScene.time.delayedCall(100, () => {
                if (graphics && graphics.scene) {
                    graphics.destroy();
                }
            });
        }
    });
}

function togglePause() {
    playClickSound();
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        if (gameScene && gameScene.scene) {
            gameScene.scene.pause();
        }
        if (elements.pauseMenu) {
            elements.pauseMenu.classList.remove('hidden');
            elements.pauseMenu.style.display = 'flex';
        }
    } else {
        if (gameScene && gameScene.scene) {
            gameScene.scene.resume();
        }
        if (elements.pauseMenu) {
            elements.pauseMenu.classList.add('hidden');
            elements.pauseMenu.style.display = 'none';
        }
    }
}

function toggleAutoSolve() {
    playClickSound();
    autoSolveMode = !autoSolveMode;
    const btn = document.getElementById('autoSolveBtn');
    
    if (autoSolveMode) {
        if (btn) btn.style.background = '#4CAF50';
        showStatusMessage('Auto-solve enabled');
    } else {
        if (btn) btn.style.background = 'rgba(255, 255, 255, 0.2)';
        showStatusMessage('Auto-solve disabled');
    }
}

function toggleHints() {
    playClickSound();
    hintsEnabled = !hintsEnabled;
    const btn = document.getElementById('hintsBtn');
    
    if (hintsEnabled) {
        if (btn) btn.style.background = '#FF9800';
        showStatusMessage('Hints enabled');
    } else {
        if (btn) btn.style.background = 'rgba(255, 255, 255, 0.2)';
        showStatusMessage('Hints disabled');
    }
}

function restartGame() {
    hideAllScreens();
    
    if (elements.gameContainer) {
        elements.gameContainer.classList.remove('hidden');
        elements.gameContainer.style.display = 'block';
    }
    
    // Reset game state before restarting
    score = 0;
    gameStarted = true;
    gameOver = false;
    gamePaused = false;
    difficultyLevel = 1;
    
    if (elements.currentScore) {
        elements.currentScore.textContent = '0';
    }
    
    // Reset button states
    const autoSolveBtn = document.getElementById('autoSolveBtn');
    const hintsBtn = document.getElementById('hintsBtn');
    
    if (autoSolveBtn) autoSolveBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    if (hintsBtn) hintsBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    
    autoSolveMode = false;
    hintsEnabled = false;
    
    if (game && gameScene && gameScene.scene) {
        gameScene.scene.restart();
    }
}

function returnToMainMenu() {
    resetGameState();
    hideAllScreens();
    showMainMenu();
    
    if (game) {
        game.destroy(true);
        game = null;
        gameScene = null;
    }
}

function resetGameState() {
    score = 0;
    gameStarted = false;
    gameOver = false;
    gamePaused = false;
    autoSolveMode = false;
    hintsEnabled = false;
    difficultyLevel = 1;
    
    if (elements.currentScore) {
        elements.currentScore.textContent = '0';
    }
    
    // Reset button states
    const autoSolveBtn = document.getElementById('autoSolveBtn');
    const hintsBtn = document.getElementById('hintsBtn');
    
    if (autoSolveBtn) autoSolveBtn.style.background = 'rgba(255, 255, 255, 0.2)';
    if (hintsBtn) hintsBtn.style.background = 'rgba(255, 255, 255, 0.2)';
}

function showStatusMessage(message) {
    if (elements.statusMessage) {
        elements.statusMessage.textContent = message;
        elements.statusMessage.classList.remove('hidden');
        
        setTimeout(() => {
            elements.statusMessage.classList.add('hidden');
        }, 2000);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (game && game.scale) {
        game.scale.resize(window.innerWidth, window.innerHeight);
    }
});