const CELL = 52;
const COLS = 11;
const ROWS = 9;

const board = document.getElementById('board');
const arenaGrid = document.getElementById('arenaGrid');
const chipsLayer = document.getElementById('chipsLayer');
const botCell = document.getElementById('botCell');
const cmdInput = document.getElementById('cmdInput');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const docsBtn = document.getElementById('docsBtn');
const statusEl = document.getElementById('status');
const chipCounter = document.getElementById('chipCounter');
const errorPanel = document.getElementById('errorPanel');
const errorPanelMsg = document.getElementById('errorPanelMsg');
const errorPanelClose = document.getElementById('errorPanelClose');
const docsPanel = document.getElementById('docsPanel');
const docsPanelClose = document.getElementById('docsPanelClose');
const winPanel = document.getElementById('winPanel');
const winSummary = document.getElementById('winSummary');
const failPanel = document.getElementById('failPanel');
const failPanelOk = document.getElementById('failPanelOk');

const start = {
	col: Math.floor(COLS / 2),
	row: Math.floor(ROWS / 2)
};

const chips = [
	{ id: 0, col: start.col - 1, row: start.row - 1 },
	{ id: 1, col: start.col + 1, row: start.row - 1 },
	{ id: 2, col: start.col - 1, row: start.row + 1 },
	{ id: 3, col: start.col + 1, row: start.row + 1 }
];

let state = {
	col: start.col,
	row: start.row,
	collected: new Set()
};

const chipElements = new Map();

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
}

function hideFailPanel() {
	failPanel.classList.add('hidden');
}

function showFailPanel() {
	failPanel.classList.remove('hidden');
}

function showWinPanel(executedSteps) {
	winSummary.textContent = 'Voce coletou os 4 chips em ' + executedSteps + ' passos.';
	winPanel.classList.remove('hidden');
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function createChips() {
	chipsLayer.innerHTML = '';
	chipElements.clear();

	for (const chip of chips) {
		const chipCell = document.createElement('div');
		chipCell.className = 'chip-cell';
		chipCell.dataset.chipId = String(chip.id);

		const chipVisual = document.createElement('div');
		chipVisual.className = 'chip';
		chipCell.appendChild(chipVisual);

		setEntityPosition(chipCell, chip.col, chip.row);
		chipsLayer.appendChild(chipCell);
		chipElements.set(chip.id, chipCell);
	}
}

function updateChipCounter() {
	const collectedCount = state.collected.size;
	chipCounter.textContent = 'Chips coletados: ' + collectedCount + '/' + chips.length;
	chipCounter.classList.toggle('done', collectedCount === chips.length);
}

function collectChipAtCurrentPosition() {
	for (const chip of chips) {
		if (chip.col === state.col && chip.row === state.row && !state.collected.has(chip.id)) {
			state.collected.add(chip.id);
			const chipEl = chipElements.get(chip.id);
			if (chipEl) {
				chipEl.classList.add('collected');
			}
			updateChipCounter();
			break;
		}
	}
}

function draw() {
	setEntityPosition(botCell, state.col, state.row);
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
			if (state.collected.size === chips.length) {
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
			collectChipAtCurrentPosition();
			await wait(240);

			if (state.collected.size === chips.length) {
				break;
			}
		}

		if (state.collected.size === chips.length) {
			break;
		}
	}

	runBtn.disabled = false;
	resetBtn.disabled = false;

	if (state.collected.size === chips.length) {
		statusEl.className = 'status ok';
		statusEl.textContent = 'Perfeito! Voce coletou todos os chips.';
		showWinPanel(executedSteps);
		return;
	}

	state = {
		col: start.col,
		row: start.row,
		collected: new Set()
	};
	createChips();
	draw();
	collectChipAtCurrentPosition();
	updateChipCounter();
	statusEl.className = 'status err';
	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
	showFailPanel();
}

function resetLesson() {
	hideErrorPanel();
	hideDocsPanel();
	hideWinPanel();
	hideFailPanel();
	state = {
		col: start.col,
		row: start.row,
		collected: new Set()
	};
	createChips();
	draw();
	collectChipAtCurrentPosition();
	updateChipCounter();
	statusEl.className = 'status';
	statusEl.textContent = 'Posicao resetada. Boneco no centro.';
}

runBtn.addEventListener('click', executeCommands);
resetBtn.addEventListener('click', resetLesson);
docsBtn.addEventListener('click', showDocsPanel);
errorPanelClose.addEventListener('click', hideErrorPanel);
docsPanelClose.addEventListener('click', hideDocsPanel);
failPanelOk.addEventListener('click', hideFailPanel);

buildGrid();
resetLesson();