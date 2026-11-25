// Icône carrée KamClick : monogramme « <k> » (comme le « <kam soft> » du logo KamSoft)
// dans l'anneau vert incliné. Dessiné directement en 100×100, traits épais pour rester
// lisible en petit ; intérieur blanc pour rester visible sur une barre des tâches sombre.
const fs = require('fs');

const GREEN = '#59b359';
const DARK = '#1a1a1a';
const T = +(process.env.T ?? 8.5); // épaisseur des traits

// Anneau : ellipse inclinée de -15° comme sur le logo.
const ell = (rx, ry) => {
  const t = (-15 * Math.PI) / 180, cx = 50, cy = 50;
  const p = (sx) => `${+(cx + sx * rx * Math.cos(t)).toFixed(2)} ${+(cy + sx * rx * Math.sin(t)).toFixed(2)}`;
  const arc = `A ${rx} ${ry} -15 1 0`;
  return `M ${p(1)} ${arc} ${p(-1)} ${arc} ${p(1)} Z`;
};
const RX = 48.5, RY = 37, RING = 8;

// Ligne de base et hauteur d'x : les chevrons occupent la hauteur d'x, le k monte au-dessus.
const BASE = 72, XH = 45, ASC = 22;
const mid = (BASE + XH) / 2;
const lt = `M 33 ${XH} L 17 ${mid} L 33 ${BASE}`;
const gt = `M 67 ${XH} L 83 ${mid} L 67 ${BASE}`;
const stemX = 42.5;
const k = `M ${stemX} ${ASC} L ${stemX} ${BASE} M 59 ${XH} L ${stemX} ${mid + 4} M ${stemX + 5} ${mid} L 60 ${BASE}`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="KamClick">
  <path fill="#fff" d="${ell(RX - RING / 2, RY - RING / 2)}"/>
  <path fill="${GREEN}" fill-rule="evenodd" d="${ell(RX, RY)} ${ell(RX - RING, RY - RING)}"/>
  <path fill="none" stroke="${DARK}" stroke-width="${T}" stroke-linejoin="round" d="${lt} ${gt}"/>
  <path fill="none" stroke="${DARK}" stroke-width="${T}" stroke-linejoin="miter" d="${k}"/>
</svg>
`;
fs.writeFileSync(process.argv[2], svg);
console.log('ok', process.argv[2]);
