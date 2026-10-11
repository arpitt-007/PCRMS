const puppeteer = require('puppeteer-core');
const fs = require('fs');
const R = 'C:/Users/arpit/OneDrive/Documents/GitHub/PCRMS/report';
const groups = [
  ['Viewer', ['Log in / log out', 'View dashboard', 'Search records', 'View and export reports', 'View case and criminal details']],
  ['Police Officer', ['Register FIR, manage cases', 'Record complaints', 'Manage criminal profiles', 'Record arrests', 'Manage evidence and custody', 'Record court proceedings', 'Manage stations, officers, courts']],
  ['Administrator', ['Delete records']],
];
const RH = 62, X_ACT = 90, X_BOX = 330, OW = 330, OH = 40, TOP = 70;
const out = []; let row = 0; const centers = [];
groups.forEach(([actor, ucs]) => {
  const ys = ucs.map(() => TOP + 20 + (row++) * RH + OH / 2);
  ucs.forEach((u, i) => { out.push({ u, y: ys[i] }); });
  centers.push({ actor, ys, y: (ys[0] + ys[ys.length - 1]) / 2 });
});
const H = TOP + 20 + row * RH + 20, W = 760;
const s = [];
s.push(`<rect x="${X_BOX - 20}" y="${TOP - 36}" width="${OW + 40}" height="${H - TOP + 30}" rx="10" fill="#fafbfd" stroke="#5b5bf0" stroke-width="2"/><text x="${X_BOX + OW / 2}" y="${TOP - 12}" text-anchor="middle" class="b">PCRMS</text>`);
// actor stick figures
const actor = (x, y, name) => `<g stroke="#14213d" stroke-width="2.2" fill="none"><circle cx="${x}" cy="${y - 34}" r="11" fill="#fff"/><line x1="${x}" y1="${y - 23}" x2="${x}" y2="${y + 10}"/><line x1="${x - 20}" y1="${y - 12}" x2="${x + 20}" y2="${y - 12}"/><line x1="${x}" y1="${y + 10}" x2="${x - 16}" y2="${y + 36}"/><line x1="${x}" y1="${y + 10}" x2="${x + 16}" y2="${y + 36}"/></g><text x="${x}" y="${y + 58}" text-anchor="middle" class="a">${name}</text>`;
centers.forEach((c) => { c.ys.forEach((yy) => s.push(`<line x1="${X_ACT + 22}" y1="${c.y - 12}" x2="${X_BOX}" y2="${yy}" stroke="#4b5266" stroke-width="1.5"/>`)); });
out.forEach((o) => s.push(`<ellipse cx="${X_BOX + OW / 2}" cy="${o.y}" rx="${OW / 2 - 10}" ry="${OH / 2 + 3}" fill="#eef0fe" stroke="#5b5bf0" stroke-width="1.8"/><text x="${X_BOX + OW / 2}" y="${o.y + 5}" text-anchor="middle" class="u">${o.u}</text>`));
centers.forEach((c) => s.push(actor(X_ACT, c.y, c.actor)));
// inheritance arrows (hollow triangle) Officer -> Viewer, Administrator -> Officer
const tri = (x, yFrom, yTo) => `<line x1="${x}" y1="${yFrom}" x2="${x}" y2="${yTo + 12}" stroke="#14213d" stroke-width="1.8" stroke-dasharray="5 4"/><polygon points="${x},${yTo} ${x - 8},${yTo + 14} ${x + 8},${yTo + 14}" fill="#fff" stroke="#14213d" stroke-width="1.8"/>`;
s.push(tri(X_ACT + 70, centers[1].y - 48, centers[0].y + 62)); s.push(tri(X_ACT + 70, centers[2].y - 48, centers[1].y + 62));
s.push(`<text x="${X_ACT + 82}" y="${(centers[0].y + centers[1].y) / 2 + 8}" class="n">inherits</text><text x="${X_ACT + 82}" y="${(centers[1].y + centers[2].y) / 2 + 8}" class="n">inherits</text>`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif"><style>.a{font-size:15px;font-weight:700;fill:#14213d}.u{font-size:14.5px;fill:#14213d}.b{font-size:16px;font-weight:700;fill:#5b5bf0}.n{font-size:12px;font-style:italic;fill:#4b5266}</style><rect width="100%" height="100%" fill="#fff"/>${s.join('')}</svg>`;
fs.writeFileSync(R + '/Diagrams_Source/usecase.svg', svg);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 2.5 });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`); await (await p.$('svg')).screenshot({ path: R + '/figures/usecase.png' });
  await b.close(); console.log('ok', W, H);
})();
