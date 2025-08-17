// --- State ---
let running = false;       // Is the stopwatch currently running?
let startTime = 0;         // performance.now() when we last started
let elapsedBefore = 0;     // accumulated time from previous runs (ms)
let rafId = null;          // requestAnimationFrame id
let laps = [];             // { index, lapMs, totalMs }

// --- Elements ---
const displayEl = document.getElementById('display');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const clearLapsBtn = document.getElementById('clearLapsBtn');
const exportBtn = document.getElementById('exportBtn');
const lapsList = document.getElementById('lapsList');

// --- Utilities ---
function formatTime(ms) {
  const sign = ms < 0 ? '-' : '';
  ms = Math.abs(ms);
  const h = Math.floor(ms / 3600000);
  ms %= 3600000;
  const m = Math.floor(ms / 60000);
  ms %= 60000;
  const s = Math.floor(ms / 1000);
  const ms3 = Math.floor(ms % 1000);
  const hh = h > 0 ? String(h).padStart(2, '0') + ':' : '';
  return `${sign}${hh}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms3).padStart(3, '0')}`;
}

function currentElapsed() {
  if (running) {
    return (performance.now() - startTime) + elapsedBefore;
  }
  return elapsedBefore;
}

function renderDisplay(ms) {
  displayEl.textContent = formatTime(ms);
}

function start() {
  if (running) return;
  running = true;
  startTime = performance.now();
  startBtn.textContent = 'Pause';
  startBtn.classList.add('running');
  lapBtn.disabled = false;
  resetBtn.disabled = false;

  function tick() {
    renderDisplay(currentElapsed());
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);
}

function pause() {
  if (!running) return;
  running = false;
  cancelAnimationFrame(rafId);
  elapsedBefore += performance.now() - startTime;
  startBtn.textContent = 'Start';
  startBtn.classList.remove('running');
}

function reset() {
  cancelAnimationFrame(rafId);
  running = false;
  startTime = 0;
  elapsedBefore = 0;
  renderDisplay(0);
  startBtn.textContent = 'Start';
  startBtn.classList.remove('running');
  lapBtn.disabled = true;
  resetBtn.disabled = true;
}

function addLap() {
  const total = currentElapsed();
  const prevTotal = laps.length ? laps[laps.length - 1].totalMs : 0;
  const lapMs = total - prevTotal;
  const entry = { index: laps.length + 1, lapMs, totalMs: total };
  laps.push(entry);
  drawLapRow(entry);
  clearLapsBtn.disabled = false;
  exportBtn.disabled = false;
}

function drawLapRow(entry) {
  const li = document.createElement('li');
  li.className = 'lap-row';
  li.innerHTML = `
    <span class="lap-num">${entry.index}</span>
    <span class="lap-split">${formatTime(entry.lapMs)}</span>
    <span class="lap-total">${formatTime(entry.totalMs)}</span>
  `;
  lapsList.prepend(li); // newest first
}

function clearLaps() {
  laps = [];
  lapsList.innerHTML = '';
  clearLapsBtn.disabled = true;
  exportBtn.disabled = true;
}

function exportCSV() {
  if (!laps.length) return;
  const rows = [['Lap #', 'Lap (ms)', 'Lap (formatted)', 'Total (ms)', 'Total (formatted)']];
  for (const l of laps) {
    rows.push([l.index, l.lapMs, formatTime(l.lapMs), l.totalMs, formatTime(l.totalMs)]);
  }
  const csv = rows.map(r => r.map(v => String(v).replace(/"/g, '""')).map(v => /[,\n"]/.test(v) ? `"${v}"` : v).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'laps.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Wire up events ---
startBtn.addEventListener('click', () => running ? pause() : start());
lapBtn.addEventListener('click', addLap);
resetBtn.addEventListener('click', reset);
clearLapsBtn.addEventListener('click', clearLaps);
exportBtn.addEventListener('click', exportCSV);

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    running ? pause() : start();
  } else if (e.code === 'KeyL') {
    if (!lapBtn.disabled) addLap();
  } else if (e.code === 'KeyR') {
    reset();
  } else if (e.code === 'Delete') {
    if (!clearLapsBtn.disabled) clearLaps();
  }
});

// Initial render
renderDisplay(0);