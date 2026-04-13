const CELL = 52;
const COLS = 10;
const ROWS = 7;

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

const start = {
	col: 0,
	row: Math.floor(ROWS / 2)
};

const goal = {
	col: COLS - 1,
	row: Math.floor(ROWS / 2)
};

let state = {
	col: start.col,
	row: start.row
};

const minimumStepsToGoal = Math.abs(goal.col - start.col) + Math.abs(goal.row - start.row);

function buildGrid() {
	board.style.setProperty('--cell-size', CELL + 'px');
	board.style.setProperty('--cols', COLS);
	board.style.setProperty('--rows', ROWS);

	const fragment = document.createDocumentFragment();
	for (let i = 0; i < COLS * ROWS; i += 1) {
		const cell = document.createElement('div');
		cell.className = 'grid-cell';
		fragment.appendChild(cell);
	}
	arenaGrid.appendChild(fragment);
}

function setEntityPosition(el, col, row) {
	el.style.transform = 'translate(' + (col * CELL) + 'px,' + (row * CELL) + 'px)';
}

function clampToBoard(col, row) {
	return {
		col: Math.max(0, Math.min(COLS - 1, col)),
		row: Math.max(0, Math.min(ROWS - 1, row))
	};
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

	return {
		action,
		amount
	};
}

function hideErrorPanel() {
	errorPanel.classList.add('hidden');
	errorPanelMsg.textContent = '';
}

function showErrorPanel(command) {
	errorPanelMsg.textContent = 'A funcao "' + command + '" esta errada. Corrija o texto e tente novamente.';
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

	if (executedSteps <= minimumStepsToGoal + 3) {
		return 2;
	}

	return 1;
}

function showWinPanel(executedSteps) {
	const stars = calculateStars(executedSteps);
	winSummary.textContent = 'Voce concluiu em ' + executedSteps + ' passos e recebeu ' + stars + (stars === 1 ? ' estrela.' : ' estrelas.');
	starRating.classList.remove('stars-1', 'stars-2', 'stars-3');
	starRating.classList.add('stars-' + stars);
	winPanel.classList.remove('hidden');
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
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
	statusEl.textContent = 'Executando passo a passo...';
	let executedSteps = 0;

	const invalidLine = lines.find(line => {
		return !parseMovementCommand(line);
	});

	if (invalidLine) {
		runBtn.disabled = false;
		resetBtn.disabled = false;
		statusEl.className = 'status err';
		statusEl.textContent = 'Execucao cancelada: ha funcao invalida no prompt.';
		showErrorPanel(invalidLine);
		return;
	}

	for (const line of lines) {
		const parsed = parseMovementCommand(line);

		for (let step = 0; step < parsed.amount; step += 1) {
			if (state.col === goal.col && state.row === goal.row) {
				break;
			}

			let nextCol = state.col;
			let nextRow = state.row;

			if (parsed.action === 'moverdireita') {
				nextCol += 1;
			} else if (parsed.action === 'moveresquerda') {
				nextCol -= 1;
			} else if (parsed.action === 'movercima') {
				nextRow -= 1;
			} else if (parsed.action === 'moverbaixo') {
				nextRow += 1;
			}

			const bounded = clampToBoard(nextCol, nextRow);
			state.col = bounded.col;
			state.row = bounded.row;
			executedSteps += 1;
			draw();
			await wait(260);

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
		statusEl.textContent = 'Excelente! Voce chegou ao bloco objetivo.';
		showWinPanel(executedSteps);
		return;
	}

	state = { col: start.col, row: start.row };
	draw();
	statusEl.className = 'status err';
	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
	showFailPanel();
}

function resetBot() {
	hideErrorPanel();
	hideDocsPanel();
	hideWinPanel();
	hideFailPanel();
	state = { col: start.col, row: start.row };
	draw();
	statusEl.className = 'status';
	statusEl.textContent = 'Posicao resetada.';
}

runBtn.addEventListener('click', executeCommands);
resetBtn.addEventListener('click', resetBot);
docsBtn.addEventListener('click', showDocsPanel);
errorPanelClose.addEventListener('click', hideErrorPanel);
docsPanelClose.addEventListener('click', hideDocsPanel);
failPanelOk.addEventListener('click', hideFailPanel);

buildGrid();
resetBot();
