# KamClick 2

Autoclicker pour Windows : réécriture en Electron + Angular de KamClick V1.2 (AutoIt, 2011).

## Commandes

| Commande | Effet |
|---|---|
| `npm start` | Build complet puis lance l'appli |
| `npm run dev` | Serveur Angular + compilation du main en continu + Electron (interface rechargée à chaud ; relancer pour les changements du main) |
| `npm test` | Tests unitaires (Vitest) |
| `npm run dist` | Exe portable dans `release/KamClick-<version>.exe` |

Si `node_modules/electron/dist` est absent après `npm install` (script d'installation d'Electron non exécuté) : `node node_modules/electron/install.js`.

## Structure

- `electron/` : process main (fenêtre, raccourcis globaux, moteur de clic, fichier de réglages) et preload.
  - `platform/` : wrapper OS. `win32.ts` = implémentation Windows (koffi + `SendInput`). Linux plus tard : ajouter une implémentation et l'enregistrer dans `platform/index.ts`.
- `shared/` : types et logique de réglages communs au main et à l'interface.
- `src/` : interface Angular + Angular Material.

## Réglages

Fichier `kamclick.json` à côté de l'exe (en dev : dans ce dossier), créé au premier lancement et enregistré à chaque modification. Les raccourcis (`shortcuts`) ne se modifient que dans ce fichier, au format accélérateur Electron (`F1`, `Ctrl+Shift+K`…).
