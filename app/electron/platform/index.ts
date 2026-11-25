// Choisit l'implémentation du wrapper OS selon la plateforme.
// Linux plus tard : ajouter ./linux.ts et l'enregistrer ici.

import type { Platform } from './types';

export type { Platform, Point } from './types';

export function loadPlatform(): Platform {
  switch (process.platform) {
    case 'win32':
      return require('./win32').win32;
    default:
      throw new Error(`Plateforme non supportée : ${process.platform}`);
  }
}
