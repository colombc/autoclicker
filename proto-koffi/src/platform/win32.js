// Implémentation Windows du wrapper plateforme, via koffi + user32.dll.
// Toutes les coordonnées sont en pixels physiques (ce que renvoie GetCursorPos
// dans un process DPI-aware comme Electron).

const koffi = require('koffi');

const user32 = koffi.load('user32.dll');

const INPUT_MOUSE = 0;
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;

const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long',
});

const MOUSEINPUT = koffi.struct('MOUSEINPUT', {
  dx: 'long',
  dy: 'long',
  mouseData: 'uint32_t',
  dwFlags: 'uint32_t',
  time: 'uint32_t',
  dwExtraInfo: 'uintptr_t',
});
const KEYBDINPUT = koffi.struct('KEYBDINPUT', {
  wVk: 'uint16_t',
  wScan: 'uint16_t',
  dwFlags: 'uint32_t',
  time: 'uint32_t',
  dwExtraInfo: 'uintptr_t',
});
const HARDWAREINPUT = koffi.struct('HARDWAREINPUT', {
  uMsg: 'uint32_t',
  wParamL: 'uint16_t',
  wParamH: 'uint16_t',
});
const INPUT = koffi.struct('INPUT', {
  type: 'uint32_t',
  u: koffi.union({
    mi: MOUSEINPUT,
    ki: KEYBDINPUT,
    hi: HARDWAREINPUT,
  }),
});

const GetCursorPos = user32.func('int __stdcall GetCursorPos(_Out_ POINT *pos)');
const SetCursorPos = user32.func('int __stdcall SetCursorPos(int x, int y)');
const SendInput = user32.func('unsigned int __stdcall SendInput(unsigned int cInputs, INPUT *pInputs, int cbSize)');
const GetLastError = koffi.load('kernel32.dll').func('uint32_t __stdcall GetLastError()');

const winmm = koffi.load('winmm.dll');
const timeBeginPeriod = winmm.func('uint32_t __stdcall timeBeginPeriod(uint32_t uPeriod)');
const timeEndPeriod = winmm.func('uint32_t __stdcall timeEndPeriod(uint32_t uPeriod)');

const BUTTON_FLAGS = {
  left: [MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP],
  right: [MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP],
};

function mouseEvent(flags) {
  return {
    type: INPUT_MOUSE,
    u: { mi: { dx: 0, dy: 0, mouseData: 0, dwFlags: flags, time: 0, dwExtraInfo: 0 } },
  };
}

function getCursorPos() {
  const pos = {};
  if (!GetCursorPos(pos)) throw new Error(`GetCursorPos a échoué (erreur ${GetLastError()})`);
  return { x: pos.x, y: pos.y };
}

function setCursorPos(x, y) {
  if (!SetCursorPos(x, y)) throw new Error(`SetCursorPos a échoué (erreur ${GetLastError()})`);
}

// Clic à la position courante, ou en (x, y) si fourni (la souris y est déplacée,
// comme MouseClick d'AutoIt dans la V1.2).
function click(button, point) {
  const flags = BUTTON_FLAGS[button];
  if (!flags) throw new Error(`Bouton inconnu : ${button}`);
  if (point) setCursorPos(point.x, point.y);
  const events = [mouseEvent(flags[0]), mouseEvent(flags[1])];
  const sent = SendInput(events.length, events, koffi.sizeof(INPUT));
  // 0 événement envoyé = bloqué (UIPI vers une fenêtre admin, bureau verrouillé…)
  if (sent !== events.length) throw new Error(`SendInput : ${sent}/${events.length} événements envoyés (erreur ${GetLastError()})`);
}

// Par défaut le timer Windows avance par pas de ~15,6 ms : un setTimeout de 10 ms
// dure en fait ~15,6 ms. On demande une résolution de 1 ms pendant les clics
// uniquement (coût en énergie), et on la rend à l'arrêt.
let highResTimer = false;
function setHighResTimer(enabled) {
  if (enabled === highResTimer) return;
  if (enabled) timeBeginPeriod(1);
  else timeEndPeriod(1);
  highResTimer = enabled;
}

module.exports = {
  name: 'win32',
  getCursorPos,
  setCursorPos,
  click,
  setHighResTimer,
  // Exposé pour le prototype uniquement
  debug: { inputSize: koffi.sizeof(INPUT), koffiVersion: koffi.version },
};
