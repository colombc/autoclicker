// Interface du wrapper OS : tout ce qui dépend du système passe par ici.
// Coordonnées en pixels physiques (ce que renvoie GetCursorPos dans un process DPI-aware).

import type { MouseButton } from '../../shared/api';

export interface Point {
  x: number;
  y: number;
}

export interface Platform {
  readonly name: string;
  getCursorPos(): Point;
  setCursorPos(point: Point): void;
  // Clic à la position courante, ou en `point` (la souris y est déplacée, comme MouseClick d'AutoIt).
  click(button: MouseButton, point?: Point): void;
  // Timer système à 1 ms pendant les clics, sinon un intervalle de 10 ms dure ~15,6 ms sous Windows.
  setHighResTimer(enabled: boolean): void;
}
