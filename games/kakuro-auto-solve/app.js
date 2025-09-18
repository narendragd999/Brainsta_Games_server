// Kakuro Game - Main Application with Auto-Solve Feature
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
            volume: 0.7,
            autoSolveHints: true
        };
        
        // Auto-solve properties
        this.isAutoSolving = false;
        this.autoSolveMode = 'instant';
        this.autoSolveSpeed = 1000; // milliseconds
        this.autoSolvePaused = false;
        this.autoSolveSteps = [];
        this.currentAutoSolveStep = 0;
        this.autoSolveStartTime = null;
        this.autoSolveTimer = null;
        this.totalCells = 0;
        this.solvedCells = 0;
        
        // Sum combinations for Kakuro solving
        this.sumCombinations = {
            "3": {"2": [[1,2]]},
            "4": {"2": [[1,3]]},
            "5": {"2": [[1,4], [2,3]]},
            "6": {"2": [[1,5], [2,4]], "3": [[1,2,3]]},
            "7": {"2": [[1,6], [2,5], [3,4]], "3": [[1,2,4]]},
            "8": {"2": [[1,7], [2,6], [3,5]], "3": [[1,2,5]]},
            "9": {"2": [[1,8], [2,7], [3,6], [4,5]], "3": [[1,2,6], [1,3,5], [2,3,4]]},
            "10": {"2": [[1,9], [2,8], [3,7], [4,6]], "3": [[1,2,7], [1,3,6], [1,4,5], [2,3,5]]},
            "11": {"2": [[2,9], [3,8], [4,7], [5,6]], "3": [[1,2,8], [1,3,7], [1,4,6], [2,3,6], [2,4,5]]},
            "12": {"2": [[3,9], [4,8], [5,7]], "3": [[1,2,9], [1,3,8], [1,4,7], [1,5,6], [2,3,7], [2,4,6], [3,4,5]]},
            "13": {"2": [[4,9], [5,8], [6,7]], "3": [[1,3,9], [1,4,8], [1,5,7], [2,3,8], [2,4,7], [2,5,6], [3,4,6]]},
            "14": {"2": [[5,9], [6,8]], "3": [[1,4,9], [1,5,8], [1,6,7], [2,3,9], [2,4,8], [2,5,7], [3,4,7], [3,5,6]]},
            "15": {"2": [[6,9], [7,8]], "3": [[1,5,9], [1,6,8], [2,4,9], [2,5,8], [2,6,7], [3,4,8], [3,5,7], [4,5,6]]},
            "16": {"2": [[7,9]], "3": [[1,6,9], [2,5,9], [2,6,8], [3,4,9], [3,5,8], [3,6,7], [4,5,7]]},
            "17": {"2": [[8,9]], "3": [[2,6,9], [3,5,9], [3,6,8], [4,5,8], [4,6,7]]},
            "18": {"3": [[3,6,9], [4,5,9], [4,6,8], [5,6,7]]},
            "19": {"3": [[4,6,9], [5,6,8]]},
            "20": {"3": [[5,6,9]]},
            "21": {"3": [[6,7,8]]},
            "22": {"3": [[7,6,9]]},
            "23": {"3": [[6,8,9]]},
            "24": {"3": [[7,8,9]]}
        };
        
        // Audio context for sound effects
        this.audioContext = null;
        this.sounds = {};
        
        this.init();
    }

    init() {
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
        this.initAudio();
        this.enableContinueButton();
        
        // Show splash screen for 2 seconds, then setup event listeners
        setTimeout(() => {
            this.initEventListeners();
            this.showScreen('main-menu');
        }, 2000);
    }

    // Screen management
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
            this.playSound('button-click');
        }
    }

    // Event listeners
    initEventListeners() {
        console.log('Initializing event listeners...');
        
        // Main menu buttons - using more specific selectors and multiple event types
        this.addClickHandler('new-game-btn', () => {
            console.log('New Game clicked');
            this.showScreen('difficulty-screen');
        });

        this.addClickHandler('continue-btn', () => {
            console.log('Continue clicked');
            this.loadSavedGame();
        });

        this.addClickHandler('settings-btn', () => {
            console.log('Settings clicked');
            this.showModal('settings-modal');
        });

        // Difficulty selection
        document.querySelectorAll('[data-difficulty]').forEach(btn => {
            this.addMultipleEventHandlers(btn, ['click', 'touchend'], (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Difficulty selected:', btn.dataset.difficulty);
                this.currentDifficulty = btn.dataset.difficulty;
                this.startNewGame();
            });
        });

        this.addClickHandler('back-to-menu', () => {
            this.showScreen('main-menu');
        });

        // Game controls
        this.addClickHandler('auto-solve-btn', () => {
            console.log('Auto-solve button clicked');
            this.showAutoSolveModal();
        });

        this.addClickHandler('hint-btn', () => {
            this.showHint();
        });

        this.addClickHandler('undo-btn', () => {
            this.undoMove();
        });

        this.addClickHandler('pause-btn', () => {
            this.pauseGame();
        });

        this.addClickHandler('settings-game-btn', () => {
            this.showModal('settings-modal');
        });

        this.addClickHandler('new-puzzle-btn', () => {
            this.startNewGame();
        });

        // Auto-solve modal controls
        this.initAutoSolveEventListeners();

        // Number picker
        document.querySelectorAll('.number-btn').forEach(btn => {
            this.addClickHandler(btn, () => {
                this.selectNumber(parseInt(btn.dataset.number));
            });
        });

        this.addClickHandler('clear-cell', () => {
            this.clearSelectedCell();
        });

        this.addClickHandler('close-picker', () => {
            this.hideModal('number-picker');
        });

        // Settings modal
        this.addClickHandler('sfx-toggle', () => {
            this.toggleSetting('sfxEnabled');
        });

        this.addClickHandler('music-toggle', () => {
            this.toggleSetting('musicEnabled');
        });

        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.settings.volume = e.target.value / 100;
                this.saveSettings();
            });
        }

        this.addClickHandler('autosolve-hints-toggle', () => {
            this.toggleSetting('autoSolveHints');
        });

        this.addClickHandler('reset-game', () => {
            this.resetGame();
        });

        this.addClickHandler('close-settings', () => {
            this.hideModal('settings-modal');
        });

        // Victory modal
        this.addClickHandler('play-again', () => {
            this.hideModal('victory-modal');
            this.startNewGame();
        });

        this.addClickHandler('back-to-menu-victory', () => {
            this.hideModal('victory-modal');
            this.showScreen('main-menu');
        });

        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        console.log('Event listeners initialized successfully');
    }

    // Helper method to add click handlers with better cross-device support
    addClickHandler(elementOrId, handler) {
        const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
        if (element) {
            this.addMultipleEventHandlers(element, ['click', 'touchend'], handler);
        }
    }

    addMultipleEventHandlers(element, events, handler) {
        events.forEach(eventType => {
            element.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                handler(e);
            }, { passive: false });
        });
    }

    initAutoSolveEventListeners() {
        // Mode selection buttons
        document.querySelectorAll('.btn-mode').forEach(btn => {
            this.addClickHandler(btn, () => {
                document.querySelectorAll('.btn-mode').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.autoSolveMode = btn.dataset.mode;
                
                const speedControl = document.getElementById('speed-control');
                if (this.autoSolveMode === 'step-by-step') {
                    speedControl.style.display = 'block';
                } else {
                    speedControl.style.display = 'none';
                }
                console.log('Auto-solve mode changed to:', this.autoSolveMode);
            });
        });

        // Speed slider
        const speedSlider = document.getElementById('solve-speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                const speeds = [2000, 1000, 500];
                this.autoSolveSpeed = speeds[parseInt(e.target.value)];
                
                document.querySelectorAll('.speed-indicator').forEach(indicator => {
                    indicator.classList.remove('active');
                });
                const activeIndicator = document.querySelector(`[data-speed="${e.target.value}"]`);
                if (activeIndicator) {
                    activeIndicator.classList.add('active');
                }
                console.log('Speed changed to:', this.autoSolveSpeed);
            });
        }

        // Auto-solve modal buttons
        this.addClickHandler('cancel-auto-solve', () => {
            this.hideModal('auto-solve-modal');
        });

        this.addClickHandler('start-auto-solve', () => {
            console.log('Starting auto-solve with mode:', this.autoSolveMode);
            this.startAutoSolve();
        });

        // Auto-solve progress controls
        this.addClickHandler('pause-solving', () => {
            this.toggleAutoSolvePause();
        });

        this.addClickHandler('stop-solving', () => {
            this.stopAutoSolve();
        });
    }

    // Audio system
    async initAudio() {
        try {
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
                'victory': 1000,
                'auto-solve-start': 900,
                'auto-solve-step': 700,
                'auto-solve-complete': 1200,
                'auto-solve-pause': 500,
                'magic-wand': 1000
            };
            
            oscillator.frequency.setValueAtTime(frequencies[type] || 600, this.audioContext.currentTime);
            oscillator.type = type === 'magic-wand' ? 'sawtooth' : 'sine';
            
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
        console.log('Starting new game with difficulty:', this.currentDifficulty);
        this.showLoadingOverlay();
        
        setTimeout(() => {
            const puzzles = this.getPuzzleData();
            const difficultyPuzzles = puzzles[this.currentDifficulty];
            
            if (difficultyPuzzles && difficultyPuzzles.length > 0) {
                this.currentPuzzle = difficultyPuzzles[0];
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
        this.gameGrid = JSON.parse(JSON.stringify(this.currentPuzzle.grid));
        this.score = 0;
        this.moves = [];
        this.selectedCell = null;
        this.isAutoSolving = false;
        this.totalCells = this.countInputCells();
        this.solvedCells = this.countSolvedCells();
        
        this.renderGrid();
        this.updateScore(0);
        this.enableContinueButton();
    }

    countInputCells() {
        let count = 0;
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                if (this.gameGrid[row][col].type === 'input') {
                    count++;
                }
            }
        }
        return count;
    }

    countSolvedCells() {
        let count = 0;
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value > 0) {
                    count++;
                }
            }
        }
        return count;
    }

    renderGrid() {
        const gridContainer = document.getElementById('game-grid');
        if (!gridContainer) return;
        
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
                
                // Add multiple event handlers for better device support
                this.addMultipleEventHandlers(cellDiv, ['click', 'touchend'], (e) => {
                    if (!this.isAutoSolving) {
                        console.log('Cell clicked:', row, col);
                        this.selectCell(row, col);
                    }
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
        
        console.log('Selecting cell:', row, col);
        this.playSound('cell-select');
        
        document.querySelectorAll('.cell-input.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.classList.add('selected');
        }
        
        this.selectedCell = { row, col };
        this.showModal('number-picker');
    }

    selectNumber(number) {
        if (!this.selectedCell) return;
        
        console.log('Selecting number:', number);
        const { row, col } = this.selectedCell;
        const cell = this.gameGrid[row][col];
        
        this.moves.push({
            row,
            col,
            previousValue: cell.value,
            newValue: number
        });
        
        cell.value = number;
        
        const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cellElement) {
            cellElement.textContent = number;
        }
        
        this.playSound('number-input');
        this.updateCellValidation(cellElement, cell, row, col);
        this.updateScore(10);
        this.saveGameState();
        this.hideModal('number-picker');
        
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
        
        const rowConflict = this.gameGrid[row].some((c, index) => 
            index !== col && c.type === 'input' && c.value === cell.value && c.value > 0
        );
        
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

    showVictory(isAutoSolved = false) {
        this.stopTimer();
        this.playSound(isAutoSolved ? 'auto-solve-complete' : 'victory');
        
        const finalTime = this.formatTime(this.getElapsedTime());
        const finalScore = this.score;
        
        const finalTimeEl = document.getElementById('final-time');
        const finalScoreEl = document.getElementById('final-score');
        const autoSolveStat = document.getElementById('auto-solve-stat');
        
        if (finalTimeEl) finalTimeEl.textContent = finalTime;
        if (finalScoreEl) finalScoreEl.textContent = finalScore;
        if (autoSolveStat) {
            autoSolveStat.style.display = isAutoSolved ? 'flex' : 'none';
        }
        
        this.showModal('victory-modal');
        if (!isAutoSolved) {
            this.createConfettiEffect();
        }
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

    // Auto-solve functionality
    showAutoSolveModal() {
        console.log('Showing auto-solve modal');
        this.playSound('magic-wand');
        this.showModal('auto-solve-modal');
    }

    startAutoSolve() {
        console.log('Starting auto-solve with mode:', this.autoSolveMode);
        this.hideModal('auto-solve-modal');
        this.isAutoSolving = true;
        this.autoSolvePaused = false;
        this.currentAutoSolveStep = 0;
        this.autoSolveStartTime = Date.now();
        
        this.playSound('auto-solve-start');
        
        if (this.autoSolveMode === 'instant') {
            this.solveInstantly();
        } else {
            this.generateSolveSteps();
            this.showModal('auto-solve-progress');
            this.updateSolvingControls();
            this.startStepBySolve();
        }
    }

    solveInstantly() {
        console.log('Solving instantly');
        // Fill in all correct answers immediately
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value === 0) {
                    cell.value = cell.answer;
                    const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cellElement) {
                        cellElement.textContent = cell.value;
                        cellElement.classList.add('auto-solved');
                        setTimeout(() => {
                            cellElement.classList.remove('auto-solved');
                            this.updateCellValidation(cellElement, cell, row, col);
                        }, 800);
                    }
                }
            }
        }
        
        this.isAutoSolving = false;
        this.updateScore(100); // Bonus for completion
        this.saveGameState();
        
        setTimeout(() => {
            this.showVictory(true);
        }, 1000);
    }

    generateSolveSteps() {
        this.autoSolveSteps = [];
        
        // Create steps for each empty cell
        for (let row = 0; row < this.gameGrid.length; row++) {
            for (let col = 0; col < this.gameGrid[row].length; col++) {
                const cell = this.gameGrid[row][col];
                if (cell.type === 'input' && cell.value === 0) {
                    this.autoSolveSteps.push({
                        row,
                        col,
                        value: cell.answer,
                        technique: this.getSolvingTechnique(row, col)
                    });
                }
            }
        }
        
        // Shuffle steps for more realistic solving order
        this.autoSolveSteps.sort(() => Math.random() - 0.5);
        console.log('Generated', this.autoSolveSteps.length, 'solve steps');
    }

    getSolvingTechnique(row, col) {
        const techniques = [
            'Naked Singles',
            'Hidden Singles', 
            'Sum Analysis',
            'Constraint Elimination',
            'Backtracking',
            'Intersection Analysis'
        ];
        return techniques[Math.floor(Math.random() * techniques.length)];
    }

    startStepBySolve() {
        if (this.autoSolvePaused || this.currentAutoSolveStep >= this.autoSolveSteps.length) {
            if (this.currentAutoSolveStep >= this.autoSolveSteps.length) {
                this.completeAutoSolve();
            }
            return;
        }
        
        this.autoSolveTimer = setTimeout(() => {
            this.processNextStep();
        }, this.autoSolveSpeed);
    }

    processNextStep() {
        if (this.currentAutoSolveStep >= this.autoSolveSteps.length) {
            this.completeAutoSolve();
            return;
        }
        
        const step = this.autoSolveSteps[this.currentAutoSolveStep];
        const cell = this.gameGrid[step.row][step.col];
        
        // Highlight current cell
        const cellElement = document.querySelector(`[data-row="${step.row}"][data-col="${step.col}"]`);
        if (cellElement) {
            cellElement.classList.add('solving');
        }
        
        // Update progress display
        this.updateAutoSolveProgress(step);
        
        setTimeout(() => {
            // Set the value
            cell.value = step.value;
            if (cellElement) {
                cellElement.textContent = step.value;
                cellElement.classList.remove('solving');
                cellElement.classList.add('auto-solved');
                
                setTimeout(() => {
                    cellElement.classList.remove('auto-solved');
                    this.updateCellValidation(cellElement, cell, step.row, step.col);
                }, 500);
            }
            
            this.playSound('auto-solve-step');
            this.currentAutoSolveStep++;
            this.startStepBySolve();
            
        }, 300);
    }

    updateAutoSolveProgress(step) {
        const progress = Math.round((this.currentAutoSolveStep / this.autoSolveSteps.length) * 100);
        
        const progressPercentage = document.getElementById('progress-percentage');
        const progressFill = document.getElementById('progress-fill');
        const cellsSolved = document.getElementById('cells-solved');
        const currentTechnique = document.getElementById('current-technique');
        const solveTime = document.getElementById('solve-time');
        
        if (progressPercentage) progressPercentage.textContent = progress + '%';
        if (progressFill) progressFill.style.width = progress + '%';
        if (cellsSolved) cellsSolved.textContent = `${this.currentAutoSolveStep} / ${this.autoSolveSteps.length}`;
        if (currentTechnique) currentTechnique.textContent = step.technique;
        if (solveTime) {
            const elapsed = Math.floor((Date.now() - this.autoSolveStartTime) / 1000);
            solveTime.textContent = this.formatTime(elapsed);
        }
    }

    updateSolvingControls() {
        const solvingControls = document.getElementById('solving-controls');
        if (solvingControls && this.autoSolveMode === 'step-by-step') {
            solvingControls.style.display = 'flex';
        }
    }

    toggleAutoSolvePause() {
        this.autoSolvePaused = !this.autoSolvePaused;
        
        const pauseBtn = document.getElementById('pause-solving');
        if (pauseBtn) {
            if (this.autoSolvePaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
                this.playSound('auto-solve-pause');
                if (this.autoSolveTimer) {
                    clearTimeout(this.autoSolveTimer);
                }
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                this.startStepBySolve();
            }
        }
    }

    stopAutoSolve() {
        this.isAutoSolving = false;
        this.autoSolvePaused = false;
        
        if (this.autoSolveTimer) {
            clearTimeout(this.autoSolveTimer);
        }
        
        // Remove any solving classes
        document.querySelectorAll('.cell-input.solving').forEach(el => {
            el.classList.remove('solving');
        });
        
        this.hideModal('auto-solve-progress');
        this.playSound('button-click');
    }

    completeAutoSolve() {
        this.isAutoSolving = false;
        this.hideModal('auto-solve-progress');
        this.updateScore(100);
        this.saveGameState();
        
        setTimeout(() => {
            this.showVictory(true);
        }, 500);
    }

    undoMove() {
        if (this.moves.length === 0 || this.isAutoSolving) return;
        
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
        if (this.isAutoSolving) return;
        
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
                    
                    this.updateScore(-20);
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
        if (this.isAutoSolving) return;
        
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
        const autoSolveHintsBtn = document.getElementById('autosolve-hints-toggle');
        
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
        
        if (autoSolveHintsBtn) {
            autoSolveHintsBtn.classList.toggle('inactive', !this.settings.autoSolveHints);
            autoSolveHintsBtn.innerHTML = this.settings.autoSolveHints ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
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
                this.updateScore(0);
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
        this.stopAutoSolve();
        this.hideModal('settings-modal');
        this.showScreen('main-menu');
        this.enableContinueButton();
        this.playSound('button-click');
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Kakuro game...');
    window.kakuroGame = new KakuroGame();
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.kakuroGame && document.hidden && window.kakuroGame.currentScreen === 'game-screen') {
        if (window.kakuroGame.gameTimer) {
            window.kakuroGame.pauseGame();
        }
    }
});

// Prevent zoom on double tap
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