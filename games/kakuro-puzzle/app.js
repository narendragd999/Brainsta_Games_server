// Kakuro Game - Main Application
class KakuroGame {
    constructor() {
        this.currentScreen = 'splash-screen';
        this.currentPuzzle = null;
        this.currentDifficulty = 'easy';
        this.gameGrid = [];
        this.selectedCell = null;
        this.gameTimer = null;
        this.gameStartTime = null;
        this.score = 0;
        this.moves = [];
        this.settings = {
            sfxEnabled: true,
            musicEnabled: false,
            volume: 0.7
        };
        
        // Audio context for sound effects
        this.audioContext = null;
        this.sounds = {};
        
        this.init();
    }

    init() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupGame();
            });
        } else {
            this.setupGame();
        }
    }

    setupGame() {
        this.loadSettings();
        this.initEventListeners();
        this.initAudio();
        this.enableContinueButton();
        
        // Show splash screen for 2 seconds
        setTimeout(() => {
            this.showScreen('main-menu');
        }, 2000);
    }

    // Screen management
    showScreen(screenId) {
        console.log('Switching to screen:', screenId); // Debug log
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            this.playSound('button-click');
        } else {
            console.error('Screen not found:', screenId);
        }
    }

    // Event listeners
    initEventListeners() {
        console.log('Initializing event listeners...'); // Debug log
        
        // Main menu buttons
        const newGameBtn = document.getElementById('new-game-btn');
        const continueBtn = document.getElementById('continue-btn');
        const settingsBtn = document.getElementById('settings-btn');
        
        if (newGameBtn) {
            newGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('New Game clicked'); // Debug log
                this.showScreen('difficulty-screen');
            });
        }

        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Continue clicked'); // Debug log
                this.loadSavedGame();
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Settings clicked'); // Debug log
                this.showModal('settings-modal');
            });
        }

        // Difficulty selection
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Difficulty selected:', e.currentTarget.dataset.difficulty); // Debug log
                this.currentDifficulty = e.currentTarget.dataset.difficulty;
                this.startNewGame();
            });
        });

        const backToMenuBtn = document.getElementById('back-to-menu');
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('main-menu');
            });
        }

        // Game controls
        const hintBtn = document.getElementById('hint-btn');
        const undoBtn = document.getElementById('undo-btn');
        const pauseBtn = document.getElementById('pause-btn');
        const settingsGameBtn = document.getElementById('settings-game-btn');
        const newPuzzleBtn = document.getElementById('new-puzzle-btn');

        if (hintBtn) {
            hintBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showHint();
            });
        }

        if (undoBtn) {
            undoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.undoMove();
            });
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.pauseGame();
            });
        }

        if (settingsGameBtn) {
            settingsGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal('settings-modal');
            });
        }

        if (newPuzzleBtn) {
            newPuzzleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startNewGame();
            });
        }

        // Number picker
        document.querySelectorAll('.number-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectNumber(parseInt(e.currentTarget.dataset.number));
            });
        });

        const clearCellBtn = document.getElementById('clear-cell');
        const closePickerBtn = document.getElementById('close-picker');

        if (clearCellBtn) {
            clearCellBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearSelectedCell();
            });
        }

        if (closePickerBtn) {
            closePickerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('number-picker');
            });
        }

        // Settings modal
        const sfxToggle = document.getElementById('sfx-toggle');
        const musicToggle = document.getElementById('music-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        const resetGameBtn = document.getElementById('reset-game');
        const closeSettingsBtn = document.getElementById('close-settings');

        if (sfxToggle) {
            sfxToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSetting('sfxEnabled');
            });
        }

        if (musicToggle) {
            musicToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSetting('musicEnabled');
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = e.target.value / 100;
                this.saveSettings();
            });
        }

        if (resetGameBtn) {
            resetGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.resetGame();
            });
        }

        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('settings-modal');
            });
        }

        // Victory modal
        const playAgainBtn = document.getElementById('play-again');
        const backToMenuVictoryBtn = document.getElementById('back-to-menu-victory');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('victory-modal');
                this.startNewGame();
            });
        }

        if (backToMenuVictoryBtn) {
            backToMenuVictoryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideModal('victory-modal');
                this.showScreen('main-menu');
            });
        }

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        console.log('Event listeners initialized successfully'); // Debug log
    }

    // Audio system
    async initAudio() {
        try {
            // Initialize audio context on first user interaction
            document.addEventListener('click', () => {
                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
            }, { once: true });
        } catch (error) {
            console.log('Audio not available:', error);
        }
    }

    playSound(type) {
        if (!this.settings.sfxEnabled) return;
        
        try {
            // Create audio context if not exists
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            const frequencies = {
                'button-click': 800,
                'number-input': 600,
                'cell-select': 400,
                'success': 800,
                'error': 200,
                'victory': 1000
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.settings.volume * 0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }

    // Game logic
    startNewGame() {
        console.log('Starting new game with difficulty:', this.currentDifficulty); // Debug log
        this.showLoadingOverlay();
        
        setTimeout(() => {
            const puzzles = this.getPuzzleData();
            const difficultyPuzzles = puzzles[this.currentDifficulty];
            
            if (difficultyPuzzles && difficultyPuzzles.length > 0) {
                this.currentPuzzle = difficultyPuzzles[0]; // For now, use first puzzle
                this.initializeGame();
                this.showScreen('game-screen');
                this.startTimer();
            }
            
            this.hideLoadingOverlay();
        }, 1000);
    }

    getPuzzleData() {
        return {
            "easy": [
                {
                    "id": 1,
                    "size": 6,
                    "grid": [
                        [{"type": "black"}, {"type": "clue", "down": 9}, {"type": "clue", "down": 16}, {"type": "black"}, {"type": "clue", "down": 7}, {"type": "black"}],
                        [{"type": "clue", "right": 16}, {"type": "input", "value": 0, "answer": 9}, {"type": "input", "value": 0, "answer": 7}, {"type": "clue", "right": 3}, {"type": "input", "value": 0, "answer": 1}, {"type": "input", "value": 0, "answer": 2}],
                        [{"type": "clue", "right": 7}, {"type": "input", "value": 0, "answer": 2}, {"type": "input", "value": 0, "answer": 5}, {"type": "black"}, {"type": "input", "value": 0, "answer": 6}, {"type": "black"}],
                        [{"type": "black"}, {"type": "black"}, {"type": "clue", "right": 4}, {"type": "input", "value": 0, "answer": 3}, {"type": "input", "value": 0, "answer": 1}, {"type": "black"}],
                        [{"type": "clue", "right": 6}, {"type": "input", "value": 0, "answer": 4}, {"type": "input", "value": 0, "answer": 2}, {"type": "black"}, {"type": "black"}, {"type": "black"}],
                        [{"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}]
                    ]
                }
            ],
            "medium": [
                {
                    "id": 2,
                    "size": 8,
                    "grid": [
                        [{"type": "black"}, {"type": "clue", "down": 23}, {"type": "clue", "down": 16}, {"type": "black"}, {"type": "clue", "down": 14}, {"type": "clue", "down": 12}, {"type": "black"}, {"type": "black"}],
                        [{"type": "clue", "right": 30}, {"type": "input", "value": 0, "answer": 9}, {"type": "input", "value": 0, "answer": 8}, {"type": "input", "value": 0, "answer": 7}, {"type": "input", "value": 0, "answer": 6}, {"type": "black"}, {"type": "clue", "right": 6}, {"type": "input", "value": 0, "answer": 4}],
                        [{"type": "clue", "right": 17}, {"type": "input", "value": 0, "answer": 8}, {"type": "input", "value": 0, "answer": 9}, {"type": "black"}, {"type": "input", "value": 0, "answer": 5}, {"type": "input", "value": 0, "answer": 7}, {"type": "black"}, {"type": "input", "value": 0, "answer": 2}],
                        [{"type": "black"}, {"type": "input", "value": 0, "answer": 6}, {"type": "black"}, {"type": "clue", "right": 21}, {"type": "input", "value": 0, "answer": 3}, {"type": "input", "value": 0, "answer": 5}, {"type": "input", "value": 0, "answer": 8}, {"type": "black"}],
                        [{"type": "clue", "right": 12}, {"type": "input", "value": 0, "answer": 3}, {"type": "input", "value": 0, "answer": 9}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "input", "value": 0, "answer": 4}, {"type": "black"}],
                        [{"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}, {"type": "black"}]
                    ]
                }
            ]
        };
    }

    initializeGame() {
        this.gameGrid = JSON.parse(JSON.stringify(this.currentPuzzle.grid)); // Deep clone
        this.score = 0;
        this.moves = [];
        this.selectedCell = null;
        
        this.renderGrid();
        this.updateScore(0);
        this.enableContinueButton();
    }

    renderGrid() {
        const gridContainer = document.getElementById('game-grid');
        if (!gridContainer) {
            console.error('Game grid container not found');
            return;
        }
        
        gridContainer.innerHTML = '';
        gridContainer.className = `game-grid grid-${this.currentPuzzle.size}x${this.currentPuzzle.size}`;
        
        this.gameGrid.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                const cellElement = this.createCellElement(cell, rowIndex, colIndex);
                gridContainer.appendChild(cellElement);
            });
        });
    }

    createCellElement(cell, row, col) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.dataset.row = row;
        cellDiv.dataset.col = col;
        
        switch (cell.type) {
            case 'black':
                cellDiv.classList.add('cell-black');
                break;
                
            case 'input':
                cellDiv.classList.add('cell-input');
                cellDiv.textContent = cell.value > 0 ? cell.value : '';
                cellDiv.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.selectCell(row, col);
                });
                this.updateCellValidation(cellDiv, cell, row, col);
                break;
                
            case 'clue':
                cellDiv.classList.add('cell-clue');
                if (cell.down) {
                    const downClue = document.createElement('div');
                    downClue.className = 'clue-down';
                    downClue.textContent = cell.down;
                    cellDiv.appendChild(downClue);
                }
                if (cell.right) {
                    const rightClue = document.createElement('div');
                    rightClue.className = 'clue-right';
                    rightClue.textContent = cell.right;
                    cellDiv.appendChild(rightClue);
                }
                if (cell.down && cell.right) {
                    const diagonal = document.createElement('div');
                    diagonal.className = 'clue-diagonal';
                    cellDiv.appendChild(diagonal);
                }
                break;
        }
        
        return cellDiv;
    }

    selectCell(row, col) {
        const cell = this.gameGrid[row][col];
        if (cell.type !== 'input') return;
        
        this.playSound('cell-select');
        
        // Clear previous selection
        document.querySelectorAll('.cell-input.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select new cell
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
        }
        
        this.selectedCell = { row, col };
        this.showModal('number-picker');
    }

    selectNumber(number) {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        const cell = this.gameGrid[row][col];
        
        // Save move for undo
        this.moves.push({
            row,
            col,
            previousValue: cell.value,
            newValue: number
        });
        
        // Update cell value
        cell.value = number;
        
        // Update display
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.textContent = number;
        }
        
        this.playSound('number-input');
        this.updateCellValidation(cellElement, cell, row, col);
        this.updateScore(10);
        this.saveGameState();
        this.hideModal('number-picker');
        
        // Check for victory
        if (this.checkVictory()) {
            setTimeout(() => this.showVictory(), 500);
        }
    }

    clearSelectedCell() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        const cell = this.gameGrid[row][col];
        
        if (cell.value > 0) {
            this.moves.push({
                row,
                col,
                previousValue: cell.value,
                newValue: 0
            });
            
            cell.value = 0;
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cellElement) {
                cellElement.textContent = '';
            }
            this.updateCellValidation(cellElement, cell, row, col);
            this.saveGameState();
        }
        
        this.hideModal('number-picker');
    }

    updateCellValidation(cellElement, cell, row, col) {
        if (!cellElement) return;
        
        cellElement.classList.remove('correct', 'error', 'warning');
        
        if (cell.value === 0) return;
        
        const isCorrect = cell.value === cell.answer;
        const hasConflict = this.checkConflicts(row, col);
        
        if (isCorrect && !hasConflict) {
            cellElement.classList.add('correct');
        } else if (!isCorrect || hasConflict) {
            cellElement.classList.add('error');
            this.playSound('error');
        }
    }

    checkConflicts(row, col) {
        const cell = this.gameGrid[row][col];
        if (cell.value === 0) return false;
        
        // Check row conflicts
        const rowConflict = this.gameGrid[row].some((c, index) => 
            index !== col && c.type === 'input' && c.value === cell.value && c.value > 0
        );
        
        // Check column conflicts
        const colConflict = this.gameGrid.some((r, index) => 
            index !== row && r[col] && r[col].type === 'input' && r[col].value === cell.value && r[col].value > 0
        );
        
        return rowConflict || colConflict;
    }

    checkVictory() {
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input') {
                    if (cell.value !== cell.answer) return false;
                    if (this.checkConflicts(row, col)) return false;
                }
            }
        }
        return true;
    }

    showVictory() {
        this.stopTimer();
        this.playSound('victory');
        
        const finalTime = this.formatTime(this.getElapsedTime());
        const finalScore = this.score;
        
        const finalTimeEl = document.getElementById('final-time');
        const finalScoreEl = document.getElementById('final-score');
        
        if (finalTimeEl) finalTimeEl.textContent = finalTime;
        if (finalScoreEl) finalScoreEl.textContent = finalScore;
        
        this.showModal('victory-modal');
        this.createConfettiEffect();
    }

    createConfettiEffect() {
        const confetti = document.getElementById('confetti');
        if (!confetti) return;
        
        confetti.innerHTML = '';
        
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.style.position = 'absolute';
            piece.style.width = '6px';
            piece.style.height = '6px';
            piece.style.backgroundColor = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6'][Math.floor(Math.random() * 5)];
            piece.style.left = Math.random() * 100 + '%';
            piece.style.top = '-10px';
            piece.style.animation = `confettiFall ${2 + Math.random() * 3}s linear infinite`;
            piece.style.animationDelay = Math.random() * 2 + 's';
            confetti.appendChild(piece);
        }
    }

    undoMove() {
        if (this.moves.length === 0) return;
        
        const lastMove = this.moves.pop();
        const cell = this.gameGrid[lastMove.row][lastMove.col];
        cell.value = lastMove.previousValue;
        
        const cellElement = document.querySelector(`[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`);
        if (cellElement) {
            cellElement.textContent = cell.value > 0 ? cell.value : '';
        }
        
        this.updateCellValidation(cellElement, cell, lastMove.row, lastMove.col);
        this.playSound('button-click');
        this.saveGameState();
    }

    showHint() {
        // Find the first empty cell and show its answer
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value === 0) {
                    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cellElement) {
                        cellElement.style.background = '#fff3cd';
                        cellElement.style.borderColor = '#ffc107';
                        
                        setTimeout(() => {
                            cellElement.style.background = '';
                            cellElement.style.borderColor = '';
                        }, 2000);
                    }
                    
                    this.updateScore(-20); // Penalty for hint
                    this.playSound('success');
                    return;
                }
            }
        }
    }

    // Timer functions
    startTimer() {
        this.gameStartTime = Date.now();
        this.gameTimer = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    pauseGame() {
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.gameTimer) {
            this.stopTimer();
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        } else {
            this.startTimer();
            if (pauseBtn) {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
        }
        this.playSound('button-click');
    }

    updateTimer() {
        const elapsed = this.getElapsedTime();
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = this.formatTime(elapsed);
        }
    }

    getElapsedTime() {
        return this.gameStartTime ? Math.floor((Date.now() - this.gameStartTime) / 1000) : 0;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Score management
    updateScore(points) {
        this.score = Math.max(0, this.score + points);
        const scoreEl = document.getElementById('score');
        if (scoreEl) {
            scoreEl.textContent = this.score;
        }
    }

    // Modal management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            this.playSound('button-click');
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            this.playSound('button-click');
        }
    }

    // Loading overlay
    showLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // Settings management
    loadSettings() {
        try {
            const saved = localStorage.getItem('kakuro-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.log('Could not load settings');
        }
        this.updateSettingsUI();
    }

    saveSettings() {
        try {
            localStorage.setItem('kakuro-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.log('Could not save settings');
        }
        this.updateSettingsUI();
    }

    toggleSetting(setting) {
        this.settings[setting] = !this.settings[setting];
        this.saveSettings();
        this.playSound('button-click');
    }

    updateSettingsUI() {
        const sfxBtn = document.getElementById('sfx-toggle');
        const musicBtn = document.getElementById('music-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        
        if (sfxBtn) {
            sfxBtn.classList.toggle('inactive', !this.settings.sfxEnabled);
            sfxBtn.innerHTML = this.settings.sfxEnabled ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
        }
        
        if (musicBtn) {
            musicBtn.classList.toggle('inactive', !this.settings.musicEnabled);
            musicBtn.innerHTML = this.settings.musicEnabled ? '<i class="fas fa-music"></i>' : '<i class="fas fa-music"></i>';
        }
        
        if (volumeSlider) {
            volumeSlider.value = this.settings.volume * 100;
        }
    }

    // Game state management
    saveGameState() {
        try {
            const gameState = {
                currentPuzzle: this.currentPuzzle,
                gameGrid: this.gameGrid,
                score: this.score,
                startTime: this.gameStartTime,
                moves: this.moves,
                difficulty: this.currentDifficulty
            };
            localStorage.setItem('kakuro-game-state', JSON.stringify(gameState));
            this.enableContinueButton();
        } catch (error) {
            console.log('Could not save game state');
        }
    }

    loadSavedGame() {
        try {
            const saved = localStorage.getItem('kakuro-game-state');
            if (saved) {
                const gameState = JSON.parse(saved);
                this.currentPuzzle = gameState.currentPuzzle;
                this.gameGrid = gameState.gameGrid;
                this.score = gameState.score;
                this.gameStartTime = gameState.startTime;
                this.moves = gameState.moves || [];
                this.currentDifficulty = gameState.difficulty;
                
                this.renderGrid();
                this.updateScore(0); // Refresh display
                this.showScreen('game-screen');
                this.startTimer();
                
                return true;
            }
        } catch (error) {
            console.log('Could not load saved game');
        }
        return false;
    }

    enableContinueButton() {
        const continueBtn = document.getElementById('continue-btn');
        if (continueBtn) {
            const hasSavedGame = localStorage.getItem('kakuro-game-state');
            continueBtn.disabled = !hasSavedGame;
        }
    }

    resetGame() {
        try {
            localStorage.removeItem('kakuro-game-state');
        } catch (error) {
            console.log('Could not clear saved game');
        }
        
        this.stopTimer();
        this.hideModal('settings-modal');
        this.showScreen('main-menu');
        this.enableContinueButton();
        this.playSound('button-click');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Kakuro game...'); // Debug log
    window.kakuroGame = new KakuroGame();
});

// Handle visibility changes (pause when tab not active)
document.addEventListener('visibilitychange', () => {
    if (window.kakuroGame && document.hidden && window.kakuroGame.currentScreen === 'game-screen') {
        if (window.kakuroGame.gameTimer) {
            window.kakuroGame.pauseGame();
        }
    }
});

// Prevent zoom on double tap (iOS Safari)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle safe area for notched devices
if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
    document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
    document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
}