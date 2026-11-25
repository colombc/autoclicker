// Prototype koffi : valide clics, position, DPI, rythme et packaging avant la vraie appli.
// Lancement : `npm start` (interface de test) ou `npm run selftest` (vérifs sans clic).

const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { performance } = require('node:perf_hooks');
const { startSchedule } = require('./src/scheduler');

let platform = null;
let platformError = null;
try {
  platform = require('./src/platform');
} catch (e) {
  platformError = e;
}

let win = null;
let schedule = null;
let stats = null;

function info() {
  return {
    electron: process.versions.electron,
    node: process.versions.node,
    koffi: platform?.debug.koffiVersion ?? null,
    inputSize: platform?.debug.inputSize ?? null,
    platformError: platformError ? String(platformError.stack || platformError) : null,
    packaged: app.isPackaged,
    portableDir: process.env.PORTABLE_EXECUTABLE_DIR ?? null,
    execDir: path.dirname(process.execPath),
    displays: screen.getAllDisplays().map((d) => ({ id: d.id, bounds: d.bounds, scaleFactor: d.scaleFactor })),
  };
}

// Position du curseur dans les deux unités : physique (koffi) et DIP (Electron).
function positions() {
  const physical = platform.getCursorPos();
  const dip = screen.getCursorScreenPoint();
  return {
    physical,
    dip,
    dipToPhysical: screen.dipToScreenPoint(dip),
    physicalToDip: screen.screenToDipPoint(physical),
  };
}

// Vrai si le point physique tombe dans la fenêtre de KamClick (bounds en DIP).
function isOnOwnWindow(physical) {
  if (!win || !win.isVisible() || win.isMinimized()) return false;
  const p = screen.screenToDipPoint(physical);
  const b = win.getBounds();
  return p.x >= b.x && p.x < b.x + b.width && p.y >= b.y && p.y < b.y + b.height;
}

function send(channel, data) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, data);
}

function startClicking(opts) {
  stopClicking();
  stats = { clicked: 0, ignored: 0, errors: 0, lastError: null, lateness: [], periods: [], lastTick: null };
  const point = opts.fixed ? { x: opts.x, y: opts.y } : null;
  platform.setHighResTimer(true);
  schedule = startSchedule({
    nextInterval: () => opts.interval,
    tick: (now, due) => {
      if (stats.lastTick != null) stats.periods.push(now - stats.lastTick);
      stats.lastTick = now;
      stats.lateness.push(now - due);
      const target = point ?? platform.getCursorPos();
      if (isOnOwnWindow(target)) {
        stats.ignored++;
      } else {
        try {
          platform.click(opts.button, point);
          stats.clicked++;
        } catch (e) {
          stats.errors++;
          stats.lastError = e.message;
        }
      }
      if (opts.maxClicks && stats.clicked + stats.ignored >= opts.maxClicks) stopClicking();
    },
  });
  send('state', { running: true });
}

function summarize(values) {
  if (!values.length) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
  return { n: values.length, mean: +mean.toFixed(2), sd: +sd.toFixed(2), min: +Math.min(...values).toFixed(2), max: +Math.max(...values).toFixed(2) };
}

function statsSummary() {
  if (!stats) return null;
  return {
    clicked: stats.clicked,
    ignored: stats.ignored,
    errors: stats.errors,
    lastError: stats.lastError,
    period: summarize(stats.periods),
    lateness: summarize(stats.lateness),
  };
}

function stopClicking() {
  if (!schedule) return;
  schedule.stop();
  schedule = null;
  platform.setHighResTimer(false);
  send('state', { running: false, stats: statsSummary() });
}

