const CELL = 44;
const COLS = 13;
const ROWS = 11;

const tutorialPanel = document.getElementById('tutorialPanel');
const practicePanel = document.getElementById('practicePanel');
const startPracticeBtn = document.getElementById('startPracticeBtn');

const board = document.getElementById('board');
const arenaGrid = document.getElementById('arenaGrid');
const mazeLayer = document.getElementById('mazeLayer');
const baseLayer = document.getElementById('baseLayer');
const packageLayer = document.getElementById('packageLayer');
const hazardLayer = document.getElementById('hazardLayer');
const botCell = document.getElementById('botCell');
const cmdInput = document.getElementById('cmdInput');
const runBtn = document.getElementById('runBtn');
const resetBtn = document.getElementById('resetBtn');
const docsBtn = document.getElementById('docsBtn');
const statusEl = document.getElementById('status');
const turnCounter = document.getElementById('turnCounter');
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
	{ id: 'red', col: 10, row: 1, color: '#ef4444' },
	{ id: 'blue', col: 10, row: 4, color: '#3b82f6' },
	{ id: 'green', col: 10, row: 7, color: '#22c55e' }
];
const packages = [
	{ id: 'red', col: 2, row: 8, color: '#ef4444', delivered: false },
	{ id: 'blue', col: 4, row: 6, color: '#3b82f6', delivered: false },
	{ id: 'green', col: 6, row: 2, color: '#22c55e', delivered: false }
];
const mazeWalls = [
	{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }, { col: 4, row: 0 }, { col: 5, row: 0 }, { col: 6, row: 0 }, { col: 7, row: 0 }, { col: 8, row: 0 }, { col: 9, row: 0 }, { col: 10, row: 0 }, { col: 11, row: 0 }, { col: 12, row: 0 },
	{ col: 0, row: 1 }, { col: 12, row: 1 },
	{ col: 0, row: 2 }, { col: 12, row: 2 },
	{ col: 0, row: 3 }, { col: 12, row: 3 },
	{ col: 0, row: 4 }, { col: 12, row: 4 },
	{ col: 0, row: 5 }, { col: 12, row: 5 },
	{ col: 0, row: 6 }, { col: 12, row: 6 },
	{ col: 0, row: 7 }, { col: 12, row: 7 },
	{ col: 0, row: 8 }, { col: 12, row: 8 },
	{ col: 0, row: 9 }, { col: 12, row: 9 },
	{ col: 0, row: 10 }, { col: 1, row: 10 }, { col: 2, row: 10 }, { col: 3, row: 10 }, { col: 4, row: 10 }, { col: 5, row: 10 }, { col: 6, row: 10 }, { col: 7, row: 10 }, { col: 8, row: 10 }, { col: 9, row: 10 }, { col: 10, row: 10 }, { col: 11, row: 10 }, { col: 12, row: 10 },
	{ col: 3, row: 1 }, { col: 3, row: 2 }, { col: 3, row: 3 },
	{ col: 5, row: 3 }, { col: 5, row: 4 }, { col: 5, row: 5 },
	{ col: 7, row: 5 }, { col: 7, row: 6 }, { col: 7, row: 7 },
	{ col: 9, row: 2 }, { col: 9, row: 3 }, { col: 9, row: 5 }, { col: 9, row: 6 },
	{ col: 4, row: 8 }, { col: 5, row: 8 }, { col: 7, row: 8 }, { col: 8, row: 8 }
];
const hazards = [
	{ id: 'h1', col: 2, row: 1, dir: 1 },
	{ id: 'h2', col: 8, row: 3, dir: -1 },
	{ id: 'h3', col: 6, row: 7, dir: 1 },
	{ id: 'h4', col: 4, row: 5, dir: 1 }
];

