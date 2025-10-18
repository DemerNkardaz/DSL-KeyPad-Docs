class Accordion {
	constructor(el) {
		this.el = el;
		this.summary = el.querySelector('summary');
		this.content = el.querySelector('.dropdown-content');

		this.animation = null;
		this.isClosing = false;
		this.isExpanding = false;
		this.summary.addEventListener('click', (e) => this.onClick(e));
	}

	onClick(e) {
		e.preventDefault();
		this.el.style.overflow = 'hidden';
		if (this.isClosing || !this.el.open) {
			this.open();
		} else if (this.isExpanding || this.el.open) {
			this.shrink();
		}
	}

	shrink() {
		this.isClosing = true;
		this.el.classList.add('closed');
		
		const startHeight = `${this.el.offsetHeight}px`;
		const endHeight = `${this.summary.offsetHeight}px`;
		
		if (this.animation) {
			this.animation.cancel();
		}
		
		this.animation = this.el.animate({
			height: [startHeight, endHeight]
		}, {
			duration: 400,
			easing: 'ease-out'
		});
		
		this.animation.onfinish = () => this.onAnimationFinish(false);
		this.animation.oncancel = () => this.isClosing = false;
	}

	open() {
		this.el.style.height = `${this.el.offsetHeight}px`;
		this.el.open = true;
		window.requestAnimationFrame(() => this.expand());
	}

	expand() {
		this.isExpanding = true;
		const startHeight = `${this.el.offsetHeight}px`;
		const endHeight = `${this.summary.offsetHeight + this.content.offsetHeight}px`;
		
		if (this.animation) {
			this.animation.cancel();
		}
		
		this.animation = this.el.animate({
			height: [startHeight, endHeight]
		}, {
			duration: 400,
			easing: 'ease-out'
		});
		this.animation.onfinish = () => this.onAnimationFinish(true);
		this.animation.oncancel = () => this.isExpanding = false;
	}

	onAnimationFinish(open) {
		this.el.open = open;
		this.animation = null;
		this.isClosing = false;
		this.isExpanding = false;
		this.el.style.height = this.el.style.overflow = '';
		if (!open) {
			this.el.classList.add('closed');
		} else {
			this.el.classList.remove('closed');
		}
	}
}

class AutoChess {
	locales = {
		'ru-RU': {
			'black': 'Чёрные',
			'white': 'Белые',
			'turn': 'Ход: ',
			'check': 'Шах: ',
			'win': 'Мат! Победа: ',
			'stalemate': 'Пат! Ничья',
			'draw': 'Ничья',
			'pause': 'Пауза',
			'start': 'Старт',
			'start_warning': 'Просчёт ходов может вызывать подвисание',
			'ai_battleground': '[Зелёный] обеими командами управляет бот, [Красный] белыми управляет игрок',
			'unicode': 'Все фигуры на доске представлены символами Unicode'
		},
		'en-US': {
			'black': 'Black',
			'white': 'White',
			'turn': 'Turn: ',
			'check': 'Check: ',
			'win': 'Checkmate! Winner: ',
			'stalemate': 'Stalemate! Draw',
			'draw': 'Draw',
			'pause': 'Pause',
			'start': 'Start',
			'start_warning': 'Calculating moves may cause lag',
			'ai_battleground': '[Green] both teams control the bot, [Red] white controls the player',
			'unicode': 'All pieces on the board are represented by Unicode characters'
		}
	}

	constructor(parentElement, options = {}) {
		this.parentElement = typeof parentElement === 'string'
			? document.querySelector(parentElement)
			: parentElement;

		this.options = {
			moveDelay: options.moveDelay || 800,
			aiDepth: options.aiDepth || 3,
			scale: options.scale || 1,
			...options
		};

		this.unicodePieces = {
			'wK': '♚', 'wQ': '♛', 'wR': '♜', 'wB': '♝', 'wN': '♞', 'wP': '♟',
			'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
		};

		this.game = null;
		this.gameOver = false;
		this.isPaused = true;
		this.container = null;
		this.boardElement = null;
		this.turnElement = null;
		this.controlButton = null;
		
		this.moveTimeout = null;
		this.selectedSquare = null;
		this.selectedPiece = null;

		this.loadChessLibrary().then(() => {
			this.init();
		});
	}

