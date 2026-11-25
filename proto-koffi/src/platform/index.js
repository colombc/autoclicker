// Point d'entrée du wrapper plateforme : choisit l'implémentation selon l'OS.
// Interface commune : getCursorPos() -> {x, y}, setCursorPos(x, y), click(button, point?)

const implementations = {
  win32: () => require('./win32'),
};

const load = implementations[process.platform];
if (!load) throw new Error(`Plateforme non supportée : ${process.platform}`);

module.exports = load();
