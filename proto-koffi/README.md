# Prototype koffi (KamClick 2)

Prototype jetable pour valider koffi dans Electron avant d'écrire la vraie appli Angular.

- `npm start` : interface de test (position du curseur, clics uniques, autoclic avec F1/F2/F3/F10).
- `npm run selftest` : vérifications automatiques, résultat dans `selftest-result.json`. Déplace le curseur et fait 2 vrais clics, uniquement dans une fenêtre de test créée pour l'occasion.
- `npm run dist` : exe portable dans `dist/`. `"KamClickProto 1.0.0.exe" --selftest` pour tester la version empaquetée.

Code utile pour la suite : `src/platform/` (wrapper OS, implémentation Windows) et `src/scheduler.js` (planning absolu).
