<p align="center">
  <img src="doc/kamclick-icon.svg" alt="KamClick" width="120">
</p>

<h1 align="center">KamClick 2</h1>

<p align="center">
  Autoclicker pour Windows, réécriture moderne de KamClick V1.2 (AutoIt, 2011).<br>
  Electron · Angular · Angular Material · koffi
</p>

---

## Fonctionnalités

- Clic gauche ou droit, à la position de la souris ou à une position fixe (X/Y).
- Intervalle fixe (heures, minutes, secondes, centièmes) ou aléatoire (plage en ms, secondes ou minutes), 10 ms minimum.
- Raccourcis globaux, utilisables même quand la fenêtre n'a pas le focus.
- Fenêtre toujours au premier plan, thème clair ou sombre selon Windows.
- Les clics qui tomberaient sur la fenêtre de KamClick sont ignorés.
- Version portable : un seul exe, réglages enregistrés à côté de lui.

## Raccourcis par défaut

| Touche | Action |
|---|---|
| `F1` | Démarrer |
| `F2` | Arrêter (remet le compteur à 0) |
| `F3` | Capturer la position de la souris dans X/Y |
| `F10` | Quitter |

Modifiables dans `kamclick.json`, au format accélérateur Electron (`F1`, `Ctrl+Shift+K`…).

## Démarrage rapide

Prérequis : Windows 10/11 x64 et Node.js 22.22.3+, 24.15+ (LTS recommandée) ou 26+, comme l'exige Angular 22. Node 25 fonctionne mais n'est pas officiellement supporté.

```sh
cd app
npm install
npm start          # build puis lancement
```

| Commande (dans `app/`) | Effet |
|---|---|
| `npm start` | Build complet puis lance l'application |
| `npm run dev` | Développement : interface rechargée à chaud |
| `npm test` | Tests unitaires |
| `npm run dist` | Exe portable dans `app/release/` |

Si Electron ne démarre pas après `npm install` (binaire non téléchargé) : `node node_modules/electron/install.js`.

## Réglages

Le fichier `kamclick.json` est créé au premier lancement à côté de l'exe (en développement : dans `app/`) et enregistré à chaque modification. S'il est illisible, KamClick repart des valeurs par défaut et en garde une copie (`kamclick.json.invalide`).

## Structure du dépôt

```
app/           Application KamClick 2
  electron/      Process main : fenêtre, raccourcis, moteur de clic, réglages
    platform/    Wrapper OS (implémentation Windows via koffi + SendInput)
  shared/        Types et logique de réglages communs main / interface
  src/           Interface Angular + Angular Material
proto-koffi/   Prototype de validation de koffi dans Electron
doc/           Notes de projet, source de la V1.2, logo et icône
```

## Feuille de route

- **Version 1** : reproduction fonctionnelle de KamClick V1.2. ✅
- **Version 2** : limiter les clics à une fenêtre choisie (liste des fenêtres ouvertes, position relative à la fenêtre, mise au premier plan au démarrage, pause si elle est fermée).
- Plus tard : support Linux via une nouvelle implémentation du wrapper OS.

## Historique

KamClick V1.2 a été écrit en AutoIt en 2011 ; son source est conservé dans [`doc/kamclick.au3`](doc/kamclick.au3).

KamSoft © 2011–2026 · Coded by Kam
