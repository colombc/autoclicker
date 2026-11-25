// Trace les lettres (potrace) et assemble le SVG final avec l'anneau en ellipses.
const fs = require('fs');
const path = require('path');
const potrace = require('potrace');

const dir = __dirname;
const out = process.argv[2];
const prep = JSON.parse(fs.readFileSync(path.join(dir, 'prep.json'), 'utf8'));
const S = prep.scale;
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

potrace.trace(
  path.join(dir, 'letters_x8.png'),
  { threshold: 128, turdSize: 20, optTolerance: 0.4, alphaMax: 0.9, optCurve: true },
  (err, svg) => {
    if (err) throw err;
    let d = svg.match(/ d="([^"]+)"/)[1];
    // Coordonnées ramenées à l'échelle 200×100, arrondies à 0,01.
    d = d.replace(/-?\d+(\.\d+)?/g, (n) => String(+(+n / S).toFixed(2)));
    // Ellipse tournée en chemin (deux arcs), pour un anneau en un seul <path> evenodd.
    const ellipsePath = (e) => {
      const t = (e.angle * Math.PI) / 180;
      const px = (sx) => +(e.cx + sx * e.rx * Math.cos(t)).toFixed(2);
      const py = (sx) => +(e.cy + sx * e.rx * Math.sin(t)).toFixed(2);
      const arc = `A ${e.rx.toFixed(2)} ${e.ry.toFixed(2)} ${e.angle.toFixed(2)} 1 0`;
      return `M ${px(1)} ${py(1)} ${arc} ${px(-1)} ${py(-1)} ${arc} ${px(1)} ${py(1)} Z`;
    };
    const svgOut = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" role="img" aria-label="KamSoft">
  <path class="kamsoft-ring" fill="${hex(prep.green_color)}" fill-rule="evenodd" d="${ellipsePath(prep.outer)} ${ellipsePath(prep.inner)}"/>
  <path class="kamsoft-text" fill="${hex(prep.dark_color)}" d="${d}"/>
</svg>
`;
    fs.writeFileSync(out, svgOut);
    console.log('ok', svgOut.length, 'octets');
  },
);
