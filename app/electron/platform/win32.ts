// Implémentation Windows du wrapper OS, via koffi + user32.dll / winmm.dll.
// Validée par le prototype `proto-koffi/` (voir doc/NOTES.md).

import koffi from 'koffi';
import type { MouseButton } from '../../shared/api';
import type { Platform, Point } from './types';

const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');
const winmm = koffi.load('winmm.dll');

const INPUT_MOUSE = 0;
const MOUSEEVENTF_LEFTDOWN = 0x0002;
const MOUSEEVENTF_LEFTUP = 0x0004;
const MOUSEEVENTF_RIGHTDOWN = 0x0008;
const MOUSEEVENTF_RIGHTUP = 0x0010;

koffi.struct('POINT', { x: 'long', y: 'long' });

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
  u: koffi.union({ mi: MOUSEINPUT, ki: KEYBDINPUT, hi: HARDWAREINPUT }),
});
const INPUT_SIZE = koffi.sizeof(INPUT);

const GetCursorPos = user32.func('int __stdcall GetCursorPos(_Out_ POINT *pos)');
const SetCursorPos = user32.func('int __stdcall SetCursorPos(int x, int y)');
const SendInput = user32.func('unsigned int __stdcall SendInput(unsigned int cInputs, INPUT *pInputs, int cbSize)');
const GetLastError = kernel32.func('uint32_t __stdcall GetLastError()');
const timeBeginPeriod = winmm.func('uint32_t __stdcall timeBeginPeriod(uint32_t uPeriod)');
const timeEndPeriod = winmm.func('uint32_t __stdcall timeEndPeriod(uint32_t uPeriod)');

const BUTTON_FLAGS: Record<MouseButton, [number, number]> = {
  left: [MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP],
  right: [MOUSEEVENTF_RIGHTDOWN, MOUSEEVENTF_RIGHTUP],
};

function mouseEvent(flags: number) {
  return {
    type: INPUT_MOUSE,
    u: { mi: { dx: 0, dy: 0, mouseData: 0, dwFlags: flags, time: 0, dwExtraInfo: 0 } },
  };
}

let highResTimer = false;

export const win32: Platform = {
  name: 'win32',

  getCursorPos() {
    const pos: Point = { x: 0, y: 0 };
    if (!GetCursorPos(pos)) throw new Error(`GetCursorPos a échoué (erreur ${GetLastError()})`);
    return { x: pos.x, y: pos.y };
  },

  setCursorPos({ x, y }) {
    if (!SetCursorPos(x, y)) throw new Error(`SetCursorPos a échoué (erreur ${GetLastError()})`);
  },

  click(button, point) {
    const [down, up] = BUTTON_FLAGS[button];
    if (point) this.setCursorPos(point);
    const events = [mouseEvent(down), mouseEvent(up)];
    const sent = SendInput(events.length, events, INPUT_SIZE);
    // 0 événement envoyé = bloqué par Windows (fenêtre administrateur, bureau verrouillé…)
    if (sent !== events.length) throw new Error(`clic bloqué par Windows (erreur ${GetLastError()})`);
  },

  setHighResTimer(enabled) {
    if (enabled === highResTimer) return;
    if (enabled) timeBeginPeriod(1);
    else timeEndPeriod(1);
    highResTimer = enabled;
  },
};