let state = {
	botCol: startBot.col,
	botRow: startBot.row,
	carryingPackageId: null,
	usedPickCommand: false,
	usedDropCommand: false,
	turnsLeft: 0
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

function keyFor(col, row) {
	return col + ',' + row;
}

function isWall(col, row) {
	return mazeWalls.some(wall => wall.col === col && wall.row === row);
}

function isWalkable(col, row) {
	return col >= 0 && col < COLS && row >= 0 && row < ROWS && !isWall(col, row);
}

function isHazardAt(col, row) {
	return hazards.some(hazard => hazard.col === col && hazard.row === row);
}

function manhattanDistance(colA, rowA, colB, rowB) {
	return Math.abs(colA - colB) + Math.abs(rowA - rowB);
}

function buildMaze() {
	mazeLayer.innerHTML = '';
	for (const wall of mazeWalls) {
		const wallCell = document.createElement('div');
		wallCell.className = 'maze-cell';
		wallCell.style.transform = 'translate(' + (wall.col * CELL) + 'px,' + (wall.row * CELL) + 'px)';
		const wallVisual = document.createElement('div');
		wallVisual.className = 'maze-wall';
		wallCell.appendChild(wallVisual);
		mazeLayer.appendChild(wallCell);
	}
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

function renderHazards() {
	hazardLayer.innerHTML = '';
	for (const hazard of hazards) {
		const hazardCell = document.createElement('div');
		hazardCell.className = 'hazard-cell';
		hazardCell.dataset.hazardId = hazard.id;
		const hazardVisual = document.createElement('div');
		hazardVisual.className = 'hazard';
		hazardCell.appendChild(hazardVisual);
		setEntityPosition(hazardCell, hazard.col, hazard.row);
		hazardLayer.appendChild(hazardCell);
	}
}

function refreshLayerPositions() {
	for (const baseCell of baseLayer.querySelectorAll('.base-cell')) {
		const baseId = baseCell.dataset.baseId;
		const baseItem = bases.find(item => item.id === baseId);
		if (baseItem) {
			setEntityPosition(baseCell, baseItem.col, baseItem.row);
		}
	}

	for (const packageCell of packageLayer.querySelectorAll('.package-cell')) {
		const packageId = packageCell.dataset.packageId;
		const packageItem = packages.find(item => item.id === packageId);
		if (packageItem && !packageItem.delivered) {
			setEntityPosition(packageCell, packageItem.col, packageItem.row);
		}
	}

	for (const hazardCell of hazardLayer.querySelectorAll('.hazard-cell')) {
		const hazardId = hazardCell.dataset.hazardId;
		const hazardItem = hazards.find(item => item.id === hazardId);
		if (hazardItem) {
			setEntityPosition(hazardCell, hazardItem.col, hazardItem.row);
		}
	}
}

function draw() {
	setEntityPosition(botCell, state.botCol, state.botRow);
	const carriedPackage = state.carryingPackageId ? packages.find(item => item.id === state.carryingPackageId) : null;
	botCell.classList.toggle('carrying', Boolean(carriedPackage));

	for (const packageItem of packages) {
		const packageCell = packageLayer.querySelector('[data-package-id="' + packageItem.id + '"]');
		if (packageCell) {
			packageCell.classList.toggle('hidden', packageItem.delivered);
			if (!packageItem.delivered) {
				setEntityPosition(packageCell, packageItem.col, packageItem.row);
			}
		}
	}

	for (const hazard of hazards) {
		const hazardCell = hazardLayer.querySelector('[data-hazard-id="' + hazard.id + '"]');
		if (hazardCell) {
			setEntityPosition(hazardCell, hazard.col, hazard.row);
		}
	}

	turnCounter.textContent = 'Turnos restantes: ' + state.turnsLeft;
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
	winSummary.textContent = 'Voce entregou todos os pacotes em ' + executedSteps + ' turnos.';
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
	if (isWalkable(bounded.col, bounded.row)) {
		state.botCol = bounded.col;
		state.botRow = bounded.row;
	}

	if (state.carryingPackageId) {
		const carriedPackage = packages.find(item => item.id === state.carryingPackageId);
		if (carriedPackage) {
			carriedPackage.col = state.botCol;
			carriedPackage.row = state.botRow;
		}
	}
}

function moveHazards() {
	for (const hazard of hazards) {
		const candidates = [
			{ col: hazard.col + 1, row: hazard.row, dir: 1 },
			{ col: hazard.col - 1, row: hazard.row, dir: -1 },
			{ col: hazard.col, row: hazard.row + 1, dir: 1 },
			{ col: hazard.col, row: hazard.row - 1, dir: -1 }
		]
			.filter(candidate => isWalkable(candidate.col, candidate.row))
			.filter(candidate => !isHazardAt(candidate.col, candidate.row))
			.filter(candidate => !(candidate.col === state.botCol && candidate.row === state.botRow));

		candidates.sort((a, b) => {
			const distA = manhattanDistance(a.col, a.row, state.botCol, state.botRow);
			const distB = manhattanDistance(b.col, b.row, state.botCol, state.botRow);
			return distA - distB;
		});

		if (candidates.length) {
			hazard.col = candidates[0].col;
			hazard.row = candidates[0].row;
			hazard.dir = candidates[0].dir;
		} else {
			hazard.dir *= -1;
		}
	}
}

function collisionWithHazard() {
	return hazards.some(hazard => hazard.col === state.botCol && hazard.row === state.botRow);
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
	packages[0].row = 8;
	packages[0].delivered = false;
	packages[1].col = 4;
	packages[1].row = 6;
	packages[1].delivered = false;
	packages[2].col = 6;
	packages[2].row = 2;
	packages[2].delivered = false;
}

function resetHazards() {
	hazards[0].col = 2;
	hazards[0].row = 1;
	hazards[0].dir = 1;
	hazards[1].col = 8;
	hazards[1].row = 3;
	hazards[1].dir = -1;
	hazards[2].col = 6;
	hazards[2].row = 7;
	hazards[2].dir = 1;
	hazards[3].col = 4;
	hazards[3].row = 5;
	hazards[3].dir = -1;
}

async function stepTurn(action) {
	if (action === 'pegar') {
		pickPackage();
	} else if (action === 'largar') {
		dropPackage();
	} else {
		moveBot(action);
	}

	moveHazards();
	state.turnsLeft += 1;
	draw();
	await wait(200);

	if (collisionWithHazard()) {
		return 'collision';
	}

	return 'ok';
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
		usedDropCommand: false,
		turnsLeft: 0
	};
	resetPackages();
	resetHazards();
	renderPackages();
	renderBases();
	renderHazards();
	refreshLayerPositions();
	draw();
	statusEl.className = 'status';
	statusEl.textContent = 'Posicao resetada para nova tentativa.';
	turnCounter.textContent = 'Turnos restantes: 0';
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
	statusEl.textContent = 'Executando com turnos dos blocos vermelhos...';
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

		for (let step = 0; step < parsed.amount; step += 1) {
			const result = await stepTurn(parsed.action);
			executedSteps += 1;
			if (result === 'collision') {
				state = {
					botCol: startBot.col,
					botRow: startBot.row,
					carryingPackageId: null,
					usedPickCommand: false,
					usedDropCommand: false,
					turnsLeft: 0
				};
				resetPackages();
				resetHazards();
				renderPackages();
				renderHazards();
				refreshLayerPositions();
				draw();
				runBtn.disabled = false;
				resetBtn.disabled = false;
				statusEl.className = 'status err';
				statusEl.textContent = 'Falha: o boneco encostou em um bloco vermelho. A fase foi reiniciada.';
				showFailPanel();
				return;
			}
			if (allPackagesDelivered()) {
				break;
			}
		}
	}

	runBtn.disabled = false;
	resetBtn.disabled = false;

	if (allPackagesDelivered() && state.usedPickCommand && state.usedDropCommand) {
		statusEl.className = 'status ok';
		statusEl.textContent = 'Excelente! Voce entregou todos os pacotes e evitou os blocos vermelhos.';
		showWinPanel(executedSteps);
		return;
	}

	state = {
		botCol: startBot.col,
		botRow: startBot.row,
		carryingPackageId: null,
		usedPickCommand: false,
		usedDropCommand: false,
		turnsLeft: 0
	};
	resetPackages();
	resetHazards();
	renderPackages();
	renderHazards();
	refreshLayerPositions();
	draw();
	statusEl.className = 'status err';
	statusEl.textContent = 'Falha na rota: a fase foi resetada para nova tentativa.';
	showFailPanel();
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
buildMaze();
renderBases();
renderPackages();
renderHazards();
resetLesson();
