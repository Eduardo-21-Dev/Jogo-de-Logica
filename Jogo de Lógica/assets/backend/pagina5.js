const CELL = 52;
const COLS = 11;
const ROWS = 9;

const tutorialPanel = document.getElementById('tutorialPanel');
const practicePanel = document.getElementById('practicePanel');
const startPracticeBtn = document.getElementById('startPracticeBtn');
const demoVideo = document.getElementById('demoVideo');
const demoVideoNote = document.getElementById('demoVideoNote');

const board = document.getElementById('board');
const arenaGrid = document.getElementById('arenaGrid');
const botCell = document.getElementById('botCell');
const boxCell = document.getElementById('boxCell');
const targetCell = document.getElementById('targetCell');
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
const startBox = { col: 3, row: ROWS - 4 };
const target = { col: COLS - 2, row: 1 };

let state = {
	botCol: startBot.col,
	botRow: startBot.row,
	boxCol: startBox.col,
	boxRow: startBox.row,
	carrying: false,
	delivered: false,
	usedPickCommand: false,
	usedDropCommand: false
};

function lerp(a, b, t) {
	return a + (b - a) * t;
}

function getSegmentPosition(frame, ranges) {
	for (const segment of ranges) {
		if (frame <= segment.end) {
			const size = Math.max(1, segment.end - segment.start);
			const t = Math.max(0, Math.min(1, (frame - segment.start) / size));
			return {
				x: lerp(segment.from.x, segment.to.x, t),
				y: lerp(segment.from.y, segment.to.y, t),
				label: segment.label
			};
		}
	}

	const last = ranges[ranges.length - 1];
	return { x: last.to.x, y: last.to.y, label: last.label };
}

function drawDemoFrame(ctx, frame, width, height) {
	ctx.clearRect(0, 0, width, height);
	const bg = ctx.createLinearGradient(0, 0, 0, height);
	bg.addColorStop(0, '#0f172a');
	bg.addColorStop(1, '#1e293b');
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, width, height);

	const margin = 28;
	const gridW = width - margin * 2;
	const gridH = height - margin * 2 - 44;
	const cols = 8;
	const rows = 5;
	const cellW = gridW / cols;
	const cellH = gridH / rows;

	ctx.fillStyle = '#f8fafc';
	ctx.fillRect(margin, margin, gridW, gridH);
	ctx.strokeStyle = '#dbe3f2';
	ctx.lineWidth = 1;
	for (let c = 0; c <= cols; c += 1) {
		ctx.beginPath();
		ctx.moveTo(margin + c * cellW, margin);
		ctx.lineTo(margin + c * cellW, margin + gridH);
		ctx.stroke();
	}
	for (let r = 0; r <= rows; r += 1) {
		ctx.beginPath();
		ctx.moveTo(margin, margin + r * cellH);
		ctx.lineTo(margin + gridW, margin + r * cellH);
		ctx.stroke();
	}

	const ranges = [
		{ start: 0, end: 35, from: { x: 1, y: 4 }, to: { x: 3, y: 4 }, label: 'moverDireita(2)' },
		{ start: 36, end: 72, from: { x: 3, y: 4 }, to: { x: 3, y: 2 }, label: 'moverCima(2)' },
		{ start: 73, end: 96, from: { x: 3, y: 2 }, to: { x: 3, y: 2 }, label: 'pegar()' },
		{ start: 97, end: 145, from: { x: 3, y: 2 }, to: { x: 6, y: 2 }, label: 'moverDireita(3)' },
		{ start: 146, end: 180, from: { x: 6, y: 2 }, to: { x: 6, y: 1 }, label: 'moverCima(1)' },
		{ start: 181, end: 210, from: { x: 6, y: 1 }, to: { x: 6, y: 1 }, label: 'largar()' }
	];

	const pos = getSegmentPosition(frame, ranges);
	const carrying = frame >= 73 && frame < 181;
	const delivered = frame >= 181;

	const targetX = margin + 6 * cellW;
	const targetY = margin + 1 * cellH;
	ctx.fillStyle = 'rgba(249,115,22,0.2)';
	ctx.strokeStyle = '#f97316';
	ctx.lineWidth = 2;
	ctx.setLineDash([6, 4]);
	ctx.fillRect(targetX + 8, targetY + 8, cellW - 16, cellH - 16);
	ctx.strokeRect(targetX + 8, targetY + 8, cellW - 16, cellH - 16);
	ctx.setLineDash([]);

	let boxX = margin + 3 * cellW;
	let boxY = margin + 2 * cellH;
	if (carrying) {
		boxX = margin + pos.x * cellW;
		boxY = margin + pos.y * cellH;
	}
	if (!delivered) {
		ctx.fillStyle = '#92400e';
		ctx.fillRect(boxX + 10, boxY + 10, cellW - 20, cellH - 20);
		ctx.strokeStyle = '#fcd34d';
		ctx.lineWidth = 2;
		ctx.strokeRect(boxX + 10, boxY + 10, cellW - 20, cellH - 20);
	} else {
		ctx.fillStyle = '#92400e';
		ctx.fillRect(targetX + 10, targetY + 10, cellW - 20, cellH - 20);
		ctx.strokeStyle = '#fcd34d';
		ctx.lineWidth = 2;
		ctx.strokeRect(targetX + 10, targetY + 10, cellW - 20, cellH - 20);
	}

	const botX = margin + pos.x * cellW;
	const botY = margin + pos.y * cellH;
	ctx.fillStyle = '#2563eb';
	ctx.fillRect(botX + 10, botY + 10, cellW - 20, cellH - 20);
	if (carrying) {
		ctx.strokeStyle = '#f59e0b';
		ctx.lineWidth = 2;
		ctx.strokeRect(botX + 8, botY + 8, cellW - 16, cellH - 16);
	}
	ctx.fillStyle = '#dbeafe';
	ctx.beginPath();
	ctx.arc(botX + 18, botY + 20, 3, 0, Math.PI * 2);
	ctx.arc(botX + cellW - 18, botY + 20, 3, 0, Math.PI * 2);
	ctx.fill();

	ctx.fillStyle = '#e2e8f0';
	ctx.font = 'bold 14px Segoe UI';
	ctx.fillText('TOM', botX + 12, botY + cellH - 10);

	if (frame >= 181) {
		ctx.fillStyle = '#22c55e';
		ctx.font = 'bold 20px Segoe UI';
		ctx.fillText('OBJETIVO CONCLUIDO', margin + 190, margin + 28);
	}

	ctx.fillStyle = '#e2e8f0';
	ctx.font = 'bold 19px Segoe UI';
	ctx.fillText('Demonstracao do Tom: pegar e largar no alvo', margin, height - 18);
	ctx.fillStyle = '#93c5fd';
	ctx.font = 'bold 18px Consolas';
	ctx.fillText(pos.label, width - 260, height - 18);
}

