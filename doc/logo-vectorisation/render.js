// Rend un SVG en PNG (Electron hors écran) pour comparer avec l'original.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const [svgPath, outPng, w, h] = process.argv.slice(-4);
app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: +w, height: +h, show: false, useContentSize: true, transparent: true, backgroundColor: '#00000000', webPreferences: { offscreen: true } });
  const svg = fs.readFileSync(svgPath, 'utf8');
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`<body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${w}" height="${h}" `)}</body>`));
  await new Promise((r) => setTimeout(r, 500));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(outPng, img.toPNG());
  app.exit(0);
});
