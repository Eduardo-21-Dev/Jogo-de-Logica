const CELL = 52;
const COLS = 11;
const ROWS = 9;

const tutorialPanel = document.getElementById('tutorialPanel');
const practicePanel = document.getElementById('practicePanel');
const startPracticeBtn = document.getElementById('startPracticeBtn');

const board = document.getElementById('board');
const arenaGrid = document.getElementById('arenaGrid');
const baseLayer = document.getElementById('baseLayer');
const packageLayer = document.getElementById('packageLayer');
const botCell = document.getElementById('botCell');
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
const failPanel = document.getElementById('failPanel');
const failPanelOk = document.getElementById('failPanelOk');

const startBot = { col: 1, row: ROWS - 2 };
const bases = [
	{ id: 'red', col: 8, row: 1, color: '#ef4444', name: 'Vermelha' },
	{ id: 'blue', col: 8, row: 3, color: '#3b82f6', name: 'Azul' },
	{ id: 'green', col: 8, row: 5, color: '#22c55e', name: 'Verde' }
];
const packages = [
	{ id: 'red', col: 2, row: 6, color: '#ef4444', delivered: false },
	{ id: 'blue', col: 4, row: 4, color: '#3b82f6', delivered: false },
	{ id: 'green', col: 6, row: 2, color: '#22c55e', delivered: false }
];

let state = {
	botCol: startBot.col,
	botRow: startBot.row,
	carryingPackageId: null,
	usedPickCommand: false,
	usedDropCommand: false
};

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
	setEntityPosition(botCell, state.botCol, state.botRow);

	for (const packageItem of packages) {
		const packageCell = document.querySelector('[data-package-id="' + packageItem.id + '"]');
		if (packageCell) {
			packageCell.classList.toggle('hidden', packageItem.delivered);
			if (!packageItem.delivered) {
				setEntityPosition(packageCell, packageItem.col, packageItem.row);
			}
		}
	}
}

function normalizeCommand(raw) {
	return raw.replace(/\s+/g, '').toLowerCase();
}

function parseCommand(rawLine) {
	const cmd = normalizeCommand(rawLine);

	if (cmd === 'pegar' || cmd === 'pegar()') {
		return { action: 'pegar', amount: 1 };
	}

	if (cmd === 'largar' || cmd === 'largar()') {
		return { action: 'largar', amount: 1 };
	}

	const moveMatch = cmd.match(/^(moverdireita|moveresquerda|movercima|moverbaixo)(?:\((\d+)\))?$/);
	if (!moveMatch) {
		return null;
	}

	const action = moveMatch[1];
	const amount = moveMatch[2] ? Number(moveMatch[2]) : 1;
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
}

function showWinPanel(executedSteps) {
	winSummary.textContent = 'Voce entregou todos os pacotes em ' + executedSteps + ' passos.';
	winPanel.classList.remove('hidden');
}

function hideFailPanel() {
	failPanel.classList.add('hidden');
}