	loadChessLibrary() {
		return new Promise((resolve, reject) => {
			if (typeof Chess !== 'undefined') {
				resolve();
				return;
			}

			const existingScript = document.querySelector('script[src*="chess.js"]');
			if (existingScript) {
				existingScript.addEventListener('load', resolve);
				existingScript.addEventListener('error', reject);
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	init() {
		this.game = new Chess();
		this.aiEnabled = true;
		this.createUI();
		this.renderBoard();
		this.updateTurnInfo();
	}

	createUI() {
		const s = this.options.scale;
		
		this.container = document.createElement('div');
		this.container.className = 'chess-container';
		this.container.style.padding = `${20 * s}px`;

		this.boardElement = document.createElement('div');
		this.boardElement.className = 'chess-board';
		this.boardElement.style.gridTemplateColumns = `repeat(8, ${60 * s}px)`;
		this.boardElement.style.gridTemplateRows = `repeat(8, ${60 * s}px)`;
		this.boardElement.style.borderRadius = `${15 * s}px`;
		this.boardElement.style.marginBottom = `${15 * s}px`;

		const infoContainer = document.createElement('div');
		infoContainer.className = 'chess-info-container';

		this.controlButton = document.createElement('button');
		this.controlButton.className = 'chess-btn chess-btn-control';
		this.controlButton.style.fontSize = `${18 * s}px`;
		this.controlButton.style.padding = `${8 * s}px ${16 * s}px`;
		this.controlButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['start_warning']);
		this.updateControlButton();
		this.controlButton.addEventListener('click', () => this.togglePause());
		
		this.turnElement = document.createElement('div');
		this.turnElement.className = 'chess-turn-info';
		this.turnElement.style.fontSize = `${18 * s}px`;
		
		const emptyCell = document.createElement('div');
		
		infoContainer.appendChild(this.controlButton);
		infoContainer.appendChild(this.turnElement);
		infoContainer.appendChild(emptyCell);

		const sideButtonsContainer = document.createElement('div');
		sideButtonsContainer.className = 'chess-side-buttons-container';
		
		this.resetButton = document.createElement('button');
		this.resetButton.className = 'chess-btn chess-side-btn';
		this.resetButton.innerHTML = `<img class="invert" src="./Media/SVG/Flat_Icons/flat_reload.svg"></img>`;
		this.resetButton.addEventListener('click', () => this.reset());

		this.playAIButton = document.createElement('button');
		this.playAIButton.className = 'chess-btn chess-side-btn chess-side-btn-allowed';
		this.playAIButton.innerHTML = `<img class="invert" src="./Media/SVG/Flat_Icons/flat_robot.svg"></img>`;
		this.playAIButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['ai_battleground']);
		this.playAIButton.addEventListener('click', () => this.playAI());

		this.unicodePageButton = document.createElement('a');
		this.unicodePageButton.className = 'chess-btn chess-side-btn chess-side-btn-squared';
		this.unicodePageButton.innerHTML = `<img src="./Media/SVG/Flat_Icons/unicode_logo.svg"></img>`;
		this.unicodePageButton.setAttribute('href', 'https://home.unicode.org');
		this.unicodePageButton.setAttribute('target', '_blank');
		this.unicodePageButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['unicode']);
		
		sideButtonsContainer.appendChild(this.resetButton);
		sideButtonsContainer.appendChild(this.playAIButton);
		sideButtonsContainer.appendChild(this.unicodePageButton);
		
		this.container.appendChild(this.boardElement);
		this.container.appendChild(infoContainer);
		this.container.appendChild(sideButtonsContainer);
		this.parentElement.appendChild(this.container);
	}

	updateControlButton() {
		const lang = typeof language !== 'undefined' ? language : 'en-US';
		this.controlButton.innerHTML = `${this.isPaused ? this.locales[lang]['start'] : this.locales[lang]['pause']} <div class="flex-container"><span class="circled-symbol ">i</span></div>`;
	}

	togglePause() {
		if (this.isPaused) {
			this.start();
		} else {
			this.pause();
		}
	}

	reset() {
		this.game.reset();
		this.gameOver = false;
		this.selectedSquare = null;
		this.selectedPiece = null;
		this.renderBoard();
		this.updateTurnInfo();
		
		// Если игра была запущена и AI включен, продолжаем
		if (!this.isPaused && this.aiEnabled) {
			this.scheduleNextMove(1000);
		}
	}

	playAI() {
		if (this.aiEnabled) {
			// Переключаемся в режим "человек vs бот"
			this.aiEnabled = false;
			this.playAIButton.classList.remove('chess-side-btn-allowed');
			this.playAIButton.classList.add('chess-side-btn-restricted');
			
			// Очищаем выделение
			this.selectedSquare = null;
			this.selectedPiece = null;
			this.renderBoard();
		} else {
			// Переключаемся в режим "бот vs бот"
			this.aiEnabled = true;
			this.playAIButton.classList.add('chess-side-btn-allowed');
			this.playAIButton.classList.remove('chess-side-btn-restricted');
			
			// Очищаем выделение
			this.selectedSquare = null;
			this.selectedPiece = null;
			this.renderBoard();
			
			// Если игра запущена и сейчас ход белых (которые теперь бот), продолжаем
			if (!this.isPaused && this.game.turn() === 'w') {
				this.scheduleNextMove(100);
			}
		}
	}

	pause() {
		if (this.isPaused) return;
		this.isPaused = true;
		this.updateControlButton();
		if (this.moveTimeout) {
			clearTimeout(this.moveTimeout);
			this.moveTimeout = null;
		}
	}

	start() {
		if (!this.isPaused) return;
		this.isPaused = false;
		this.updateControlButton();
		if (!this.gameOver) {
			this.scheduleNextMove(100);
		}
	}

	scheduleNextMove(delay) {
		if (this.moveTimeout) {
			clearTimeout(this.moveTimeout);
		}
		if (!this.isPaused) {
			this.moveTimeout = setTimeout(() => this.makeAiMove(), delay);
		}
	}

	pieceToUnicode(piece) {
		if (!piece) return '';
		const color = piece.color === 'w' ? 'w' : 'b';
		const type = piece.type.toUpperCase();
		return this.unicodePieces[color + type] || '';
	}

	getCellIndex(row, col) {
		return row * 8 + col;
	}

	getSquareNotation(row, col) {
		const file = String.fromCharCode(97 + col); // a-h
		const rank = 8 - row; // 8-1
		return file + rank;
	}

	handleCellClick(row, col, cell) {
		// Игрок может ходить только когда:
		// 1. AI выключен (режим игрока)
		// 2. Игра не окончена
		// 3. Сейчас ход белых
		if (this.aiEnabled || this.gameOver || this.game.turn() !== 'w') return;
		
		const square = this.getSquareNotation(row, col);
		const piece = this.game.get(square);
		
		// Если ничего не выбрано, пытаемся выбрать белую фигуру
		if (!this.selectedSquare) {
			if (piece && piece.color === 'w') {
				this.selectedSquare = square;
				this.selectedPiece = piece;
				
				// Перерисовываем доску с подсветками
				this.renderBoardWithHighlights();
			}
		} else {
			// Пытаемся сделать ход
			const move = this.game.move({
				from: this.selectedSquare,
				to: square,
				promotion: 'q'
			});
			
			if (move) {
				// Ход успешен
				this.selectedSquare = null;
				this.selectedPiece = null;
				
				this.highlightMove(move.from, move.to);
				
				setTimeout(() => {
					this.renderBoard();
					this.updateTurnInfo();
					
					// Проверяем окончание игры
					if (this.game.game_over()) {
						this.handleGameOver();
					} else if (!this.isPaused) {
						// Теперь ход чёрных (бот)
						setTimeout(() => this.makeAiMove(), this.options.moveDelay);
					}
				}, 300);
			} else {
				// Неверный ход или переключение на другую фигуру
				if (piece && piece.color === 'w') {
					// Переключаемся на другую белую фигуру
					this.selectedSquare = square;
					this.selectedPiece = piece;
					
					this.renderBoardWithHighlights();
				} else {
					// Снимаем выделение
					this.selectedSquare = null;
					this.selectedPiece = null;
					this.renderBoard();
				}
			}
		}
	}

	// Получаем все клетки, которые атакуют чёрные фигуры (простая проверка без симуляции)
	getBlackAttackedSquares() {
		const attackedSquares = new Set();
		const board = this.game.board();
		
		// Проходим по всем чёрным фигурам
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const piece = board[row][col];
				if (!piece || piece.color !== 'b') continue;
				
				switch (piece.type) {
					case 'p': // Пешка
						// Чёрные пешки атакуют вниз по диагоналям
						if (row < 7) {
							if (col > 0) attackedSquares.add(this.getSquareNotation(row + 1, col - 1));
							if (col < 7) attackedSquares.add(this.getSquareNotation(row + 1, col + 1));
						}
						break;
						
					case 'n': // Конь
						const knightMoves = [
							[-2, -1], [-2, 1], [-1, -2], [-1, 2],
							[1, -2], [1, 2], [2, -1], [2, 1]
						];
						knightMoves.forEach(([dr, dc]) => {
							const newRow = row + dr;
							const newCol = col + dc;
							if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
								attackedSquares.add(this.getSquareNotation(newRow, newCol));
							}
						});
						break;
						
					case 'b': // Слон
						this.addDiagonalAttacks(row, col, attackedSquares, board);
						break;
						
					case 'r': // Ладья
						this.addStraightAttacks(row, col, attackedSquares, board);
						break;
						
					case 'q': // Ферзь
						this.addDiagonalAttacks(row, col, attackedSquares, board);
						this.addStraightAttacks(row, col, attackedSquares, board);
						break;
						
					case 'k': // Король
						const kingMoves = [
							[-1, -1], [-1, 0], [-1, 1],
							[0, -1], [0, 1],
							[1, -1], [1, 0], [1, 1]
						];
						kingMoves.forEach(([dr, dc]) => {
							const newRow = row + dr;
							const newCol = col + dc;
							if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
								attackedSquares.add(this.getSquareNotation(newRow, newCol));
							}
						});
						break;
				}
			}
		}
		
		return attackedSquares;
	}
	
	// Добавляем атаки по диагоналям
	addDiagonalAttacks(row, col, attackedSquares, board) {
		const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
		directions.forEach(([dr, dc]) => {
			let r = row + dr;
			let c = col + dc;
			while (r >= 0 && r < 8 && c >= 0 && c < 8) {
				attackedSquares.add(this.getSquareNotation(r, c));
				// Останавливаемся если встретили любую фигуру
				if (board[r][c]) break;
				r += dr;
				c += dc;
			}
		});
	}
	
	// Добавляем атаки по прямым линиям
	addStraightAttacks(row, col, attackedSquares, board) {
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		directions.forEach(([dr, dc]) => {
			let r = row + dr;
			let c = col + dc;
			while (r >= 0 && r < 8 && c >= 0 && c < 8) {
				attackedSquares.add(this.getSquareNotation(r, c));
				// Останавливаемся если встретили любую фигуру
				if (board[r][c]) break;
				r += dr;
				c += dc;
			}
		});
	}

	renderBoardWithHighlights() {
		this.boardElement.innerHTML = '';
		const boardState = this.game.board();
		const s = this.options.scale;
		
		// Получаем возможные ходы выбранной фигуры
		const possibleMoves = this.selectedSquare 
			? this.game.moves({ square: this.selectedSquare, verbose: true })
			: [];
		
		// Создаём Set для быстрого поиска
		const possibleMovesSet = new Set(possibleMoves.map(m => m.to));
		
		// Получаем все атакуемые чёрными клетки (один раз)
		const blackAttackedSquares = this.getBlackAttackedSquares();

		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const cell = document.createElement('div');
				const isLight = (row + col) % 2 === 0;
				cell.className = `chess-cell chess-cell-${isLight ? 'light' : 'dark'}`;
				cell.style.width = `${60 * s}px`;
				cell.style.height = `${60 * s}px`;
				cell.style.fontSize = `${40 * s}px`;

				const square = this.getSquareNotation(row, col);
				const piece = boardState[row][col];
				
				if (!this.aiEnabled) {
					cell.style.cursor = 'pointer';
					cell.addEventListener('click', () => this.handleCellClick(row, col, cell));
				}
				
				if (this.selectedSquare) {
					if (square === this.selectedSquare) {
						const isUnderAttack = blackAttackedSquares.has(square);
						if (isUnderAttack) {
							cell.classList.add('chess-cell-selected-under-attack');
						} else {
							cell.classList.add('chess-cell-selected');
						}
					} else if (possibleMovesSet.has(square)) {
						const isAttack = piece && piece.color === 'b';
						const isHazardous = blackAttackedSquares.has(square);
						
						if (isAttack && isHazardous) {
							cell.classList.add('chess-cell-attackable-hazardous');
						} else if (isAttack) {
							cell.classList.add('chess-cell-attackable');
						} else if (isHazardous) {
							cell.classList.add('chess-cell-hazardous');
						} else {
							cell.classList.add('chess-cell-highlight');
						}
					} else {
						cell.classList.add('chess-cell-unreachable');
					}
				}

				if (piece) {
					const pieceSpan = document.createElement('span');
					pieceSpan.className = `chess-piece chess-piece-${piece.color === 'w' ? 'white' : 'black'}`;
					pieceSpan.style.fontSize = `${40 * s}px`;
					pieceSpan.textContent = this.pieceToUnicode(piece);
					cell.appendChild(pieceSpan);
				}

				this.boardElement.appendChild(cell);
			}
		}
	}

	renderBoard() {
		this.boardElement.innerHTML = '';
		const boardState = this.game.board();
		const s = this.options.scale;

		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const cell = document.createElement('div');
				const isLight = (row + col) % 2 === 0;
				cell.className = `chess-cell chess-cell-${isLight ? 'light' : 'dark'}`;
				cell.style.width = `${60 * s}px`;
				cell.style.height = `${60 * s}px`;
				cell.style.fontSize = `${40 * s}px`;

				if (!this.aiEnabled) {
					cell.style.cursor = 'pointer';
					cell.addEventListener('click', () => this.handleCellClick(row, col, cell));
				}

				const piece = boardState[row][col];
				if (piece) {
					const pieceSpan = document.createElement('span');
					pieceSpan.className = `chess-piece chess-piece-${piece.color === 'w' ? 'white' : 'black'}`;
					pieceSpan.style.fontSize = `${40 * s}px`;
					pieceSpan.textContent = this.pieceToUnicode(piece);
					cell.appendChild(pieceSpan);
				}

				this.boardElement.appendChild(cell);
			}
		}
	}

	highlightMove(from, to) {
		const fromFile = from.charCodeAt(0) - 97;
		const fromRank = 8 - parseInt(from[1]);
		const toFile = to.charCodeAt(0) - 97;
		const toRank = 8 - parseInt(to[1]);

		const cells = this.boardElement.querySelectorAll('.chess-cell');
		cells[fromRank * 8 + fromFile].classList.add('chess-cell-highlight');
		cells[toRank * 8 + toFile].classList.add('chess-cell-highlight');

		setTimeout(() => {
			cells[fromRank * 8 + fromFile].classList.remove('chess-cell-highlight');
			cells[toRank * 8 + toFile].classList.remove('chess-cell-highlight');
		}, 300);
	}

	updateTurnInfo() {
		const lang = typeof language !== 'undefined' ? language : 'en-US';
		const turnColor = this.game.turn() === 'w' ? this.locales[lang]['white'] : this.locales[lang]['black'];
		const turnPiece = this.game.turn() === 'w' ? '♔' : '♚';
		this.turnElement.textContent = `${this.locales[lang]['turn']} ${turnColor} ${turnPiece}`;
	}

	evaluatePosition() {
		const pieceValues = {
			p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
		};

		let score = 0;
		const board = this.game.board();

		for (let row of board) {
			for (let piece of row) {
				if (piece) {
					const value = pieceValues[piece.type] || 0;
					score += piece.color === 'w' ? value : -value;
				}
			}
		}

		return score;
	}

	minimax(depth, alpha, beta, maximizingPlayer) {
		if (depth === 0 || this.game.game_over()) {
			return this.evaluatePosition();
		}

		const moves = this.game.moves();

		if (maximizingPlayer) {
			let maxEval = -Infinity;
			for (let move of moves) {
				this.game.move(move);
				const evaluation = this.minimax(depth - 1, alpha, beta, false);
				this.game.undo();
				maxEval = Math.max(maxEval, evaluation);
				alpha = Math.max(alpha, evaluation);
				if (beta <= alpha) break;
			}
			return maxEval;
		} else {
			let minEval = Infinity;
			for (let move of moves) {
				this.game.move(move);
				const evaluation = this.minimax(depth - 1, alpha, beta, true);
				this.game.undo();
				minEval = Math.min(minEval, evaluation);
				beta = Math.min(beta, evaluation);
				if (beta <= alpha) break;
			}
			return minEval;
		}
	}

	getBestMove() {
		const moves = this.game.moves();
		if (moves.length === 0) return null;

		let bestMove = null;
		let bestValue = this.game.turn() === 'w' ? -Infinity : Infinity;

		const shuffledMoves = moves.sort(() => Math.random() - 0.5);

		for (let move of shuffledMoves) {
			this.game.move(move);
			const value = this.minimax(this.options.aiDepth - 1, -Infinity, Infinity, this.game.turn() === 'w');
			this.game.undo();

			if (this.game.turn() === 'w') {
				if (value > bestValue) {
					bestValue = value;
					bestMove = move;
				}
			} else {
				if (value < bestValue) {
					bestValue = value;
					bestMove = move;
				}
			}
		}

		return bestMove;
	}

	handleGameOver() {
		this.gameOver = true;
		const lang = typeof language !== 'undefined' ? language : 'en-US';
		let statusText = '';

		if (this.game.in_checkmate()) {
			const winner = this.game.turn() === 'w' ? this.locales[lang]['black'] + ' ♚' : this.locales[lang]['white'] + ' ♔';
			statusText = this.locales[lang]['win'] + winner;
		} else if (this.game.in_stalemate()) {
			statusText = this.locales[lang]['stalemate'];
		} else if (this.game.in_draw()) {
			statusText = this.locales[lang]['draw'];
		}

		this.turnElement.textContent = statusText;

		setTimeout(() => {
			this.game.reset();
			this.gameOver = false;
			this.selectedSquare = null;
			this.selectedPiece = null;
			this.renderBoard();
			this.updateTurnInfo();
			if (this.aiEnabled && !this.isPaused) {
				this.scheduleNextMove(1000);
			}
		}, 10000);
	}

	makeAiMove() {
		if (this.gameOver || this.isPaused) return;

		// В режиме игрока бот ходит только за чёрных
		if (!this.aiEnabled && this.game.turn() === 'w') return;

		if (this.game.game_over()) {
			this.handleGameOver();
			return;
		}

		const bestMove = this.getBestMove();

		if (bestMove) {
			const moveObj = this.game.move(bestMove);
			this.highlightMove(moveObj.from, moveObj.to);

			setTimeout(() => {
				this.renderBoard();
				this.updateTurnInfo();
				if (!this.game.game_over()) {
					// В режиме "бот vs бот" продолжаем автоматически
					// В режиме "игрок vs бот" ждём хода игрока (белые)
					if (this.aiEnabled) {
						this.scheduleNextMove(this.options.moveDelay);
					}
				} else {
					this.handleGameOver();
				}
			}, 300);
		}
	}

	destroy() {
		if (this.moveTimeout) {
			clearTimeout(this.moveTimeout);
		}
		if (this.container && this.container.parentElement) {
			this.container.parentElement.removeChild(this.container);
		}
		this.game = null;
		this.gameOver = true;
	}
}