async function createDemoVideoUrl() {
	if (!window.MediaRecorder) {
		throw new Error('MediaRecorder indisponivel');
	}

	const canvas = document.createElement('canvas');
	canvas.width = 720;
	canvas.height = 406;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		throw new Error('Canvas 2D indisponivel');
	}

	const stream = canvas.captureStream(30);
	const chunks = [];
	const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
	recorder.ondataavailable = event => {
		if (event.data && event.data.size > 0) {
			chunks.push(event.data);
		}
	};

	const done = new Promise(resolve => {
		recorder.onstop = () => {
			const blob = new Blob(chunks, { type: 'video/webm' });
			resolve(URL.createObjectURL(blob));
		};
	});

	recorder.start();
	const totalFrames = 210;
	for (let frame = 0; frame <= totalFrames; frame += 1) {
		drawDemoFrame(ctx, frame, canvas.width, canvas.height);
		await wait(1000 / 30);
	}
	recorder.stop();

	return done;
}

async function setupDemoVideo() {
	if (!demoVideo || !demoVideoNote) {
		return;
	}

	try {
		const videoUrl = await createDemoVideoUrl();
		demoVideo.src = videoUrl;
		demoVideoNote.textContent = 'Demonstracao pronta. Use os controles do video para pausar ou repetir.';
	} catch (error) {
		demoVideoNote.textContent = 'Nao foi possivel gerar o video nesta sessao. Siga o passo a passo do tutorial acima.';
	}
}

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
	setEntityPosition(targetCell, target.col, target.row);

	if (!state.delivered) {
		setEntityPosition(boxCell, state.boxCol, state.boxRow);
		boxCell.classList.remove('hidden');
	} else {
		boxCell.classList.add('hidden');
	}

	botCell.classList.toggle('carrying', state.carrying);
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
	winSummary.textContent = 'Voce concluiu em ' + executedSteps + ' passos usando pegar().';
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

	if (state.carrying) {
		state.boxCol = state.botCol;
		state.boxRow = state.botRow;
	}
}

function pickBox() {
	state.usedPickCommand = true;

	if (state.delivered || state.carrying) {
		return;
	}

	if (state.botCol === state.boxCol && state.botRow === state.boxRow) {
		state.carrying = true;
	}
}

function dropBox() {
	state.usedDropCommand = true;

	if (!state.carrying) {
		state.delivered = state.boxCol === target.col && state.boxRow === target.row;
		return;
	}

	state.carrying = false;
	state.boxCol = state.botCol;
	state.boxRow = state.botRow;
	state.delivered = state.boxCol === target.col && state.boxRow === target.row;
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
		if (state.delivered) {
			break;
		}

		if (parsed.action === 'pegar') {
			pickBox();
			executedSteps += 1;
			draw();
			await wait(220);
			continue;
		}

		if (parsed.action === 'largar') {
			dropBox();
			executedSteps += 1;
			draw();
			await wait(220);
			continue;
		}

		for (let step = 0; step < parsed.amount; step += 1) {
			if (state.delivered) {
				break;
			}

			moveBot(parsed.action);
			executedSteps += 1;
			draw();
			await wait(220);
		}
	}

	runBtn.disabled = false;
	resetBtn.disabled = false;

	if (state.delivered && state.usedPickCommand && state.usedDropCommand) {
		statusEl.className = 'status ok';
		statusEl.textContent = 'Excelente! Voce pegou e largou a caixa no alvo.';
		showWinPanel(executedSteps);
		return;
	}

	state = {
		botCol: startBot.col,
		botRow: startBot.row,
		boxCol: startBox.col,
		boxRow: startBox.row,
		carrying: false,
		delivered: false,
		usedPickCommand: false,
		usedDropCommand: false
	};
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
		boxCol: startBox.col,
		boxRow: startBox.row,
		carrying: false,
		delivered: false,
		usedPickCommand: false,
		usedDropCommand: false
	};
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
resetLesson();
setupDemoVideo();