function showFailPanel() {
	failPanel.classList.remove('hidden');
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function moveBot(action) {
	let nextCol = state.botCol;
	let nextRow = state.botRow;

	if (action === 'moverdireita') {
		nextCol += 1;
	} else if (action === 'moveresquerda') {
		nextCol -= 1;
	} else if (action === 'movercima') {
		nextRow -= 1;
	} else if (action === 'moverbaixo') {
		nextRow += 1;
	}

	const bounded = clampToBoard(nextCol, nextRow);
	state.botCol = bounded.col;
	state.botRow = bounded.row;

	if (state.carryingPackageId) {
		const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
		if (carriedPackage) {
			carriedPackage.col = state.botCol;
			carriedPackage.row = state.botRow;
		}
	}
}

function getPackageAtBot() {
	return packages.find(packageItem => !packageItem.delivered && packageItem.col === state.botCol && packageItem.row === state.botRow) || null;
}

function getBaseForPackage(packageId) {
	return bases.find(base => base.id === packageId) || null;
}

function allPackagesDelivered() {
	return packages.every(packageItem => packageItem.delivered);
}

function pickPackage() {
	state.usedPickCommand = true;

	if (state.carryingPackageId) {
		return;
	}

	const packageItem = getPackageAtBot();
	if (packageItem) {
		state.carryingPackageId = packageItem.id;
	}
}

function dropPackage() {
	state.usedDropCommand = true;

	if (!state.carryingPackageId) {
		return;
	}

	const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
	if (!carriedPackage) {
		state.carryingPackageId = null;
		return;
	}

	carriedPackage.col = state.botCol;
	carriedPackage.row = state.botRow;
	const matchingBase = getBaseForPackage(carriedPackage.id);
	if (matchingBase && carriedPackage.col === matchingBase.col && carriedPackage.row === matchingBase.row) {
		carriedPackage.delivered = true;
	}

	state.carryingPackageId = null;
}

function resetPackages() {
	packages[0].col = 2;
	packages[0].row = 6;
	packages[0].delivered = false;
	packages[1].col = 4;
	packages[1].row = 4;
	packages[1].delivered = false;
	packages[2].col = 6;
	packages[2].row = 2;
	packages[2].delivered = false;
}

function renderBases() {
	baseLayer.innerHTML = '';
	for (const base of bases) {
		const baseCell = document.createElement('div');
		baseCell.className = 'base-cell';
		baseCell.dataset.baseId = base.id;
		baseCell.style.color = base.color;

		const baseVisual = document.createElement('div');
		baseVisual.className = 'base';
		baseCell.appendChild(baseVisual);
		setEntityPosition(baseCell, base.col, base.row);
		baseLayer.appendChild(baseCell);
	}
}

function renderPackages() {
	packageLayer.innerHTML = '';
	for (const packageItem of packages) {
		const packageCell = document.createElement('div');
		packageCell.className = 'package-cell';
		packageCell.dataset.packageId = packageItem.id;
		if (packageItem.delivered) {
			packageCell.classList.add('hidden');
		}

		const packageVisual = document.createElement('div');
		packageVisual.className = 'package';
		packageVisual.style.background = 'linear-gradient(180deg, ' + packageItem.color + ', color-mix(in srgb, ' + packageItem.color + ' 60%, black))';
		packageCell.appendChild(packageVisual);
		setEntityPosition(packageCell, packageItem.col, packageItem.row);
		packageLayer.appendChild(packageCell);
	}
}

function refreshLayerPositions() {
	const packageCells = packageLayer.querySelectorAll('.package-cell');
	for (const packageCell of packageCells) {
		const packageId = packageCell.dataset.packageId;
		const packageItem = packages.find(item => item.id === packageId);
		if (packageItem && !packageItem.delivered) {
			setEntityPosition(packageCell, packageItem.col, packageItem.row);
		}
	}

	const baseCells = baseLayer.querySelectorAll('.base-cell');
	for (const baseCell of baseCells) {
		const baseId = baseCell.dataset.baseId;
		const baseItem = bases.find(item => item.id === baseId);
		if (baseItem) {
			setEntityPosition(baseCell, baseItem.col, baseItem.row);
		}
	}
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
	statusEl.textContent = 'Executando entregas...';
	let executedSteps = 0;

	const parsedLines = [];
	for (const line of lines) {
		const parsed = parseCommand(line);
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
		if (allPackagesDelivered()) {
			break;
		}

		if (parsed.action === 'pegar') {
			pickPackage();
			executedSteps += 1;
			draw();
			await wait(220);
			continue;
		}

		if (parsed.action === 'largar') {
			dropPackage();
			executedSteps += 1;
			if (allPackagesDelivered()) {
				draw();
				await wait(220);
				break;
			}
			draw();
			await wait(220);
			continue;
		}

		for (let step = 0; step < parsed.amount; step += 1) {
			if (allPackagesDelivered()) {
				break;
			}

			moveBot(parsed.action);
			executedSteps += 1;
			draw();
			await wait(200);
		}
	}

	runBtn.disabled = false;
	resetBtn.disabled = false;

	if (allPackagesDelivered()) {
		statusEl.className = 'status ok';
		statusEl.textContent = 'Excelente! Voce entregou todos os pacotes nas bases corretas.';
		showWinPanel(executedSteps);
		return;
	}

	state = {
		botCol: startBot.col,
		botRow: startBot.row,
		carryingPackageId: null,
		usedPickCommand: false,
		usedDropCommand: false
	};
	resetPackages();
	renderPackages();
	refreshLayerPositions();
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
	state = {
		botCol: startBot.col,
		botRow: startBot.row,
		carryingPackageId: null,
		usedPickCommand: false,
		usedDropCommand: false
	};
	resetPackages();
	renderPackages();
	refreshLayerPositions();
	draw();
	statusEl.className = 'status';
	statusEl.textContent = 'Posicao resetada para nova tentativa.';
}

function startPractice() {
	tutorialPanel.classList.add('hidden');
	practicePanel.classList.remove('hidden');
	resetLesson();
}

runBtn.addEventListener('click', executeCommands);
resetBtn.addEventListener('click', resetLesson);
docsBtn.addEventListener('click', showDocsPanel);
errorPanelClose.addEventListener('click', hideErrorPanel);
docsPanelClose.addEventListener('click', hideDocsPanel);
failPanelOk.addEventListener('click', hideFailPanel);
startPracticeBtn.addEventListener('click', startPractice);

buildGrid();
renderBases();
renderPackages();
resetLesson();
