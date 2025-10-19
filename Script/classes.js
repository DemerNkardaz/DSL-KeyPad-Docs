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
			'start_warning': 'Начать/Приостановить игру. Просчёт ходов может вызывать подвисание',
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
			'start_warning': 'Start/Pause game. Calculating moves may cause lag',
			'ai_battleground': '[Green] both teams control the bot, [Red] white controls the player',
			'unicode': 'All pieces on the board are represented by Unicode characters'
		}
	}

	chessBoardClasses = [
		'game-finished',
		'won',
		'won-white',
		'won-blue',
		'lost',
		'draw',
	];

	restartTime = 10;
	restartInterval = null;

	setRestartTimer(element, parent) {
		if (this.restartInterval === null) {
			parent.style.display = '';
			element.textContent = `${this.restartTime}…`;
			this.restartInterval = setInterval(() => {
				this.restartTime--;
				if (this.restartTime <= 0) {
					clearInterval(this.restartInterval);
					this.restartInterval = null;
					this.restartTime = 10;
					parent.style.display = 'none';
				} else {
					element.textContent = `${this.restartTime}…`;
				}
			}, 1000);
		}
	}

	resetRestartTimer(element, parent) {
		if (this.restartInterval !== null) {
			clearInterval(this.restartInterval);
			this.restartInterval = null;
			this.restartTime = 10;
			parent.style.display = 'none';
			element.textContent = '';
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
		
		this.turnElement = document.createElement('div');
		this.turnElement.className = 'chess-turn-info';
		this.turnElement.style.fontSize = `${20 * s}px`;
		
		const emptyCell = document.createElement('div');
		
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

		this.startPauseButton = document.createElement('button');
		this.startPauseButton.className = 'chess-btn chess-side-btn';

		this.startPauseButtonIcon = document.createElement('img');
		this.startPauseButtonIcon.className = 'invert';
		this.startPauseButtonIcon.src = './Media/SVG/Flat_Icons/flat_start.svg';
		this.startPauseButton.appendChild(this.startPauseButtonIcon);
		
		this.startPauseButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['start_warning']);
		this.startPauseButton.addEventListener('click', () => this.togglePause());

		this.unicodePageButton = document.createElement('a');
		this.unicodePageButton.className = 'chess-btn chess-side-btn chess-side-btn-squared';
		this.unicodePageButton.innerHTML = `<img src="./Media/SVG/Flat_Icons/unicode_logo.svg"></img>`;
		this.unicodePageButton.setAttribute('href', 'https://home.unicode.org');
		this.unicodePageButton.setAttribute('target', '_blank');
		this.unicodePageButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['unicode']);
		
		sideButtonsContainer.appendChild(this.resetButton);
		sideButtonsContainer.appendChild(this.startPauseButton);
		sideButtonsContainer.appendChild(this.playAIButton);
		sideButtonsContainer.appendChild(this.unicodePageButton);
		
		this.boardWrapper = document.createElement('div');
		this.boardWrapper.className = 'chess-board-wrapper';
		this.boardWrapper.appendChild(this.boardElement);

		this.chessOnBoardStatus = document.createElement('div');
		this.chessOnBoardStatus.className = 'chess-on-board-status';
		this.chessOnBoardStatus.style.display = 'none';
		this.chessOnBoardStatus.style.fontSize = `${3 * s}rem`;
		
		this.restartTimer = document.createElement('div');
		this.restartTimer.className = 'chess-timer';
		this.restartTimer.style.fontSize = `${3 * s}rem`;
		this.chessOnBoardStatus.appendChild(this.restartTimer);

		this.gameOverStatus = document.createElement('div');
		this.gameOverStatus.className = 'chess-game-over-status';
		this.gameOverStatus.style.fontSize = `${2 * s}rem`;
		this.chessOnBoardStatus.appendChild(this.gameOverStatus);

		this.boardWrapper.appendChild(this.chessOnBoardStatus);
		
		this.container.appendChild(this.boardWrapper);
		this.container.appendChild(infoContainer);
		this.container.appendChild(sideButtonsContainer);
		this.parentElement.appendChild(this.container);
	}

	togglePause() {
		if (this.isPaused) {
			this.startPauseButtonIcon.src = './Media/SVG/Flat_Icons/flat_pause.svg';
			this.start();
		} else {
			this.startPauseButtonIcon.src = './Media/SVG/Flat_Icons/flat_start.svg';
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

		this.resetRestartTimer(this.restartTimer, this.chessOnBoardStatus);

		
		// Если игра была запущена и AI включен, продолжаем
		if (!this.isPaused && this.aiEnabled) {
			this.scheduleNextMove(1000);
		}

		this.boardElement.classList.remove(...this.chessBoardClasses);
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
		if (this.moveTimeout) {
			clearTimeout(this.moveTimeout);
			this.moveTimeout = null;
		}
	}

	start() {
		if (!this.isPaused) return;
		this.isPaused = false;
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

	getAttackersOfSquare(targetSquare, attackerColor) {
		const attackers = [];
		const board = this.game.board();
		
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const square = this.getSquareNotation(row, col);
				const piece = board[row][col];
				
				if (!piece || piece.color !== attackerColor) continue;
				
				const attacks = this.getSquareAttacks(row, col, piece, board);
				if (attacks.has(targetSquare)) {
					attackers.push(square);
				}
			}
		}
		
		return attackers;
	}

	getSquareAttacks(row, col, piece, board) {
		const attacks = new Set();
		
		switch (piece.type) {
			case 'p': // Пешка
				if (piece.color === 'b') {
					if (row < 7) {
						if (col > 0) attacks.add(this.getSquareNotation(row + 1, col - 1));
						if (col < 7) attacks.add(this.getSquareNotation(row + 1, col + 1));
					}
				} else {
					if (row > 0) {
						if (col > 0) attacks.add(this.getSquareNotation(row - 1, col - 1));
						if (col < 7) attacks.add(this.getSquareNotation(row - 1, col + 1));
					}
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
						attacks.add(this.getSquareNotation(newRow, newCol));
					}
				});
				break;
				
			case 'b': // Слон
				this.addDiagonalAttacks(row, col, attacks, board);
				break;
				
			case 'r': // Ладья
				this.addStraightAttacks(row, col, attacks, board);
				break;
				
			case 'q': // Ферзь
				this.addDiagonalAttacks(row, col, attacks, board);
				this.addStraightAttacks(row, col, attacks, board);
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
						attacks.add(this.getSquareNotation(newRow, newCol));
					}
				});
				break;
		}
		
		return attacks;
	}

	getBlackAttackedSquares() {
		const attackedSquares = new Set();
		const board = this.game.board();
		
		for (let row = 0; row < 8; row++) {
			for (let col = 0; col < 8; col++) {
				const piece = board[row][col];
				if (!piece || piece.color !== 'b') continue;
				
				switch (piece.type) {
					case 'p': // Пешка
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
	
	addDiagonalAttacks(row, col, attackedSquares, board) {
		const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
		directions.forEach(([dr, dc]) => {
			let r = row + dr;
			let c = col + dc;
			while (r >= 0 && r < 8 && c >= 0 && c < 8) {
				attackedSquares.add(this.getSquareNotation(r, c));
				if (board[r][c]) break;
				r += dr;
				c += dc;
			}
		});
	}
	
	addStraightAttacks(row, col, attackedSquares, board) {
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		directions.forEach(([dr, dc]) => {
			let r = row + dr;
			let c = col + dc;
			while (r >= 0 && r < 8 && c >= 0 && c < 8) {
				attackedSquares.add(this.getSquareNotation(r, c));
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
		
		const possibleMoves = this.selectedSquare 
			? this.game.moves({ square: this.selectedSquare, verbose: true })
			: [];
		
		const possibleMovesSet = new Set(possibleMoves.map(m => m.to));
		
		const blackAttackedSquares = this.getBlackAttackedSquares();

		const attackersOfSelected = this.selectedSquare && blackAttackedSquares.has(this.selectedSquare)
			? new Set(this.getAttackersOfSquare(this.selectedSquare, 'b'))
			: new Set();

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
					} else if (attackersOfSelected.has(square)) {
						cell.classList.add('chess-cell-attacker-of-selected');
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
				cell.dataset.row = row;
				cell.dataset.col = col;

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

		const fromCell = this.boardElement.children[fromRank * 8 + fromFile];
		const toCell = this.boardElement.children[toRank * 8 + toFile];
		const piece = fromCell.querySelector('.chess-piece');

		if (piece) {
			// Calculate the difference in position
			const deltaX = (toFile - fromFile) * 60 * this.options.scale;
			const deltaY = (toRank - fromRank) * 60 * this.options.scale;

			// Animate the piece
			piece.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
			piece.style.zIndex = '1';

			// After animation, update the board
			setTimeout(() => {
				this.renderBoard();
			}, 300);
		}

		// Highlight effect
		fromCell.classList.add('chess-cell-highlight');
		toCell.classList.add('chess-cell-highlight');

		setTimeout(() => {
			fromCell.classList.remove('chess-cell-highlight');
			toCell.classList.remove('chess-cell-highlight');
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
		this.boardElement.classList.add('game-finished')
		
		if (this.game.in_checkmate()) {
			const winner = this.game.turn() === 'w' ? this.locales[lang]['black'] : this.locales[lang]['white'];
			statusText = this.locales[lang]['win'] + winner;

		if (this.game.turn() === 'w') {
			this.boardElement.classList.add(!this.aiEnabled ? 'lost' : 'won-blue');
		} else {
			this.boardElement.classList.add(!this.aiEnabled ? 'won' : 'won-white');
		}

		} else if (this.game.in_stalemate()) {
			this.boardElement.classList.add('draw')
			statusText = this.locales[lang]['stalemate'];

		} else if (this.game.in_draw()) {
			this.boardElement.classList.add('draw')
			statusText = this.locales[lang]['draw'];
		}

		this.gameOverStatus.textContent = statusText;

		this.setRestartTimer(this.restartTimer, this.chessOnBoardStatus);

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
			
			this.boardElement.classList.remove(...this.chessBoardClasses);
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

class AutoXiangqi {
	locales = {
		'ru-RU': {
			'red': 'Красные',
			'black': 'Чёрные',
			'turn': 'Ход: ',
			'check': 'Шах: ',
			'win': 'Мат! Победа: ',
			'stalemate': 'Пат! Ничья',
			'draw': 'Ничья',
			'pause': 'Пауза',
			'start': 'Старт',
			'start_warning': 'Начать/Приостановить игру. Просчёт ходов может вызывать подвисание',
			'ai_battleground': '[Зелёный] обеими командами управляет бот, [Красный] красными управляет игрок',
			'unicode': 'Все фигуры на доске представлены символами Unicode'
		},
		'en-US': {
			'red': 'Red',
			'black': 'Black',
			'turn': 'Turn: ',
			'check': 'Check: ',
			'win': 'Checkmate! Winner: ',
			'stalemate': 'Stalemate! Draw',
			'draw': 'Draw',
			'pause': 'Pause',
			'start': 'Start',
			'start_warning': 'Start/Pause game. Calculating moves may cause lag',
			'ai_battleground': '[Green] both teams control the bot, [Red] red controls the player',
			'unicode': 'All pieces on the board are represented by Unicode characters'
		}
	}

	xiangqiBoardClasses = [
		'game-finished',
		'won',
		'won-red',
		'won-black',
		'lost',
		'draw',
	];

	restartTime = 10;
	restartInterval = null;

	setRestartTimer(element, parent) {
		if (this.restartInterval === null) {
			parent.style.display = '';
			element.textContent = `${this.restartTime}…`;
			this.restartInterval = setInterval(() => {
				this.restartTime--;
				if (this.restartTime <= 0) {
					clearInterval(this.restartInterval);
					this.restartInterval = null;
					this.restartTime = 10;
					parent.style.display = 'none';
				} else {
					element.textContent = `${this.restartTime}…`;
				}
			}, 1000);
		}
	}

	resetRestartTimer(element, parent) {
		if (this.restartInterval !== null) {
			clearInterval(this.restartInterval);
			this.restartInterval = null;
			this.restartTime = 10;
			parent.style.display = 'none';
			element.textContent = '';
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
			'rk': '\uD83E\uDE60', 'ra': '\uD83E\uDE61', 'rb': '\uD83E\uDE62', 'rn': '\uD83E\uDE63', 'rr': '\uD83E\uDE64', 'rc': '\uD83E\uDE65', 'rp': '\uD83E\uDE66',
			'bk': '\uD83E\uDE67', 'ba': '\uD83E\uDE68', 'bb': '\uD83E\uDE69', 'bn': '\uD83E\uDE6A', 'br': '\uD83E\uDE6B', 'bc': '\uD83E\uDE6C', 'bp': '\uD83E\uDE6D'
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

		this.loadXiangqiLibrary().then(() => {
			this.init();
		});
	}

	loadXiangqiLibrary() {
		return new Promise((resolve, reject) => {
			if (typeof Xiangqi !== 'undefined') {
				resolve();
				return;
			}

			const existingScript = document.querySelector('script[src*="xiangqi"]');
			if (existingScript) {
				existingScript.addEventListener('load', resolve);
				existingScript.addEventListener('error', reject);
				return;
			}

			const script = document.createElement('script');
			script.src = './Script/xiangqi.min.js';
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);
		});
	}

	init() {
		this.game = new Xiangqi();
		this.aiEnabled = true;
		this.createUI();
		this.renderBoard();
		this.updateTurnInfo();
	}

	createUI() {
		const s = this.options.scale;
		
		this.container = document.createElement('div');
		this.container.className = 'xiangqi-container';
		this.container.style.padding = `${20 * s}px`;

		this.boardElement = document.createElement('div');
		this.boardElement.className = 'xiangqi-board';
		this.boardElement.style.gridTemplateColumns = `repeat(9, ${55 * s}px)`;
		this.boardElement.style.gridTemplateRows = `repeat(10, ${55 * s}px)`;
		this.boardElement.style.borderRadius = `${15 * s}px`;
		this.boardElement.style.marginBottom = `${15 * s}px`;

		const infoContainer = document.createElement('div');
		infoContainer.className = 'xiangqi-info-container';

		const sideButtonsContainer = document.createElement('div');
		sideButtonsContainer.className = 'xiangqi-side-buttons-container';
		
		this.resetButton = document.createElement('button');
		this.resetButton.className = 'xiangqi-btn xiangqi-side-btn';
		this.resetButton.innerHTML = `<img class="invert" src="./Media/SVG/Flat_Icons/flat_reload.svg"></img>`;
		this.resetButton.addEventListener('click', () => this.reset());

		this.playAIButton = document.createElement('button');
		this.playAIButton.className = 'xiangqi-btn xiangqi-side-btn xiangqi-side-btn-allowed';
		this.playAIButton.innerHTML = `<img class="invert" src="./Media/SVG/Flat_Icons/flat_robot.svg"></img>`;
		this.playAIButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['ai_battleground']);
		this.playAIButton.addEventListener('click', () => this.playAI());

		this.startPauseButton = document.createElement('button');
		this.startPauseButton.className = 'xiangqi-btn xiangqi-side-btn';

		this.startPauseButtonIcon = document.createElement('img');
		this.startPauseButtonIcon.className = 'invert';
		this.startPauseButtonIcon.src = './Media/SVG/Flat_Icons/flat_start.svg';
		this.startPauseButton.appendChild(this.startPauseButtonIcon);
		
		this.startPauseButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['start_warning']);
		this.startPauseButton.addEventListener('click', () => this.togglePause());

		this.currentTurnTeam = document.createElement('div');
		this.currentTurnTeam.className = 'xiangqi-btn xiangqi-side-btn xiangqi-piece-turn-wrapper xiangqi-piece-wrapper-red';
		
		this.currentTurnTeamSpan = document.createElement('span');
		this.currentTurnTeamSpan.className = 'xiangqi-piece';
		this.currentTurnTeamSpan.style.fontSize = `${42 * s}px`;
		this.currentTurnTeamSpan.innerHTML = '\uD83E\uDE60';
		this.currentTurnTeam.appendChild(this.currentTurnTeamSpan);

		this.unicodePageButton = document.createElement('a');
		this.unicodePageButton.className = 'xiangqi-btn xiangqi-side-btn xiangqi-side-btn-squared';
		this.unicodePageButton.innerHTML = `<img src="./Media/SVG/Flat_Icons/unicode_logo.svg"></img>`;
		this.unicodePageButton.setAttribute('href', 'https://home.unicode.org');
		this.unicodePageButton.setAttribute('target', '_blank');
		this.unicodePageButton.setAttribute('title', this.locales[typeof language !== 'undefined' ? language : 'en-US']['unicode']);
		
		sideButtonsContainer.appendChild(this.resetButton);
		sideButtonsContainer.appendChild(this.startPauseButton);
		sideButtonsContainer.appendChild(this.playAIButton);
		sideButtonsContainer.appendChild(this.currentTurnTeam);
		sideButtonsContainer.appendChild(this.unicodePageButton);
		
		this.boardWrapper = document.createElement('div');
		this.boardWrapper.className = 'xiangqi-board-wrapper';
		this.boardWrapper.appendChild(this.boardElement);

		this.xiangqiOnBoardStatus = document.createElement('div');
		this.xiangqiOnBoardStatus.className = 'xiangqi-on-board-status';
		this.xiangqiOnBoardStatus.style.display = 'none';
		this.xiangqiOnBoardStatus.style.fontSize = `${3 * s}rem`;
		
		this.restartTimer = document.createElement('div');
		this.restartTimer.className = 'xiangqi-timer';
		this.restartTimer.style.fontSize = `${3 * s}rem`;
		this.xiangqiOnBoardStatus.appendChild(this.restartTimer);

		this.gameOverStatus = document.createElement('div');
		this.gameOverStatus.className = 'xiangqi-game-over-status';
		this.gameOverStatus.style.fontSize = `${2 * s}rem`;
		this.xiangqiOnBoardStatus.appendChild(this.gameOverStatus);

		this.boardWrapper.appendChild(this.xiangqiOnBoardStatus);
		
		this.container.appendChild(this.boardWrapper);
		this.container.appendChild(sideButtonsContainer);
		this.parentElement.appendChild(this.container);
	}

	switchCurrentTurnTeam(teamColor) {
		this.currentTurnTeam.classList.remove(`xiangqi-piece-wrapper-${teamColor === 'r' ? 'black' : 'red'}`);
		this.currentTurnTeam.classList.add(`xiangqi-piece-wrapper-${teamColor === 'r' ? 'red' : 'black'}`);

		this.currentTurnTeamSpan.innerHTML = teamColor === 'r' ? '\uD83E\uDE60' : '\uD83E\uDE67';
	}

	togglePause() {
		if (this.isPaused) {
			this.startPauseButtonIcon.src = './Media/SVG/Flat_Icons/flat_pause.svg';
			this.start();
		} else {
			this.startPauseButtonIcon.src = './Media/SVG/Flat_Icons/flat_start.svg';
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

		this.resetRestartTimer(this.restartTimer, this.xiangqiOnBoardStatus);

		if (!this.isPaused && this.aiEnabled) {
			this.scheduleNextMove(1000);
		}

		this.boardElement.classList.remove(...this.xiangqiBoardClasses);
	}

	playAI() {
		if (this.aiEnabled) {
			this.aiEnabled = false;
			this.playAIButton.classList.remove('xiangqi-side-btn-allowed');
			this.playAIButton.classList.add('xiangqi-side-btn-restricted');
			
			this.selectedSquare = null;
			this.selectedPiece = null;
			this.renderBoard();
		} else {
			this.aiEnabled = true;
			this.playAIButton.classList.add('xiangqi-side-btn-allowed');
			this.playAIButton.classList.remove('xiangqi-side-btn-restricted');
			
			this.selectedSquare = null;
			this.selectedPiece = null;
			this.renderBoard();
			
			if (!this.isPaused && this.game.turn() === 'r') {
				this.scheduleNextMove(100);
			}
		}
	}

	pause() {
		if (this.isPaused) return;
		this.isPaused = true;
		if (this.moveTimeout) {
			clearTimeout(this.moveTimeout);
			this.moveTimeout = null;
		}
	}

	start() {
		if (!this.isPaused) return;
		this.isPaused = false;
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
		const color = piece.color === 'r' ? 'r' : 'b';
		const type = piece.type.toLowerCase();
		return this.unicodePieces[color + type] || '';
	}

	getSquareNotation(row, col) {
		const file = col; // 0-8
		const rank = row; // 0-9
		return String.fromCharCode(97 + file) + rank;
	}

	handleCellClick(row, col, cell) {
		if (this.aiEnabled || this.gameOver || this.game.turn() !== 'r') return;
		
		const square = this.getSquareNotation(row, col);
		const piece = this.game.get(square);
		
		if (!this.selectedSquare) {
			if (piece && piece.color === 'r') {
				this.selectedSquare = square;
				this.selectedPiece = piece;
				this.renderBoardWithHighlights();
			}
		} else {
			const move = this.game.move({
				from: this.selectedSquare,
				to: square
			});
			
			if (move) {
				this.selectedSquare = null;
				this.selectedPiece = null;
				
				this.highlightMove(move.from, move.to);
				
				setTimeout(() => {
					this.renderBoard();
					this.updateTurnInfo();
					
					if (this.game.game_over()) {
						this.handleGameOver();
					} else if (!this.isPaused) {
						setTimeout(() => this.makeAiMove(), this.options.moveDelay);
					}
				}, 400);
			} else {
				if (piece && piece.color === 'r') {
					this.selectedSquare = square;
					this.selectedPiece = piece;
					this.renderBoardWithHighlights();
				} else {
					this.selectedSquare = null;
					this.selectedPiece = null;
					this.renderBoard();
				}
			}
		}
	}

	// Получаем все фигуры, атакующие конкретную клетку (для сянци)
getAttackersOfSquareXiangqi(targetSquare, attackerColor) {
	const attackers = [];
	
	for (let row = 0; row < 10; row++) {
		for (let col = 0; col < 9; col++) {
			const square = this.getSquareNotation(row, col);
			const piece = this.game.get(square);
			
			if (!piece || piece.color !== attackerColor) continue;
			
			// Проверяем, атакует ли эта фигура целевую клетку
			const attacks = this.getSquareAttacksXiangqi(row, col, piece);
			if (attacks.has(targetSquare)) {
				attackers.push(square);
			}
		}
	}
	
	return attackers;
}

	getSquareAttacksXiangqi(row, col, piece) {
		const attacks = new Set();
		
		switch (piece.type) {
			case 'p': // Пешка
				if (piece.color === 'b') {
					if (row < 9) {
						attacks.add(this.getSquareNotation(row + 1, col));
					}
					if (row >= 5) {
						if (col > 0) attacks.add(this.getSquareNotation(row, col - 1));
						if (col < 8) attacks.add(this.getSquareNotation(row, col + 1));
					}
				} else {
					if (row > 0) {
						attacks.add(this.getSquareNotation(row - 1, col));
					}
					if (row <= 4) {
						if (col > 0) attacks.add(this.getSquareNotation(row, col - 1));
						if (col < 8) attacks.add(this.getSquareNotation(row, col + 1));
					}
				}
				break;
				
			case 'c': // Пушка
				const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
				directions.forEach(([dr, dc]) => {
					let r = row + dr;
					let c = col + dc;
					let foundScreen = false;
					
					while (r >= 0 && r < 10 && c >= 0 && c < 9) {
						const square = this.getSquareNotation(r, c);
						const p = this.game.get(square);
						
						if (!foundScreen) {
							if (p) foundScreen = true;
						} else {
							if (p) {
								attacks.add(square);
								break;
							}
						}
						
						r += dr;
						c += dc;
					}
				});
				break;
				
			case 'n': // Конь
				const horseMoves = [
					{ dr: -2, dc: -1, blockR: -1, blockC: 0 },
					{ dr: -2, dc: 1, blockR: -1, blockC: 0 },
					{ dr: -1, dc: -2, blockR: 0, blockC: -1 },
					{ dr: -1, dc: 2, blockR: 0, blockC: 1 },
					{ dr: 1, dc: -2, blockR: 0, blockC: -1 },
					{ dr: 1, dc: 2, blockR: 0, blockC: 1 },
					{ dr: 2, dc: -1, blockR: 1, blockC: 0 },
					{ dr: 2, dc: 1, blockR: 1, blockC: 0 }
				];
				
				horseMoves.forEach(({ dr, dc, blockR, blockC }) => {
					const newRow = row + dr;
					const newCol = col + dc;
					
					if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
						const blockingSquare = this.getSquareNotation(row + blockR, col + blockC);
						const blocking = this.game.get(blockingSquare);
						
						if (!blocking) {
							attacks.add(this.getSquareNotation(newRow, newCol));
						}
					}
				});
				break;
				
			case 'r': // Ладья
				const chariotDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
				chariotDirs.forEach(([dr, dc]) => {
					let r = row + dr;
					let c = col + dc;
					
					while (r >= 0 && r < 10 && c >= 0 && c < 9) {
						const square = this.getSquareNotation(r, c);
						attacks.add(square);
						
						if (this.game.get(square)) break;
						
						r += dr;
						c += dc;
					}
				});
				break;
				
			case 'a': // Советник
				const advisorMoves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
				advisorMoves.forEach(([dr, dc]) => {
					const newRow = row + dr;
					const newCol = col + dc;
					
					if (piece.color === 'b') {
						if (newRow >= 0 && newRow <= 2 && newCol >= 3 && newCol <= 5) {
							attacks.add(this.getSquareNotation(newRow, newCol));
						}
					} else {
						if (newRow >= 7 && newRow <= 9 && newCol >= 3 && newCol <= 5) {
							attacks.add(this.getSquareNotation(newRow, newCol));
						}
					}
				});
				break;
				
			case 'b': // Слон
				const elephantMoves = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
				elephantMoves.forEach(([dr, dc]) => {
					const newRow = row + dr;
					const newCol = col + dc;
					
					const validRange = piece.color === 'b' 
						? (newRow >= 0 && newRow <= 4)
						: (newRow >= 5 && newRow <= 9);
					
					if (validRange && newCol >= 0 && newCol < 9) {
						const midRow = row + dr / 2;
						const midCol = col + dc / 2;
						const blocking = this.game.get(this.getSquareNotation(midRow, midCol));
						
						if (!blocking) {
							attacks.add(this.getSquareNotation(newRow, newCol));
						}
					}
				});
				break;
				
			case 'k': // Генерал
				const kingMoves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
				kingMoves.forEach(([dr, dc]) => {
					const newRow = row + dr;
					const newCol = col + dc;
					
					if (piece.color === 'b') {
						if (newRow >= 0 && newRow <= 2 && newCol >= 3 && newCol <= 5) {
							attacks.add(this.getSquareNotation(newRow, newCol));
						}
					} else {
						if (newRow >= 7 && newRow <= 9 && newCol >= 3 && newCol <= 5) {
							attacks.add(this.getSquareNotation(newRow, newCol));
						}
					}
				});
				break;
		}
		
		return attacks;
	}

	getBlackAttackedSquares() {
		const attackedSquares = new Set();
		
		for (let row = 0; row < 10; row++) {
			for (let col = 0; col < 9; col++) {
				const square = this.getSquareNotation(row, col);
				const piece = this.game.get(square);
				
				if (!piece || piece.color !== 'b') continue;
				
				switch (piece.type) {
					case 'p':
						if (row < 9) {
							attackedSquares.add(this.getSquareNotation(row + 1, col));
						}
						if (row >= 5) {
							if (col > 0) attackedSquares.add(this.getSquareNotation(row, col - 1));
							if (col < 8) attackedSquares.add(this.getSquareNotation(row, col + 1));
						}
						break;
						
					case 'c':
						this.addCannonAttacks(row, col, attackedSquares);
						break;
						
					case 'n': // Конь (horse)
						this.addHorseAttacks(row, col, attackedSquares);
						break;
						
					case 'r':
						this.addChariotAttacks(row, col, attackedSquares);
						break;
						
					case 'a':
						const advisorMoves = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
						advisorMoves.forEach(([dr, dc]) => {
							const newRow = row + dr;
							const newCol = col + dc;
							if (newRow >= 0 && newRow <= 2 && newCol >= 3 && newCol <= 5) {
								attackedSquares.add(this.getSquareNotation(newRow, newCol));
							}
						});
						break;
						
					case 'b':
						const elephantMoves = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
						elephantMoves.forEach(([dr, dc]) => {
							const newRow = row + dr;
							const newCol = col + dc;
							if (newRow >= 0 && newRow <= 4 && newCol >= 0 && newCol < 9) {
								const midRow = row + dr / 2;
								const midCol = col + dc / 2;
								const blocking = this.game.get(this.getSquareNotation(midRow, midCol));
								if (!blocking) {
									attackedSquares.add(this.getSquareNotation(newRow, newCol));
								}
							}
						});
						break;
						
					case 'k':
						const kingMoves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
						kingMoves.forEach(([dr, dc]) => {
							const newRow = row + dr;
							const newCol = col + dc;
							if (newRow >= 0 && newRow <= 2 && newCol >= 3 && newCol <= 5) {
								attackedSquares.add(this.getSquareNotation(newRow, newCol));
							}
						});
						break;
				}
			}
		}
		
		return attackedSquares;
	}
	
	addCannonAttacks(row, col, attackedSquares) {
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		directions.forEach(([dr, dc]) => {
			let r = row + dr;
			let c = col + dc;
			let foundScreen = false;
			
			while (r >= 0 && r < 10 && c >= 0 && c < 9) {
				const square = this.getSquareNotation(r, c);
				const piece = this.game.get(square);
				
				if (!foundScreen) {
					if (piece) {
						foundScreen = true;
					}
				} else {
					if (piece) {
						attackedSquares.add(square);
						break;
					}
				}
				
				r += dr;
				c += dc;
			}
		});
	}
	
	addHorseAttacks(row, col, attackedSquares) {
		const horseMoves = [
			{ dr: -2, dc: -1, blockR: -1, blockC: 0 },
			{ dr: -2, dc: 1, blockR: -1, blockC: 0 },
			{ dr: -1, dc: -2, blockR: 0, blockC: -1 },
			{ dr: -1, dc: 2, blockR: 0, blockC: 1 },
			{ dr: 1, dc: -2, blockR: 0, blockC: -1 },
			{ dr: 1, dc: 2, blockR: 0, blockC: 1 },
			{ dr: 2, dc: -1, blockR: 1, blockC: 0 },
			{ dr: 2, dc: 1, blockR: 1, blockC: 0 }
		];
		
		horseMoves.forEach(({ dr, dc, blockR, blockC }) => {
			const newRow = row + dr;
			const newCol = col + dc;
			
			if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9) {
				const blockingSquare = this.getSquareNotation(row + blockR, col + blockC);
				const blocking = this.game.get(blockingSquare);
				
				if (!blocking) {
					attackedSquares.add(this.getSquareNotation(newRow, newCol));
				}
			}
		});
	}
	
	addChariotAttacks(row, col, attackedSquares) {
		const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
		directions.forEach(([dr, dc]) => {
			let r = row + dr;
			let c = col + dc;
			
			while (r >= 0 && r < 10 && c >= 0 && c < 9) {
				const square = this.getSquareNotation(r, c);
				attackedSquares.add(square);
				
				// Останавливаемся если встретили фигуру
				if (this.game.get(square)) break;
				
				r += dr;
				c += dc;
			}
		});
	}

	renderBoardWithHighlights() {
		this.boardElement.innerHTML = '';
		const s = this.options.scale;
		
		const possibleMoves = this.selectedSquare 
			? this.game.moves({ square: this.selectedSquare, verbose: true })
			: [];
		
		const possibleMovesSet = new Set(possibleMoves.map(m => m.to));
		const blackAttackedSquares = this.getBlackAttackedSquares();

		const attackersOfSelected = this.selectedSquare && blackAttackedSquares.has(this.selectedSquare)
			? new Set(this.getAttackersOfSquareXiangqi(this.selectedSquare, 'b'))
			: new Set();

		for (let row = 0; row < 10; row++) {
			for (let col = 0; col < 9; col++) {
				const cell = document.createElement('div');
				cell.className = 'xiangqi-cell';
				cell.style.width = `${55 * s}px`;
				cell.style.height = `${55 * s}px`;
				cell.style.fontSize = `${35 * s}px`;

				const square = this.getSquareNotation(row, col);
				const piece = this.game.get(square);
				
				if (!this.aiEnabled) {
					cell.style.cursor = 'pointer';
					cell.addEventListener('click', () => this.handleCellClick(row, col, cell));
				}
				
				if (this.selectedSquare) {
					if (square === this.selectedSquare) {
						const isUnderAttack = blackAttackedSquares.has(square);
						if (isUnderAttack) {
							cell.classList.add('xiangqi-cell-selected-under-attack');
						} else {
							cell.classList.add('xiangqi-cell-selected');
						}
					} else if (attackersOfSelected.has(square)) {
						cell.classList.add('xiangqi-cell-attacker-of-selected');
					} else if (possibleMovesSet.has(square)) {
						const isAttack = piece && piece.color === 'b';
						const isHazardous = blackAttackedSquares.has(square);
						
						if (isAttack && isHazardous) {
							cell.classList.add('xiangqi-cell-attackable-hazardous');
						} else if (isAttack) {
							cell.classList.add('xiangqi-cell-attackable');
						} else if (isHazardous) {
							cell.classList.add('xiangqi-cell-hazardous');
						} else {
							cell.classList.add('xiangqi-cell-highlight');
						}
					} else {
						cell.classList.add('xiangqi-cell-unreachable');
					}
				}

				if (piece) {
					const pieceWrapper = document.createElement('div');
					pieceWrapper.className = `xiangqi-piece-wrapper xiangqi-piece-wrapper-${piece.color === 'r' ? 'red' : 'black'}`;
					
					const pieceSpan = document.createElement('span');
					pieceSpan.className = `xiangqi-piece xiangqi-piece-${piece.color === 'r' ? 'red' : 'black'}`;
					pieceSpan.style.fontSize = `${35 * s}px`;
					pieceSpan.textContent = this.pieceToUnicode(piece);
					
					pieceWrapper.appendChild(pieceSpan);
					cell.appendChild(pieceWrapper);
				}

				this.boardElement.appendChild(cell);
			}
		}
	}

	renderBoard() {
		this.boardElement.innerHTML = '';
		const s = this.options.scale;

		for (let row = 0; row < 10; row++) {
			for (let col = 0; col < 9; col++) {
				const cell = document.createElement('div');
				cell.className = 'xiangqi-cell';
				cell.style.width = `${55 * s}px`;
				cell.style.height = `${55 * s}px`;
				cell.style.fontSize = `${35 * s}px`;
				cell.dataset.row = row;
				cell.dataset.col = col;

				if (!this.aiEnabled) {
					cell.style.cursor = 'pointer';
					cell.addEventListener('click', () => this.handleCellClick(row, col, cell));
				}

				const square = this.getSquareNotation(row, col);
				const piece = this.game.get(square);
				
				if (piece) {
					const pieceWrapper = document.createElement('div');
					pieceWrapper.className = `xiangqi-piece-wrapper xiangqi-piece-wrapper-${piece.color === 'r' ? 'red' : 'black'}`;
					
					const pieceSpan = document.createElement('span');
					pieceSpan.className = `xiangqi-piece xiangqi-piece-${piece.color === 'r' ? 'red' : 'black'}`;
					pieceSpan.style.fontSize = `${35 * s}px`;
					pieceSpan.textContent = this.pieceToUnicode(piece);
					
					pieceWrapper.appendChild(pieceSpan);
					cell.appendChild(pieceWrapper);
				}

				this.boardElement.appendChild(cell);
			}
		}
	}

	highlightMove(from, to) {
		const fromCol = from.charCodeAt(0) - 97;
		const fromRow = parseInt(from.substring(1));
		const toCol = to.charCodeAt(0) - 97;
		const toRow = parseInt(to.substring(1));

		const fromCell = this.boardElement.children[fromRow * 9 + fromCol];
		const toCell = this.boardElement.children[toRow * 9 + toCol];
		const pieceWrapper = fromCell.querySelector('.xiangqi-piece-wrapper');


		if (pieceWrapper) {
			const deltaX = (toCol - fromCol) * 55 * this.options.scale;
			const deltaY = (toRow - fromRow) * 55 * this.options.scale;

			pieceWrapper.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
			pieceWrapper.style.zIndex = '1';

			setTimeout(() => {
				this.renderBoard();
			}, 400);
		}

		fromCell.classList.add('xiangqi-cell-highlight');
		toCell.classList.add('xiangqi-cell-highlight');

		setTimeout(() => {
			fromCell.classList.remove('xiangqi-cell-highlight');
			toCell.classList.remove('xiangqi-cell-highlight');
		}, 400);
	}

	updateTurnInfo() {
		const turn = this.game.turn();
		const lang = typeof language !== 'undefined' ? language : 'en-US';
		const turnColor = turn === 'r' ? this.locales[lang]['red'] : this.locales[lang]['black'];
		const turnPiece = turn === 'r' ? '\uD83E\uDE60' : '\uD83E\uDE67';
		this.currentTurnTeam.setAttribute('title', `${this.locales[lang]['turn']} ${turnColor} ${turnPiece}`);
		this.switchCurrentTurnTeam(turn);
	}

	evaluatePosition() {
		const pieceValues = {
			p: 1, c: 4.5, n: 4, r: 9, a: 2, b: 2, k: 0
		};

		let score = 0;
		
		for (let row = 0; row < 10; row++) {
			for (let col = 0; col < 9; col++) {
				const square = this.getSquareNotation(row, col);
				const piece = this.game.get(square);
				
				if (piece) {
					const value = pieceValues[piece.type] || 0;
					score += piece.color === 'r' ? value : -value;
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
		let bestValue = this.game.turn() === 'r' ? -Infinity : Infinity;

		const shuffledMoves = moves.sort(() => Math.random() - 0.5);

		for (let move of shuffledMoves) {
			this.game.move(move);
			const value = this.minimax(this.options.aiDepth - 1, -Infinity, Infinity, this.game.turn() === 'r');
			this.game.undo();

			if (this.game.turn() === 'r') {
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
		this.boardElement.classList.add('game-finished')
		
		if (this.game.in_checkmate()) {
			const winner = this.game.turn() === 'r' ? this.locales[lang]['black'] : this.locales[lang]['red'];
			statusText = this.locales[lang]['win'] + winner;

			if (this.game.turn() === 'r') {
				this.boardElement.classList.add(!this.aiEnabled ? 'lost' : 'won-black');
			} else {
				this.boardElement.classList.add(!this.aiEnabled ? 'won' : 'won-red');
			}

		} else if (this.game.in_stalemate()) {
			this.boardElement.classList.add('draw')
			statusText = this.locales[lang]['stalemate'];

		} else if (this.game.in_draw()) {
			this.boardElement.classList.add('draw')
			statusText = this.locales[lang]['draw'];
		}

		this.gameOverStatus.textContent = statusText;

		this.setRestartTimer(this.restartTimer, this.xiangqiOnBoardStatus);

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
			
			this.boardElement.classList.remove(...this.xiangqiBoardClasses);
		}, 10000);
	}

	makeAiMove() {
		if (this.gameOver || this.isPaused) return;

		if (!this.aiEnabled && this.game.turn() === 'r') return;

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
					if (this.aiEnabled) {
						this.scheduleNextMove(this.options.moveDelay);
					}
				} else {
					this.handleGameOver();
				}
			}, 400);
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