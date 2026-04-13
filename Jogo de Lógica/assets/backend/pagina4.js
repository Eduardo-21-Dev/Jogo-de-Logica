const CELL = 44;
const COLS = 13;
const ROWS = 11;

const board = document.getElementById('board');
const arenaGrid = document.getElementById('arenaGrid');
const botCell = document.getElementById('botCell');
const goalCell = document.getElementById('goalCell');
const cmdInput = document.getElementById('cmdInput');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const docsBtn = document.getElementById('docsBtn');
const statusEl = document.getElementById('status');
const errorPanel = document.getElementById('errorPanel');
const errorPanelMsg = document.getElementById('errorPanelMsg');
const errorPanelClose = document.getElementById('errorPanelClose');
const docsPanel = document.getElementById('docsPanel');
const docsPanelClose = document.getElementById('docsPanelClose');
const winPanel = document.getElementById('winPanel');
const winSummary = document.getElementById('winSummary');
const starRating = document.getElementById('starRating');
const failPanel = document.getElementById('failPanel');
const failPanelOk = document.getElementById('failPanelOk');

const maze = createComplexMaze();

const start = findSpecialCell('S');
const goal = findSpecialCell('G');

let state = {
	col: start.col,
	row: start.row
};

const minimumStepsToGoal = calculateMinimumSteps();

function createSeededRandom(seed) {
	let current = seed >>> 0;

	return function random() {
		current = (current * 1664525 + 1013904223) >>> 0;
		return current / 4294967296;
	};
}

function createComplexMaze() {
	const grid = [];
	for (let row = 0; row < ROWS; row += 1) {
		const line = [];
		for (let col = 0; col < COLS; col += 1) {
			line.push('#');
		}
		grid.push(line);
	}

	const random = createSeededRandom(4027);
	const stack = [{ col: 1, row: ROWS - 2 }];
	grid[ROWS - 2][1] = '.';

	while (stack.length) {
		const current = stack[stack.length - 1];
		const directions = [
			{ dc: 0, dr: -2 },
			{ dc: 2, dr: 0 },
			{ dc: 0, dr: 2 },
			{ dc: -2, dr: 0 }
		];

		for (let i = directions.length - 1; i > 0; i -= 1) {
			const j = Math.floor(random() * (i + 1));
			const tmp = directions[i];
			directions[i] = directions[j];
			directions[j] = tmp;
		}

		let carved = false;

		for (const dir of directions) {
			const nextCol = current.col + dir.dc;
			const nextRow = current.row + dir.dr;

			if (nextCol <= 0 || nextCol >= COLS - 1 || nextRow <= 0 || nextRow >= ROWS - 1) {
				continue;
			}

			if (grid[nextRow][nextCol] !== '#') {
				continue;
			}

			grid[current.row + dir.dr / 2][current.col + dir.dc / 2] = '.';
			grid[nextRow][nextCol] = '.';
			stack.push({ col: nextCol, row: nextRow });
			carved = true;
			break;
		}

		if (!carved) {
			stack.pop();
		}
	}

	const startCell = { col: 1, row: ROWS - 2 };
	const goalCell = findFarthestWalkableCell(grid, startCell);

	grid[startCell.row][startCell.col] = 'S';
	grid[goalCell.row][goalCell.col] = 'G';

	return grid.map(line => line.join(''));
}

function findFarthestWalkableCell(grid, startCell) {
	const queue = [{ col: startCell.col, row: startCell.row, dist: 0 }];
	const visited = new Set([startCell.col + ',' + startCell.row]);
	let farthest = { col: startCell.col, row: startCell.row, dist: 0 };

	while (queue.length) {
		const current = queue.shift();
		if (current.dist > farthest.dist) {
			farthest = current;
		}

		const neighbors = [
			{ col: current.col + 1, row: current.row },
			{ col: current.col - 1, row: current.row },
			{ col: current.col, row: current.row + 1 },
			{ col: current.col, row: current.row - 1 }
		];

		for (const n of neighbors) {
			if (n.col <= 0 || n.col >= COLS - 1 || n.row <= 0 || n.row >= ROWS - 1) {
				continue;
			}

			if (grid[n.row][n.col] === '#') {
				continue;
			}

			const key = n.col + ',' + n.row;
			if (visited.has(key)) {
				continue;
			}

			visited.add(key);
			queue.push({ col: n.col, row: n.row, dist: current.dist + 1 });
		}
	}

	return { col: farthest.col, row: farthest.row };
}

function findSpecialCell(marker) {
	for (let row = 0; row < ROWS; row += 1) {
		const col = maze[row].indexOf(marker);
		if (col !== -1) {
			return { col, row };
		}
	}

	return { col: 1, row: 1 };
}

function buildGrid() {
	board.style.setProperty('--cell-size', CELL + 'px');
	board.style.setProperty('--cols', COLS);
	board.style.setProperty('--rows', ROWS);

	const fragment = document.createDocumentFragment();
	for (let row = 0; row < ROWS; row += 1) {
		for (let col = 0; col < COLS; col += 1) {
			const cell = document.createElement('div');
			const value = maze[row][col];
			cell.className = 'grid-cell';
			if (value === '#') {
				cell.classList.add('wall');
			}
			if (value === 'S') {
				cell.classList.add('start');
			}
			if (value === 'G') {
				cell.classList.add('goal');
			}
			fragment.appendChild(cell);
		}
	}
	arenaGrid.appendChild(fragment);
}

function setEntityPosition(el, col, row) {
	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
}

function isWalkable(col, row) {
	if (col < 0 || col >= COLS || row < 0 || row >= ROWS) {
		return false;
	}
	return maze[row][col] !== '#';
}

function draw() {
	setEntityPosition(botCell, state.col, state.row);
	setEntityPosition(goalCell, goal.col, goal.row);
}

