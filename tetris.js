// Tetris Game Implementation
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const CELL_SIZE = 24;

// Tetromino shapes
const TETROMINOS = [
    // I (Cyan)
    {
        shape: [[1, 1, 1, 1]],
        color: '#00d4ff'
    },
    // O (Yellow)
    {
        shape: [[1, 1], [1, 1]],
        color: '#ffff00'
    },
    // T (Purple)
    {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#ff00ff'
    },
    // S (Green)
    {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#00ff88'
    },
    // Z (Red)
    {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#ff0055'
    },
    // J (Blue)
    {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#0055ff'
    },
    // L (Orange)
    {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#ff8800'
    }
];

class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(0));
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameActive = false;
        this.gamePaused = false;
        this.dropInterval = 1000;
        this.lastDropTime = 0;

        this.setupEventListeners();
        this.generateNextPiece();
        this.spawnPiece();
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    start() {
        if (!this.gameActive) {
            this.gameActive = true;
            this.gamePaused = false;
            document.getElementById('startBtn').disabled = true;
            document.getElementById('pauseBtn').disabled = false;
            this.gameLoop();
        }
    }

    togglePause() {
        this.gamePaused = !this.gamePaused;
        if (!this.gamePaused) {
            this.gameLoop();
        }
    }

    reset() {
        this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameActive = false;
        this.gamePaused = false;
        this.lastDropTime = 0;
        this.dropInterval = 1000;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        this.generateNextPiece();
        this.spawnPiece();
        this.updateUI();
        this.draw();
    }

    generateNextPiece() {
        const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
        this.nextPiece = {
            ...TETROMINOS[randomIndex],
            x: 0,
            y: 0,
            rotation: 0
        };
    }

    spawnPiece() {
        this.currentPiece = {
            ...this.nextPiece,
            x: Math.floor((GRID_WIDTH - this.nextPiece.shape[0].length) / 2),
            y: 0,
            rotation: 0
        };
        this.generateNextPiece();
        this.drawNextPiece();

        if (this.isColliding(this.currentPiece)) {
            this.gameOver();
        }
    }

    handleKeyPress(e) {
        if (!this.gameActive || this.gamePaused) {
            if (e.key.toLowerCase() === 'p') {
                this.togglePause();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    movePiece(dx, dy) {
        const newPiece = { ...this.currentPiece, x: this.currentPiece.x + dx, y: this.currentPiece.y + dy };
        if (!this.isColliding(newPiece)) {
            this.currentPiece = newPiece;
            return true;
        }
        return false;
    }

    rotatePiece() {
        const rotated = this.rotateTetromino(this.currentPiece);
        if (!this.isColliding(rotated)) {
            this.currentPiece = rotated;
        }
    }

    rotateTetromino(piece) {
        const shape = piece.shape;
        const newShape = shape[0].map((_, i) =>
            shape.map(row => row[i]).reverse()
        );
        return {
            ...piece,
            shape: newShape,
            rotation: (piece.rotation + 1) % 4
        };
    }

    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
    }

    isColliding(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    const newX = piece.x + x;
                    const newY = piece.y + y;

                    if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
                        return true;
                    }

                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const gridY = this.currentPiece.y + y;
                    const gridX = this.currentPiece.x + x;

                    if (gridY >= 0) {
                        this.grid[gridY][gridX] = this.currentPiece.color;
                    }
                }
            }
        }

        const clearedLines = this.clearLines();
        if (clearedLines > 0) {
            this.addScore(clearedLines);
        }

        this.spawnPiece();
    }

    clearLines() {
        let clearedLines = 0;

        for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(GRID_WIDTH).fill(0));
                clearedLines++;
                y++;
            }
        }

        return clearedLines;
    }

    addScore(lines) {
        const baseScore = [0, 100, 300, 500, 800];
        this.score += baseScore[lines] * this.level;
        this.lines += lines;
        this.level = Math.floor(this.lines / 10) + 1;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
        this.updateUI();
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }

    gameLoop() {
        if (!this.gameActive) return;
        if (this.gamePaused) return;

        const now = Date.now();
        if (now - this.lastDropTime > this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.lastDropTime = now;
        }

        this.draw();

        if (this.gameActive) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= GRID_WIDTH; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CELL_SIZE, 0);
            this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
            this.ctx.stroke();
        }

        // Draw placed blocks
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x]) {
                    this.drawCell(x, y, this.grid[y][x], this.ctx);
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawCell(
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color,
                            this.ctx
                        );
                    }
                }
            }
        }
    }

    drawCell(x, y, color, ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        // Add shadow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#0f0f1e';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

        if (this.nextPiece) {
            const piece = this.nextPiece;
            const cellSize = 20;
            const offsetX = (this.nextCanvas.width - piece.shape[0].length * cellSize) / 2;
            const offsetY = (this.nextCanvas.height - piece.shape.length * cellSize) / 2;

            for (let y = 0; y < piece.shape.length; y++) {
                for (let x = 0; x < piece.shape[y].length; x++) {
                    if (piece.shape[y][x]) {
                        this.nextCtx.fillStyle = piece.color;
                        this.nextCtx.fillRect(
                            offsetX + x * cellSize + 1,
                            offsetY + y * cellSize + 1,
                            cellSize - 2,
                            cellSize - 2
                        );
                        this.nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                        this.nextCtx.lineWidth = 1;
                        this.nextCtx.strokeRect(
                            offsetX + x * cellSize + 1,
                            offsetY + y * cellSize + 1,
                            cellSize - 2,
                            cellSize - 2
                        );
                    }
                }
            }
        }
    }

    gameOver() {
        this.gameActive = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;

        // Show game over screen
        const overlay = document.createElement('div');
        overlay.className = 'game-over-overlay';
        overlay.innerHTML = `
            <div class="game-over-box">
                <h2>遊戲結束</h2>
                <p>最終分數</p>
                <p class="final-score">${this.score}</p>
                <p>等級: ${this.level}</p>
                <p>消除行數: ${this.lines}</p>
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
        }, 3000);
    }
}

// Initialize game
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new Tetris();
});
