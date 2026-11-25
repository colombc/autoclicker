# Notes de Claude — projet kamclick2

> Dossier `doc/` réservé à Claude (accord de l'utilisateur, 2026-11-25).
> Fichier de travail : état du projet, décisions, idées. À tenir à jour.

## État au 2026-11-25

- Pas de dépôt git.
- **Application V2 en cours dans `app/`** (2026-11-25), phase 1 fonctionnelle. Prototype jetable dans `proto-koffi/`.
- Seul fichier de départ : `doc/kamclick.au3`, l'ancienne version (KamClick V1.2, AutoIt, 2011, « KamSoft »).
- **Confirmé** : kamclick2 est une réécriture de cet autoclicker.
- **Stack choisie** : Electron + Angular.
- Aucun code demandé pour le moment : on ne code pas avant que l'utilisateur le demande.
- **Plateforme** : Windows uniquement. Toutes les fonctions propres à l'OS passent par un wrapper (une interface + une implémentation Windows), pour pouvoir ajouter une implémentation Linux plus tard sans toucher au reste.
- **Périmètre de la phase 1** : reproduction à l'identique de la V1.2 (isofonctionnel). Pas de nouvelles fonctions. Les défauts listés plus bas ne sont pas corrigés d'office : toute écart avec la V1.2 se décide avec l'utilisateur.

## Wrapper OS (couche plateforme)

Ce qui dépend de l'OS et passe donc par le wrapper :
- **Clic souris** (gauche/droit, à la position courante ou en X/Y) : module natif, implémentation Windows. Sous Linux, X11 et Wayland diffèrent beaucoup (Wayland bloque la simulation d'entrée).
- **Lecture de la position du curseur** : `screen.getCursorScreenPoint()` est multiplateforme, mais on le met quand même derrière le wrapper (DPI, et ne marche pas sous Wayland).
- **Raccourcis globaux** : `globalShortcut` est multiplateforme sous Windows et X11, mais pas fiable sous Wayland. Derrière le wrapper aussi.
- **Fenêtre au premier plan** : option Electron standard, pas besoin de wrapper a priori.

Le reste (boucle, timing, réglages, UI Angular) ne connaît que l'interface.

## Décisions prises

| Date | Sujet | Décision |
|------|-------|----------|
| 2026-11-25 | Stack | Electron + Angular |
| 2026-11-25 | Plateforme | Windows uniquement, wrapper OS pour garder Linux possible |
| 2026-11-25 | Périmètre phase 1 | Isofonctionnel avec la V1.2 |
| 2026-11-25 | Configuration | Fichier JSON (remplace `autoclick.ini`) |
| 2026-11-25 | Contenu du JSON | Raccourcis + réglages (intervalle, aléatoire, bouton, position…) |
| 2026-11-25 | Emplacement du JSON | À côté de l'exe : version portable |
| 2026-11-25 | Librairie UI | Angular Material |
| 2026-11-25 | Sauvegarde | À chaque modification des réglages |
| 2026-11-25 | Boutons | Boutons Démarrer/Arrêter dans l'UI, en plus des raccourcis (écart volontaire avec la V1.2) |
| 2026-11-25 | Textes des raccourcis | Les libellés affichent le raccourci réellement configuré (« F10 pour quitter », « F3 pour capturer la position »…), plus de « esc » en dur ni de `{F3}` brut |
| 2026-11-25 | Versions | Dernières versions stables d'Angular et d'Electron au moment de l'initialisation (à relever avec `npm view @angular/core version` / `npm view electron version`, ne pas se fier à ma mémoire) |
| 2026-11-25 | Module de clic | koffi + API Win32 (`SendInput`, `GetCursorPos`/`SetCursorPos`), derrière le wrapper OS. Plan B : robotjs 0.9.1 |
| 2026-11-25 | Rythme | Planning absolu basé sur l'horloge (`t0 + k × intervalle`) avec `setTimeout`. Rythme moyen exact, quelques ms de gigue par clic acceptées |
| 2026-11-25 | Clics sur la fenêtre | Un clic qui tomberait dans la fenêtre de KamClick est ignoré |
| 2026-11-25 | Intervalle | Minimum de 10 ms (s'applique aussi au mode aléatoire) |
| 2026-11-25 | Interface | Look web moderne : mêmes fonctions et mêmes contrôles que la V1.2, mais la mise en page 400x400 et le style Win32 ne sont pas à reproduire |

## Interface : touche web moderne

Mêmes contrôles que la V1.2 : statut, compteur, intervalle h/min/s/centièmes, mode aléatoire avec plage et unité, bouton gauche/droit, position X/Y + raccourci, rappel des raccourcis. Idées de forme (à valider) :
- Thème clair/sombre (suivre le thème Windows).
- Statut bien visible (pastille ou bandeau vert/rouge) avec le compteur en gros.
- Regroupement en cartes : Intervalle / Aléatoire / Bouton / Position.
- Boutons Démarrer/Arrêter (décidé), en plus des raccourcis.
  - Piège : sans position fixe, les clics partent à la position du curseur, qui est sur le bouton Démarrer juste après l'avoir cliqué. Les clics tombent alors dans la fenêtre de KamClick (et peuvent toucher Arrêter ou un champ). **Décidé : on ignore les clics qui tombent dans la fenêtre.**
  - Test dans le process main avant chaque clic : point visé (curseur ou X/Y fixe) dans `win.getBounds()`, et fenêtre visible et non réduite. `getBounds()` et `getCursorScreenPoint()` sont tous deux en DIP, donc comparables. Attention si les X/Y fixes sont en pixels physiques (DPI) : convertir avant de comparer.
  - S'applique aussi à une position fixe X/Y qui tomberait sur la fenêtre (choix de Claude, cohérent avec la règle ; à signaler si ça pose problème).
  - Un clic ignoré n'est pas compté, mais le rythme continue : la boucle attend l'intervalle suivant normalement (choix de Claude).
- Fenêtre compacte, toujours au premier plan, sans barre de menu.
- Librairie : Angular Material (décidé). Thème M3, clair/sombre.
- Image `data.kam` : remplacer par un logo/en-tête ? à voir.

## Pistes techniques Electron + Angular (rien n'est décidé)

- **Clics souris** : koffi + `SendInput` (décidé, voir le comparatif plus bas).
- **Raccourcis globaux** : `globalShortcut` d'Electron suffit pour F1/F2/F3/F10.
- **Position de la souris** : `screen.getCursorScreenPoint()` côté main. Attention au facteur DPI quand on la renvoie au module de clic.
- **Fenêtre toujours au premier plan** : `win.setAlwaysOnTop(true, 'pop-up-menu')` après création. PAS `alwaysOnTop: true` (ignoré par Electron 45 sous Windows, voir Prototype).
- **Architecture** : la boucle de clic tourne dans le process main, pour ne pas dépendre du throttling du renderer. Angular ne fait que l'UI et communique via IPC (`contextBridge`/preload, `contextIsolation` activé).
- **Timing** (décidé) : planning absolu sur l'horloge, simple `setTimeout`, intervalle minimal 10 ms. Pas besoin de précision à la milliseconde par clic. **Nécessite `timeBeginPeriod(1)` pendant les clics** (voir Prototype), sinon 10 ms → 15,6 ms.
  - Mode fixe : clic n° k prévu à `t0 + k × intervalle`, avec `t0` pris au démarrage et une horloge monotone (`performance.now()` / `process.hrtime`). Un clic en retard ne décale pas les suivants : l'erreur ne s'accumule plus.
  - Mode aléatoire : prochain clic = heure prévue du précédent + tirage aléatoire.
  - Gros retard (PC chargé, plus d'un intervalle de retard) : pas de rafale de rattrapage, on repart de « maintenant ».
  - Précision d'un clic isolé : limitée par le timer Windows (~1 à 16 ms), jugé acceptable par l'utilisateur. Pas d'attente active, donc pas besoin de worker : le moteur peut rester dans le process main.
  - Piège nut-js : `mouse.config.autoDelayMs` vaut 100 ms par défaut, à mettre à 0 sinon chaque clic ajoute 100 ms.
  - Vérification : test qui mesure les écarts réels sur ~1000 clics (moyenne et écart-type) avec un faux wrapper de clic.
- **Persistance** : JSON à côté de l'exe (décidé), contenant raccourcis + réglages. Fichier maison plutôt qu'`electron-store` (qui écrit dans userData).
  - Piège : avec la cible `portable` d'electron-builder, l'exe se décompresse dans %TEMP% et `process.execPath` pointe là-bas. Il faut utiliser la variable d'env `PORTABLE_EXECUTABLE_DIR` (repli sur `path.dirname(process.execPath)` en build non portable / dev).
  - Prévoir le cas où le dossier n'est pas accessible en écriture (ex. Program Files) : avertir plutôt que planter.
  - Fichier absent ou JSON invalide : valeurs par défaut de la V1.2 (F1/F2/F3/F10, tout à 0, clic gauche).
  - Sauvegarde à chaque modification (décidé). Prévoir un debounce (~300 ms) pour ne pas écrire à chaque frappe, et une écriture atomique (fichier temporaire puis renommage) pour ne pas corrompre le JSON si l'appli est tuée pendant l'écriture. Forcer l'écriture en attente à la fermeture.
  - Le compteur de clics n'est pas un réglage : il n'est pas sauvegardé (remis à 0 au Stop, comme en V1.2).
- **Outillage** : Angular CLI + Electron (electron-builder ou Electron Forge pour le packaging Windows).

## Comparatif des modules natifs de clic (recherche du 2026-11-25)

| Option | Binaires précompilés Win x64 | Compat. Electron récent | Maintenance | Linux plus tard | Verdict |
|---|---|---|---|---|---|
| **koffi + `user32.SendInput`** (FFI) | Oui, inclus dans le paquet npm | N-API, stable d'une version d'Electron à l'autre | Active (v3.x en 2026) | Oui : même approche avec libXtst (X11) | **Recommandé** |
| **robotjs 0.9.1** (upstream) | Oui (Node-API + prebuildify) | N-API | Relancé en 2026 après des années d'abandon, publication manuelle | Oui (X11) | Plan B |
| `@hurdlegroup/robotjs` | Oui | N-API | Fork, dernière publication il y a ~7 mois | Oui (X11) | Repli |
| `@jitsi/robotjs` | Oui | N-API | Fork qui s'annonce abandonné maintenant que l'upstream a repris ses changements | Oui (X11) | Écarté |
| `@nut-tree/nut-js` | Payant (abonnement ~20 $/mois) ; gratuit seulement en compilant soi-même | N-API | Active | Oui | Écarté (coût ou build lourd, API surdimensionnée, piège `autoDelayMs`) |
| Addon C++ maison (node-addon-api) | Non, il faut Visual Studio Build Tools | N-API | À notre charge | À écrire | Écarté (trop de maintenance pour 3 fonctions) |
| Lancer PowerShell / un exe externe | Sans objet | Sans objet | Sans objet | Sans objet | Écarté (trop lent pour 10 ms) |

**Pourquoi koffi + SendInput :**
- On n'a besoin que de 3 choses : position du curseur, déplacement, clic gauche/droit. C'est quelques appels Win32 (`SendInput`, `SetCursorPos` / `GetCursorPos`).
- `SendInput` est l'API recommandée par Microsoft (`mouse_event` est obsolète).
- Aucune dépendance à une lib d'automatisation dont la maintenance est fragile. koffi est une lib FFI générique, maintenue et livrée avec ses binaires.
- Ça tombe pile dans le wrapper OS : l'implémentation Windows = un petit module koffi ; l'implémentation Linux plus tard = koffi + libXtst, même structure.

**Points d'attention :**
- Certaines versions de koffi ont été publiées avec des binaires cassés (2.5.13-2.5.15, 2.6.2, 2.8.3) : figer une version testée.
- Déclarer correctement la structure `INPUT` (union) ; taille attendue 40 octets en x64, à vérifier avec `koffi.sizeof`.
- DPI : `SetCursorPos` attend des pixels physiques si le process est DPI-aware (Electron l'est), alors que `screen.getCursorScreenPoint()` renvoie des DIP. Utiliser `screen.dipToScreenPoint()` ou lire la position via `GetCursorPos` pour rester dans la même unité.
- Packaging : vérifier qu'electron-builder embarque bien le binaire de koffi (sortie de l'asar via `asarUnpack` si nécessaire).
- Valable pour toutes les options : Windows (UIPI) bloque les clics simulés vers une fenêtre lancée en administrateur si KamClick ne l'est pas. Comportement identique à la V1.2.
- Premier pas quand on passera au code : un mini-prototype (clic gauche/droit + position, dans Electron packagé) pour valider koffi avant de construire le reste. Si ça coince, basculer sur robotjs 0.9.1 : le wrapper isole ce choix.

## Phase 2 (prévue) : limiter les clics à une fenêtre

Demande de l'utilisateur (2026-11-25) : pouvoir restreindre les clics à une fenêtre choisie, donc lister les fenêtres disponibles. **Ne pas coder en phase 1**, mais garder le wrapper prêt pour ça (koffi le permet).

**Lister les fenêtres (Win32 via koffi)** :
- `EnumWindows` + callback (koffi gère les callbacks via `koffi.register`).
- Filtrer : `IsWindowVisible`, titre non vide (`GetWindowTextW`), pas de fenêtre outil (`GetWindowLongPtrW` + `WS_EX_TOOLWINDOW`), pas de fenêtre « cloaked » (`DwmGetWindowAttribute(DWMWA_CLOAKED)`, sinon on voit des applis UWP fantômes), pas de fenêtre possédée (`GetWindow(GW_OWNER)`).
- Pour l'affichage : titre + nom du process (`GetWindowThreadProcessId` → `OpenProcess` → `QueryFullProcessImageNameW`). Icône possible plus tard (`app.getFileIcon(exePath)` d'Electron).
- Exclure la fenêtre de KamClick elle-même.
- Alternative écartée : `desktopCapturer.getSources({types:['window']})` d'Electron liste les fenêtres mais est fait pour la capture d'écran (lent, miniatures, pas d'infos process).

**Identifier la fenêtre dans la durée** : le HWND change à chaque lancement de l'appli cible. Pour la sauvegarde JSON, garder nom du process + titre, et retrouver la fenêtre au démarrage. Si elle est fermée pendant les clics : arrêter ou mettre en pause (à décider).

**Sens de « limiter à une fenêtre »** : trois interprétations étudiées :
1. **Garde-fou** : on ne clique que si le point visé est sur la fenêtre choisie (`WindowFromPoint` + `GetAncestor(GA_ROOT)` == HWND choisi), sinon le clic est ignoré. Même mécanique que la règle « ignorer les clics sur KamClick ». Simple et fiable.
2. **Position relative** : X/Y exprimés dans la zone client de la fenêtre (`ClientToScreen`), les clics suivent la fenêtre si on la déplace. Combinable avec 1.
3. **Clic en arrière-plan** : envoyer `WM_LBUTTONDOWN/UP` via `PostMessage` sans bouger la souris ni changer le focus. Séduisant mais peu fiable : ignoré par beaucoup d'applis (jeux DirectX, Chromium/Electron, applis qui lisent l'état réel de la souris).

**Décidé (2026-11-25) : options 1 + 2 combinées.**
- Position fixe cochée : X/Y relatifs au coin haut-gauche de la zone client de la fenêtre choisie (`ClientToScreen`). Les clics suivent la fenêtre si elle bouge. Le raccourci « capturer la position » enregistre la position relative à la fenêtre (`ScreenToClient`).
- Sans position fixe : clic à la position du curseur, uniquement s'il est sur la fenêtre choisie.
- Dans tous les cas, garde-fou : le point visé doit appartenir à la fenêtre choisie (`WindowFromPoint` + `GetAncestor(GA_ROOT)`). Fenêtre recouverte par une autre, réduite ou hors écran → clic ignoré, non compté, le rythme continue (même règle que pour la fenêtre de KamClick).
- Aucune fenêtre choisie → comportement de la phase 1 (écran entier).

- Fenêtre choisie fermée pendant les clics → **pause** (décidé). Reprise **manuelle uniquement** (F1 ou bouton Démarrer), même si la fenêtre réapparaît (décidé).
  - Pause ≠ Stop : le compteur n'est pas remis à 0 (le Stop de la V1.2 remet à 0). À la relance, on retrouve la fenêtre (process + titre) et on la remet au premier plan ; si elle est introuvable, on reste en pause avec un message. Choix de Claude, à signaler.
  - Afficher clairement l'état « En pause : fenêtre fermée » (3e état en plus de En cours / À l'arrêt).
- **Mettre la fenêtre au premier plan au démarrage** (demandé, à faire en phase 2) :
  - `IsIconic` → `ShowWindow(SW_RESTORE)` si réduite, puis `SetForegroundWindow(hwnd)`.
  - Restriction Windows : seul un process qui a « le droit au premier plan » peut le faire. Démarrage via le bouton Démarrer : KamClick est au premier plan, donc OK. Démarrage via le raccourci global (F1) : `globalShortcut` utilise `RegisterHotKey`, et recevoir un hotkey donne normalement ce droit. **À vérifier en prototype.** Repli connu si refusé : simuler un appui sur Alt via `SendInput` juste avant (astuce classique), en dernier recours `AttachThreadInput`.
  - Vérifier ensuite avec `GetForegroundWindow` et attendre un court délai (~100 ms, à ajuster) avant le premier clic, le temps que la fenêtre s'affiche.
  - KamClick reste « toujours au premier plan » : il reste visible au-dessus de la cible. Les clics qui tomberaient sur KamClick sont déjà ignorés.
  - Option désactivable dans les réglages ? À voir.

**Option 3 (clic en arrière-plan)** : souhaitée « si possible ». Techniquement possible mais pas universel : marche sur une partie des applis Win32 classiques, échoue sur beaucoup d'autres (jeux, navigateurs, Electron…), et on ne peut pas savoir à l'avance si la cible l'accepte. Proposition : en phase 2, faire un test rapide sur les applis que l'utilisateur vise. Si c'est concluant, l'ajouter comme case à cocher « clic en arrière-plan (expérimental) », désactivée par défaut ; sinon l'abandonner.

**Cibles et tests** (2026-11-25) : pas de cible définie, l'appli doit servir dans tous les cas. Appli de test choisie par l'utilisateur : **la Calculatrice Windows**.
- Bon test difficile : c'est une appli UWP/WinUI. La fenêtre de premier niveau appartient à `ApplicationFrameHost.exe`, le contenu à `CalculatorApp.exe` (fenêtre enfant `Windows.UI.Core.CoreWindow`). Pour afficher le bon nom de process dans la liste, il faut descendre dans la fenêtre enfant (`EnumChildWindows`) et prendre le process de la CoreWindow.
- Réduite, la Calculatrice détache sa CoreWindow et peut apparaître « cloaked » : vérifier que la liste, le garde-fou et la remise au premier plan marchent dans ce cas.
- Clic en arrière-plan sur la Calculatrice : très probablement un échec (XAML ne lit pas les messages souris postés à la fenêtre).
- **2e appli de test : le Bloc-notes** (décidé). Attention : sous Windows 11 (machine de l'utilisateur), le Bloc-notes est la nouvelle version (onglets, interface XAML dans une fenêtre Win32, zone de texte RichEdit), donc pas un Win32 100 % classique. Le clic en arrière-plan y a plus de chances qu'avec la Calculatrice, sans garantie. Si ça échoue aussi, prendre une 3e cible purement Win32 pour trancher, par exemple la Table des caractères (`charmap.exe`).
- Comme il n'y a pas de cible fixe, l'option « clic en arrière-plan », si elle est retenue, reste expérimentale et désactivée par défaut.

**Linux plus tard** : X11 permet de lister (`_NET_CLIENT_LIST`) ; Wayland ne le permet pas (pas d'accès aux fenêtres des autres applis).

## Application `app/` (phase 1) — état au 2026-11-25

Structure : `electron/` (main TS → `dist-electron/`), `electron/platform/` (wrapper OS, `win32.ts`), `shared/` (types + `settings.ts` commun main/UI), `src/` (Angular 22, zoneless, signals, Angular Material M3). Voir `app/README.md` pour les commandes.

**Fonctionnel et testé** :
- Interface Material clair/sombre (suit Windows), polices et icônes embarquées (`@fontsource/roboto`, `material-symbols`).
- E2E réel (fenêtre cible de test, scripts dans le scratchpad, non conservés) : F1/F2 + position fixe + clic droit à 50 ms → 49 clics en ~2 s, écart moyen 49,6 ms. F3 met à jour X/Y en direct dans l'UI. Clics visant KamClick ignorés (compteur à 0). F10 quitte.
- Exe portable (`npm run dist` → `release/KamClick-2.0.0.exe`, ~110 Mo) : `kamclick.json` créé à côté de l'exe, modifs UI enregistrées. asar = 4,9 Mo, seul koffi dans node_modules.
- 9 tests unitaires (`npm test`) : normalisation des réglages, calcul d'intervalle, rendu UI.

**Choix faits par Claude (à signaler / valider)** :
- Interface en français (la V1.2 était en anglais).
- Une seule instance autorisée (`requestSingleInstanceLock`) : 2 instances se disputeraient raccourcis et JSON.
- Compteur en affichage seul (en V1.2 c'était un champ éditable, sans effet utile).
- Plage aléatoire inversée (De > À) acceptée en triant les bornes (en V1.2 AutoIt renvoyait 0 → rafale).
- Champs grisés visuellement quand inactifs (aléatoire off, position off, intervalle fixe remplacé par l'aléatoire) mais toujours éditables, comme en V1.2.
- Ajout d'une ligne « Un clic toutes les … » sous l'intervalle.
- Raccourcis affichés à la française (`Ctrl`, `Maj`).
- JSON illisible → valeurs par défaut + copie `kamclick.json.invalide`.
- Erreur de clic (SendInput bloqué, ex. fenêtre admin) affichée sous le compteur, les clics continuent.
- Image `data.kam` de la V1.2 non reprise (remplacée par l'en-tête avec icône).
- Comme en V1.2 : Stop remet le compteur à 0 (on ne voit donc pas le total final). Point à rediscuter avec l'utilisateur.

**Pièges rencontrés** :
- `npm install` n'a pas exécuté le postinstall d'Electron (binaire absent) : `node node_modules/electron/install.js`.
- Build Angular de prod : `inlineCritical` ajoute un `onload` inline bloqué par la CSP → la feuille de styles (avec les @font-face) n'était jamais appliquée. Désactivé dans `angular.json` (`optimization.styles.inlineCritical: false`).
- `@use` Sass d'un fichier `400.css` impossible (namespace invalide) → CSS de polices déclarés dans `angular.json > styles`.
- Angular déplacé en devDependencies (compilé dans le bundle) pour que electron-builder n'embarque que koffi.
- Avec `ng new` : Angular CLI avertit que Node 25 n'est pas officiellement supporté (fonctionne).
- Observé une fois, non reproduit : un premier clic sur l'UI juste après le lancement de l'exe n'a pas été pris en compte.
- Ne jamais faire `taskkill /IM electron.exe` : tue aussi les autres instances Electron de l'utilisateur. Arrêter par chemin/PID.
- **Avant un test qui simule F1/F2/F3/F10 : vérifier qu'aucune instance de l'utilisateur ne tourne** (`Get-Process KamClick*, electron`). Le 2026-11-25, un F10 simulé a fermé l'exe que l'utilisateur avait lancé (il détenait les raccourcis globaux). L'instance dev (`electron .`) et l'exe ont des verrous d'instance unique distincts, donc peuvent coexister.

**Logo KamSoft (2026-11-25)** : l'utilisateur a fourni `doc/data.png` (le `data.kam` de la V1.2, 200x100, noir #1a1a1a + anneau vert #59b359, fond transparent). Vectorisé en `doc/kamsoft.svg` :
- Anneau = 2 ellipses ajustées par moindres carrés (Fitzgibbon) sur les bords vert/transparent, en un seul `<path>` evenodd (pas de `<mask>` à id, qui entrerait en conflit si le SVG est inséré plusieurs fois).
- Lettres = potrace (npm `potrace`) sur l'image ×8, après séparation noir/vert des pixels de bord via le canal G (sinon encoches aux contacts lettres/anneau).
- Écart moyen avec l'original : 4,5/255. Scripts dans `doc/logo-vectorisation/` (`prep.py` nécessite numpy + Pillow ; `build.js` nécessite `potrace` ; `render.js` rend un SVG en PNG avec Electron).
- Dans l'appli : composant `src/app/kamsoft-logo/` (template = le .svg, inséré dans la page) dans le pied de page ; le texte prend `--mat-sys-on-surface` → lisible en thème sombre (vérifié avec `--force-dark-mode`).

**Icône carrée (2026-11-25)** : demandée par l'utilisateur. `doc/kamclick-icon.svg` = monogramme « <k> » (rappel du « <kam soft> ») dans l'anneau vert incliné, intérieur blanc (visible sur barre des tâches sombre).
- Glyphes redessinés en traits épais (8,5/100) et non repris du tracé : dans l'original l'anneau passe par-dessus la base du « < » et la jonction du « k », les glyphes tracés ont donc des trous. Le texte complet « kam soft » serait illisible en 16 px.
- Générateur : `doc/logo-vectorisation/icon.js` (+ `sheet.py` = planche 16/32/48 px sur fond clair et sombre, `render.js` rend avec transparence).
- `app/build/icon.ico` (16→256 px, Pillow) + `icon.png` 512 ; `win.icon` dans electron-builder (vérifié : l'exe porte l'icône) ; icône de fenêtre via `BrowserWindow.icon` (fichier `build/icon.ico` ajouté aux `files`) ; même .ico en `public/favicon.ico`.
- Icône de fenêtre en dev non vérifiée visuellement : une instance dev de l'utilisateur tournait, je ne l'ai pas touchée.

**Reste à faire / à vérifier** :
- Thème sombre : vérifié visuellement avec `electron . --force-dark-mode` (OK).
- DPI ≠ 100 % : toujours non testé.

## Prototype koffi : résultats (2026-11-25)

Dossier `proto-koffi/` (jetable, mais `src/platform/` et `src/scheduler.js` sont réutilisables). Versions relevées : Electron 45.5.0, koffi 3.3.8, electron-builder 26.18.0, Angular 22.3.0 (dernière stable au 2026-11-25). Node 25.2.1 sur la machine.

**Validé (en dev ET dans l'exe portable)** :
- koffi se charge dans Electron 45 ; `sizeof(INPUT)` = 40.
- `GetCursorPos` / `SetCursorPos` : OK, aller-retour exact.
- `SendInput` : vrais clics gauche (button 0) et droit (button 2) reçus au pixel près dans une fenêtre de test.
- Packaging : koffi 3 est en paquets séparés (`@koromix/koffi-win32-x64`). Avec `asarUnpack: ["node_modules/koffi/**", "node_modules/@koromix/**"]`, le `.node` est bien sorti de l'asar et se charge.
- Exe portable : `PORTABLE_EXECUTABLE_DIR` = dossier du vrai exe ; `process.execPath` pointe bien vers `%TEMP%\<aléatoire>`. Le piège noté plus haut est confirmé.

**Découverte importante sur le rythme** : sans réglage, `setTimeout` est limité par le timer Windows (~15,6 ms). Résultat : intervalle de 10 ms → 15,7 ms en moyenne (64 clics/s au lieu de 100). Le planning absolu corrige la moyenne à partir d'environ 50 ms, mais pas en dessous.
- Correction : `timeBeginPeriod(1)` (winmm.dll via koffi) pendant les clics, `timeEndPeriod(1)` à l'arrêt. Mesures : 10 ms → 9,99 ms (écart-type 0,7 ms) ; 50 ms → 49,97 ; 100 ms → 99,95 (écart-type < 1 ms).
- Ajouté au wrapper : `setHighResTimer(bool)`. À activer seulement pendant les clics (coût énergie). Sous Linux plus tard : no-op.
- Attention Windows 11 : la résolution demandée peut être ignorée si la fenêtre du process est réduite/masquée. KamClick reste au premier plan donc OK, mais à re-vérifier si on ajoute un mode tray.

**Bug trouvé par l'utilisateur : la fenêtre ne restait pas au premier plan.** Electron 45.5.0 sous Windows :
- `alwaysOnTop: true` dans le constructeur de `BrowserWindow` est ignoré (`isAlwaysOnTop()` = false, pas de `WS_EX_TOPMOST`).
- `setAlwaysOnTop(true)` avec le niveau par défaut `floating` aussi, ainsi que `torn-off-menu`, `modal-panel`, `main-menu`, `status`.
- Seuls `pop-up-menu` et `screen-saver` posent vraiment `WS_EX_TOPMOST`.
- Correctif : `win.setAlwaysOnTop(true, 'pop-up-menu')` juste après la création. Vérifié : tient après chargement, réduction/restauration, masquage/affichage. **Confirmé par l'utilisateur en usage réel.**
- Régression ou changement d'Electron non documenté à ma connaissance : re-vérifier à chaque montée de version d'Electron (le selftest pourrait contrôler `WS_EX_TOPMOST`).

**Pas encore validé (demande une action de l'utilisateur)** :
- DPI : la machine n'a qu'un écran 1920x1080 à 100 %, donc DIP = physique, la conversion n'est pas testée. Tester avec une mise à l'échelle à 125/150 %.
- ~~Raccourcis globaux et clics dans la Calculatrice~~ : testés par l'utilisateur (« ça a l'air de bien fonctionner »).
- SendInput vers une fenêtre admin (UIPI) : non testé, attendu bloqué.

## Ce que fait la V1.2 (référence fonctionnelle)

**Raccourcis globaux** (lus dans `autoclick.ini`, section `[cfg]`) :
| Clé ini   | Défaut | Action |
|-----------|--------|--------|
| `start`   | F1     | démarre les clics |
| `stop`    | F2     | arrête et remet le compteur à 0 |
| `setPoss` | F3     | copie la position actuelle de la souris dans X/Y |
| `esc`     | F10    | quitte |

**Interface** (fenêtre 400x400, toujours au premier plan, style ex `0x18` = TOPMOST|ACCEPTFILES) :
- Statut en cours / à l'arrêt (rouge/vert) + compteur de clics.
- Intervalle fixe : heures / minutes / secondes / centièmes.
- Mode aléatoire : plage [A, B] en ms, secondes ou minutes (remplace l'intervalle fixe).
- Bouton : gauche ou droit.
- Position fixe optionnelle (X, Y), sinon clic à la position courante.
- Image décorative `data.kam` (en réalité un fichier image).

**Boucle** : un clic par itération, puis attente active (`sleep(10)` + `TimerDiff`) jusqu'à la fin de l'intervalle, en interrogeant `GUIGetMsg` pour gérer la fermeture.

## Défauts / limites relevés dans la V1.2

- Le label affiche « esc to quit » alors que la touche est F10 par défaut.
- Le libellé `setPoss` est mal concaténé : on obtient `{F3} to set position` (syntaxe brute de HotKeySet).
- Dérive du rythme. Correction de ma première analyse : le temps du clic EST compté (`$begin` est pris avant le clic). Le vrai problème : l'attente se fait par pas de `sleep(10)` (en pratique ~15,6 ms, la résolution du timer Windows), donc chaque période dépasse de 0 à ~16 ms, et comme chaque période repart de « maintenant », ces retards s'additionnent. Exemple : intervalle de 100 ms → plutôt 105 à 115 ms en moyenne.
- Intervalle de 0 : environ 1 clic toutes les 10 ms, sans garde-fou.
- Pas de validation des saisies (plage A > B, valeurs négatives ou non numériques).
- Pas de nombre maximal de clics ni de durée limite.
- Pas de clic du milieu, pas de double clic.
- Les réglages ne sont pas sauvegardés (seuls les raccourcis viennent du .ini).
- Le fichier `autoclick.ini` est lu en chemin relatif, donc il dépend du répertoire courant.
- Encodage : le `©` est cassé (fichier ANSI).
- Includes inutilisés (GDIPlus, WinAPI).

## Questions ouvertes (à poser à l'utilisateur au moment voulu)

- DPI : tester avec une mise à l'échelle ≠ 100 % (jamais testé, ni dans le prototype ni dans l'appli).
- Stop remet le compteur à 0 (comme la V1.2) : le garder, ou laisser le total visible jusqu'au prochain démarrage ?
- Valider les choix faits par Claude dans l'appli (section Application `app/`).
- Autres idées de phase 2, non demandées : séquences multi-positions, enregistrement/relecture, profils, limite de clics, tray…

## Journal

- 2026-11-25 : lecture de la V1.2 et création de ces notes.
- 2026-11-25 : objectif confirmé (réécriture de la V1.2). Stack Electron + Angular. Pas de code pour l'instant.
- 2026-11-25 : Windows uniquement, avec un wrapper sur tout ce qui dépend de l'OS pour garder Linux possible. Phase 1 = isofonctionnel avec la V1.2.
- 2026-11-25 : config en JSON, intervalle minimum 10 ms, interface au look web moderne.
- 2026-11-25 : JSON = raccourcis + réglages, à côté de l'exe (portable). UI en Angular Material.
- 2026-11-25 : sauvegarde à chaque modification. Ajout de boutons Démarrer/Arrêter.
- 2026-11-25 : les clics qui tombent dans la fenêtre de KamClick sont ignorés (option 2).
- 2026-11-25 : les libellés suivent les raccourcis configurés. Proposition d'un planning absolu pour corriger la dérive. Correction de mon analyse de la V1.2 (le temps du clic était bien compté).
- 2026-11-25 : rythme validé : planning absolu sur l'horloge, sans précision à la ms. Moteur dans le process main.
- 2026-11-25 : dernières versions d'Angular et d'Electron. Phase 1 entièrement cadrée, reste le choix du module natif de clic.
- 2026-11-25 : comparatif des modules de clic. Recommandation : koffi + SendInput, plan B robotjs 0.9.1.
- 2026-11-25 : koffi validé. Phase 2 annoncée : limiter les clics à une fenêtre (liste des fenêtres). Notes techniques ajoutées, sens exact à clarifier.
- 2026-11-25 : phase 2 = garde-fou + position relative à la fenêtre. Clic en arrière-plan : à tester en phase 2, option expérimentale si concluant.
- 2026-11-25 : phase 2, pause si la fenêtre est fermée. Demande : passer la fenêtre au premier plan au démarrage (faisable, à vérifier avec le raccourci global).
- 2026-11-25 : phase 2, reprise manuelle après une pause pour fenêtre fermée.
- 2026-11-25 : pas de cible définie (usage général). Appli de test : Calculatrice Windows.
- 2026-11-25 : Bloc-notes ajouté comme 2e appli de test (repli possible : charmap.exe).
- 2026-11-25 : prototype koffi dans `proto-koffi/`. Clics, position, packaging portable OK. Rythme : `timeBeginPeriod(1)` nécessaire pour tenir 10 ms. DPI et raccourcis restent à tester par l'utilisateur.
- 2026-11-25 : bug « pas au premier plan » signalé par l'utilisateur. Cause : Electron 45 ignore `alwaysOnTop: true` et le niveau `floating`. Correctif : niveau `pop-up-menu`.
- 2026-11-25 : l'utilisateur confirme que le premier plan fonctionne. Prototype validé en usage (clics, raccourcis, Calculatrice). Reste : DPI ≠ 100 %.
- 2026-11-25 : application phase 1 créée dans `app/` (Electron 45 + Angular 22 + Material). Testée en E2E et en exe portable.
- 2026-11-25 : logo KamSoft vectorisé (`doc/kamsoft.svg`) et ajouté au pied de page de l'appli. Thème sombre vérifié. Incident : F10 simulé a fermé l'instance de l'utilisateur.
- 2026-11-25 : icône carrée « <k> » créée et intégrée (exe, fenêtre, favicon).