function normalizeCommand(raw) {
	return raw.replace(/\s+/g, '').toLowerCase();
}

function parseMovementCommand(rawLine) {
	const cmd = normalizeCommand(rawLine);
	const match = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);

	if (!match) {
		return null;
	}

	const action = match[1];
	const amount = match[2] ? Number(match[2]) : 1;

	if (!Number.isInteger(amount) || amount < 1) {
		return null;
	}

	return { action, amount };
}

function hideErrorPanel() {
	errorPanel.classList.add('hidden');
	errorPanelMsg.textContent = '';
}

function showErrorPanel(command) {
	errorPanelMsg.textContent = 'Comando invalido: "' + command + '". Revise e tente novamente.';
	errorPanel.classList.remove('hidden');
}

function hideDocsPanel() {
	docsPanel.classList.add('hidden');
}

function showDocsPanel() {
	docsPanel.classList.remove('hidden');
}

function hideWinPanel() {
	winPanel.classList.add('hidden');
	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
}

function hideFailPanel() {
	failPanel.classList.add('hidden');
}

function showFailPanel() {
	failPanel.classList.remove('hidden');
}

function calculateStars(executedSteps) {
	if (executedSteps <= minimumStepsToGoal) {
		return 3;
	}

	if (executedSteps <= minimumStepsToGoal + 2) {
		return 2;
	}

	return 1;
}

function showWinPanel(executedSteps, blockedMoves) {
	const stars = calculateStars(executedSteps);
	winSummary.textContent =
		'Voce venceu em ' +
		executedSteps +
		' passos, com ' +
		blockedMoves +
		' tentativa(s) contra parede, e ganhou ' +
		stars +
		(stars === 1 ? ' estrela.' : ' estrelas.');
	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
	starRating.classList.add('stars-' + stars);
	winPanel.classList.remove('hidden');
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function getNextPosition(action) {
	let nextCol = state.col;
	let nextRow = state.row;

	if (action === 'moverdireita') {
		nextCol += 1;
	} else if (action === 'moveresquerda') {
		nextCol -= 1;
	} else if (action === 'movercima') {
		nextRow -= 1;
	} else if (action === 'moverbaixo') {
		nextRow += 1;
	}

	return { col: nextCol, row: nextRow };
}

function calculateMinimumSteps() {
	const queue = [{ col: start.col, row: start.row, dist: 0 }];
	const visited = new Set([start.col + ',' + start.row]);

	while (queue.length) {
		const current = queue.shift();
		if (current.col === goal.col && current.row === goal.row) {
			return current.dist;
		}

		const neighbors = [
			{ col: current.col + 1, row: current.row },
			{ col: current.col - 1, row: current.row },
			{ col: current.col, row: current.row + 1 },
			{ col: current.col, row: current.row - 1 }
		];

		for (const n of neighbors) {
			const key = n.col + ',' + n.row;
			if (!visited.has(key) && isWalkable(n.col, n.row)) {
				visited.add(key);
				queue.push({ col: n.col, row: n.row, dist: current.dist + 1 });
			}
		}
	}

	return 999;
}

async function executeCommands() {
	hideErrorPanel();
	hideWinPanel();
	hideFailPanel();

	const lines = cmdInput.value
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);

	if (!lines.length) {
		statusEl.className = 'status err';
		statusEl.textContent = 'Digite ao menos um comando.';
		return;
	}

	runBtn.disabled = true;
	resetBtn.disabled = true;
	statusEl.className = 'status';
	statusEl.textContent = 'Executando no labirinto...';
	let executedSteps = 0;
	let blockedMoves = 0;

	const parsedLines = [];
	for (const line of lines) {
		const parsed = parseMovementCommand(line);
		if (!parsed) {
			runBtn.disabled = false;
			resetBtn.disabled = false;
			statusEl.className = 'status err';
			statusEl.textContent = 'Execucao cancelada: ha comando invalido no prompt.';
			showErrorPanel(line);
			return;
		}
		parsedLines.push(parsed);
	}

	for (const parsed of parsedLines) {
		for (let step = 0; step < parsed.amount; step += 1) {
			if (state.col === goal.col && state.row === goal.row) {
				break;
			}

			const next = getNextPosition(parsed.action);
			executedSteps += 1;

			if (isWalkable(next.col, next.row)) {
				state.col = next.col;
				state.row = next.row;
				draw();
			} else {
				blockedMoves += 1;
			}

			await wait(190);

			if (state.col === goal.col && state.row === goal.row) {
				break;
			}
		}

		if (state.col === goal.col && state.row === goal.row) {
			break;
		}
	}

	runBtn.disabled = false;
	resetBtn.disabled = false;

	if (state.col === goal.col && state.row === goal.row) {
		statusEl.className = 'status ok';
		statusEl.textContent = 'Excelente! Voce decifrou o labirinto.';
		showWinPanel(executedSteps, blockedMoves);
		return;
	}

	state = { col: start.col, row: start.row };
	draw();
	statusEl.className = 'status err';
	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
	showFailPanel();
}

function resetLesson() {
	hideErrorPanel();
	hideDocsPanel();
	hideWinPanel();
	hideFailPanel();
	state = { col: start.col, row: start.row };
	draw();
	statusEl.className = 'status';
	statusEl.textContent = 'Posicao resetada no inicio do labirinto.';
}

runBtn.addEventListener('click', executeCommands);
resetBtn.addEventListener('click', resetLesson);
docsBtn.addEventListener('click', showDocsPanel);
errorPanelClose.addEventListener('click', hideErrorPanel);
docsPanelClose.addEventListener('click', hideDocsPanel);
failPanelOk.addEventListener('click', hideFailPanel);

buildGrid();
resetLesson();