function registerIpc() {
  ipcMain.handle('info', () => info());
  ipcMain.handle('positions', () => positions());
  ipcMain.handle('clickIn', async (_e, { button, point, delayMs }) => {
    await new Promise((r) => setTimeout(r, delayMs));
    try {
      const before = platform.getCursorPos();
      platform.click(button, point);
      return { ok: true, before, after: platform.getCursorPos() };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
  ipcMain.handle('start', (_e, opts) => startClicking(opts));
  ipcMain.handle('stop', () => stopClicking());
  ipcMain.handle('stats', () => statsSummary());
}

function registerShortcuts() {
  const shortcuts = {
    F1: () => send('shortcut', 'start'),
    F2: () => stopClicking(),
    F3: () => send('capture', platform.getCursorPos()),
    F10: () => app.quit(),
  };
  const result = {};
  for (const [key, fn] of Object.entries(shortcuts)) result[key] = globalShortcut.register(key, fn);
  return result;
}

function createWindow() {
  win = new BrowserWindow({
    width: 520,
    height: 760,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
    },
  });
  // Electron 45 sous Windows : `alwaysOnTop: true` dans le constructeur et le niveau
  // par défaut ('floating') ne posent pas WS_EX_TOPMOST. 'pop-up-menu' est le plus
  // bas niveau qui marche (vérifié, tient après réduction/restauration).
  win.setAlwaysOnTop(true, 'pop-up-menu');
  win.loadFile('index.html');
}

// Vrais clics gauche + droit, uniquement dans une fenêtre de test créée pour
// l'occasion, puis le curseur est remis en place.
async function clickTest() {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const page = "<body style='margin:0;height:100vh;background:#3a7'><script>window.clicks=[];addEventListener('contextmenu',e=>e.preventDefault());addEventListener('mousedown',e=>clicks.push({button:e.button,screenX:e.screenX,screenY:e.screenY}))</script>";
  const test = new BrowserWindow({ width: 200, height: 200, frame: false, show: false });
  test.setAlwaysOnTop(true, 'pop-up-menu');
  try {
    await test.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(page));
    test.show();
    test.focus();
    await wait(300);
    const b = test.getContentBounds();
    const centerDip = { x: b.x + Math.round(b.width / 2), y: b.y + Math.round(b.height / 2) };
    const center = screen.dipToScreenPoint(centerDip);
    const start = platform.getCursorPos();
    platform.click('left', center);
    await wait(100);
    platform.click('right', center);
    await wait(200);
    platform.setCursorPos(start.x, start.y);
    const clicks = await test.webContents.executeJavaScript('window.clicks');
    const buttons = clicks.map((c) => c.button);
    const ok = buttons.length === 2 && buttons[0] === 0 && buttons[1] === 2;
    return { ok, value: { centerDip, centerPhysical: center, clicks }, ...(ok ? {} : { error: `clics reçus : ${JSON.stringify(buttons)}` }) };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  } finally {
    test.destroy();
  }
}

// Vérifications sans clic : chargement koffi, taille d'INPUT, cohérence des
// positions, aller-retour SetCursorPos (curseur déplacé d'1 px puis remis), rythme
// avec un faux clic. Résultat écrit dans selftest-result.json à côté de l'exe.
async function selftest() {
  const result = { info: info(), checks: {} };
  const check = (name, fn) => {
    try {
      result.checks[name] = { ok: true, value: fn() };
    } catch (e) {
      result.checks[name] = { ok: false, error: String(e.message || e) };
    }
  };

  if (platform) {
    check('inputSize40', () => {
      if (platform.debug.inputSize !== 40) throw new Error(`sizeof(INPUT) = ${platform.debug.inputSize}`);
      return 40;
    });
    check('positions', () => {
      const p = positions();
      const dx = Math.abs(p.dipToPhysical.x - p.physical.x);
      const dy = Math.abs(p.dipToPhysical.y - p.physical.y);
      if (dx > 2 || dy > 2) throw new Error(`écart DIP→physique trop grand : ${JSON.stringify(p)}`);
      return p;
    });
    check('setCursorRoundTrip', () => {
      const start = platform.getCursorPos();
      const target = { x: start.x + 1, y: start.y };
      platform.setCursorPos(target.x, target.y);
      const moved = platform.getCursorPos();
      platform.setCursorPos(start.x, start.y);
      if (moved.x !== target.x || moved.y !== target.y) throw new Error(`attendu ${JSON.stringify(target)}, obtenu ${JSON.stringify(moved)}`);
      return { start, moved };
    });
  }

  if (platform) result.checks.realClicks = await clickTest();

  const rhythmRuns = [];
  for (const highRes of [false, true]) for (const interval of [10, 50, 100]) rhythmRuns.push({ highRes, interval });
  for (const { highRes, interval } of rhythmRuns) {
    platform?.setHighResTimer(highRes);
    result.checks[`rhythm${interval}ms${highRes ? 'HighRes' : ''}`] = await new Promise((resolve) => {
      const periods = [];
      let last = null;
      const t0 = performance.now();
      let n = 0;
      const count = Math.round(2000 / interval);
      const s = startSchedule({
        nextInterval: () => interval,
        tick: (now) => {
          if (last != null) periods.push(now - last);
          last = now;
          if (++n >= count) {
            s.stop();
            const total = now - t0;
            resolve({ ok: true, value: { expectedTotal: (count - 1) * interval, actualTotal: +total.toFixed(1), period: summarize(periods) } });
          }
        },
      });
    });
  }
  platform?.setHighResTimer(false);

  const outDir = process.env.PORTABLE_EXECUTABLE_DIR || (app.isPackaged ? path.dirname(process.execPath) : __dirname);
  const outFile = path.join(outDir, 'selftest-result.json');
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  app.exit(Object.values(result.checks).every((c) => c.ok) && platform ? 0 : 1);
}

app.whenReady().then(() => {
  if (process.argv.includes('--selftest')) return selftest();
  registerIpc();
  createWindow();
  const shortcuts = registerShortcuts();
  win.webContents.once('did-finish-load', () => send('shortcuts', shortcuts));
});

app.on('will-quit', () => globalShortcut.unregisterAll());
// En selftest, la fermeture de la fenêtre de test ne doit pas quitter l'appli.
app.on('window-all-closed', () => {
  if (!process.argv.includes('--selftest')) app.quit();
});
