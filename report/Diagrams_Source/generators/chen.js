// Chen-notation ER diagram generated from the live schema (schema.json). Attribute placement is automatic and collision-checked.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const R = 'C:/Users/arpit/OneDrive/Documents/GitHub/PCRMS/report';
const schema = JSON.parse(fs.readFileSync(R + '/schema.json', 'utf8'));
const entities = ['PoliceStation', 'Officer', 'AppUser', 'EvidenceCustody', 'Complaint', 'Cases', 'Arrest', 'Evidence', 'CourtProceeding', 'CaseStatusLog', 'Criminal', 'Court'];
const pos = { AppUser: [1075, 110], PoliceStation: [250, 420], Officer: [1075, 420], EvidenceCustody: [1900, 420], Complaint: [250, 800], Cases: [800, 800], Arrest: [1350, 800], Evidence: [1900, 800], CourtProceeding: [250, 1200], CaseStatusLog: [800, 1250], Criminal: [1350, 1250], Court: [250, 1600] };
// relationships: [name, many-side entity, one-side entity, many side total participation?]
const rels = [
  ['employs', 'Officer', 'PoliceStation', true], ['receives', 'Complaint', 'PoliceStation', true], ['handles', 'Cases', 'Officer', true],
  ['makes', 'Arrest', 'Officer', true], ['records custody', 'EvidenceCustody', 'Officer', true], ['has login', 'AppUser', 'Officer', false],
  ['originates from', 'Complaint', 'Cases', false], ['leads to', 'Arrest', 'Cases', true], ['arrested in', 'Arrest', 'Criminal', true],
  ['yields', 'Evidence', 'Arrest', true], ['tracked by', 'EvidenceCustody', 'Evidence', true], ['hosts', 'CourtProceeding', 'Court', true],
  ['tried in', 'CourtProceeding', 'Cases', true], ['status history', 'CaseStatusLog', 'Cases', true],
];
const mn = { name: 'involves', a: 'Criminal', b: 'Cases', attrs: ['role'] }; // CriminalCase junction table
const fkCols = new Set(schema.fks.map((f) => f.t.toLowerCase() + '.' + f.c));
const attrsOf = (e) => schema.cols.filter((c) => c.t.toLowerCase() === e.toLowerCase() && !fkCols.has(e.toLowerCase() + '.' + c.c)).map((c) => ({ n: c.c, pk: c.k === 'PRI', uk: c.k === 'UNI' }));

const TW = (s, fs_) => s.length * fs_ * 0.54;
const SC = 0.86; Object.keys(pos).forEach((k) => { pos[k] = [pos[k][0] * SC, pos[k][1] * SC]; });
const shapes = {}; // name -> {type,cx,cy,w,h}
entities.forEach((e) => { shapes[e] = { type: 'ent', cx: pos[e][0], cy: pos[e][1], w: Math.max(160, TW(e, 20) + 40), h: 52, label: e }; });
const dia = [];
rels.forEach(([n, m, o, tot]) => { const a = shapes[m], b = shapes[o]; const d = { type: 'dia', cx: (a.cx + b.cx) / 2, cy: (a.cy + b.cy) / 2, w: Math.max(165, TW(n, 16) + 70), h: 86, label: n, many: m, one: o, tot }; dia.push(d); });
const ca = shapes[mn.a], cb = shapes[mn.b];
const mnD = { type: 'dia', cx: (ca.cx + cb.cx) / 2, cy: (ca.cy + cb.cy) / 2, w: 150, h: 80, label: mn.name, mn: true }; dia.push(mnD);

// ---------- geometry helpers ----------
const clipRect = (s, tx, ty) => { const dx = tx - s.cx, dy = ty - s.cy; const k = Math.min(dx ? (s.w / 2) / Math.abs(dx) : Infinity, dy ? (s.h / 2) / Math.abs(dy) : Infinity); return [s.cx + dx * k, s.cy + dy * k]; };
const clipDia = (s, tx, ty) => { const dx = tx - s.cx, dy = ty - s.cy; const k = 1 / (Math.abs(dx) / (s.w / 2) + Math.abs(dy) / (s.h / 2)); return [s.cx + dx * k, s.cy + dy * k]; };
const clipEll = (s, tx, ty) => { const dx = tx - s.cx, dy = ty - s.cy; const k = 1 / Math.sqrt((dx / (s.w / 2)) ** 2 + (dy / (s.h / 2)) ** 2); return [s.cx + dx * k, s.cy + dy * k]; };
const clip = (s, tx, ty) => (s.type === 'ent' ? clipRect : s.type === 'dia' ? clipDia : clipEll)(s, tx, ty);
const bbox = (s, m = 0) => [s.cx - s.w / 2 - m, s.cy - s.h / 2 - m, s.cx + s.w / 2 + m, s.cy + s.h / 2 + m];
const rectOv = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const ptIn = (p, r) => p[0] > r[0] && p[0] < r[2] && p[1] > r[1] && p[1] < r[3];
const segHitsRect = (a, b, r) => { for (let t = 0; t <= 1; t += 0.02) if (ptIn([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], r)) return true; return false; };
const cross = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };

// ---------- relationship segments ----------
const segs = []; // {a,b,kind}
const links = []; // for drawing
const link = (from, to, o = {}) => { const A = clip(from, to.cx, to.cy), B = clip(to, from.cx, from.cy); segs.push({ a: A, b: B }); links.push({ a: A, b: B, ...o }); };
dia.filter((d) => !d.mn).forEach((d) => { link(shapes[d.many], d, { dbl: d.tot }); link(d, shapes[d.one], { arrow: true }); });
link(shapes[mn.a], mnD); link(mnD, shapes[mn.b]);

// ---------- attribute placement ----------
const obstacles = () => [...entities.map((e) => shapes[e]), ...dia];
const placed = []; const attrLinks = [];
function place(owner, list) {
  let prev = null;
  list.forEach((at) => {
    const w = Math.max(90, TW(at.n, 16) + 30), h = 38; let best = null;
    for (let r = 70; r <= 520 && !best; r += 20) {
      const cands = [];
      for (let ang = 0; ang < 360; ang += 7.5) {
        const rad = ang * Math.PI / 180; const rx = owner.w / 2 + w / 2 + r - 55, ry = owner.h / 2 + h / 2 + r - 50;
        const cx = owner.cx + rx * Math.cos(rad), cy = owner.cy - ry * Math.sin(rad);
        const el = { type: 'ell', cx, cy, w, h }; const bb = bbox(el, 6);
        if (obstacles().some((o) => o !== owner && rectOv(bb, bbox(o, 4))) || rectOv(bb, bbox(owner, 4))) continue;
        if (placed.some((p) => rectOv(bb, bbox(p, 6)))) continue;
        const A = clip(owner, cx, cy), B = clip(el, owner.cx, owner.cy);
        if (obstacles().some((o) => o !== owner && segHitsRect(A, B, bbox(o, 2)))) continue;
        if (placed.some((p) => segHitsRect(A, B, bbox(p, 2)))) continue;
        if (segs.some((s) => segHitsRect(s.a, s.b, bb) || cross(A, B, s.a, s.b))) continue;
        if (attrLinks.some((s) => segHitsRect(s.a, s.b, bb) || cross(A, B, s.a, s.b))) continue;
        const pen = prev === null ? 0 : Math.abs(((ang - prev + 540) % 360) - 180) * 0.0; // keep simple
        cands.push({ el, A, B, ang, score: Math.abs(((ang - (prev === null ? 90 : prev + 40)) + 540) % 360 - 180) + pen });
      }
      if (cands.length) { cands.sort((x, y) => x.score - y.score); best = cands[0]; }
    }
    if (!best) throw new Error('no place for ' + owner.label + '.' + at.n);
    best.el.label = at.n; best.el.pk = at.pk; best.el.uk = at.uk; placed.push(best.el); attrLinks.push({ a: best.A, b: best.B }); prev = best.ang;
  });
}
// order: most constrained (busiest) first
['Cases', 'Officer', 'Arrest', 'Criminal', 'Complaint', 'PoliceStation', 'Evidence', 'EvidenceCustody', 'CourtProceeding', 'CaseStatusLog', 'AppUser', 'Court'].forEach((e) => place(shapes[e], attrsOf(e)));
place(mnD, mn.attrs.map((n) => ({ n, pk: false })));

// ---------- bounds ----------
const all = [...entities.map((e) => shapes[e]), ...dia, ...placed];
const minX = Math.min(...all.map((s) => s.cx - s.w / 2)) - 40, minY = Math.min(...all.map((s) => s.cy - s.h / 2)) - 40;
const maxX = Math.max(...all.map((s) => s.cx + s.w / 2)) + 40, maxY = Math.max(...all.map((s) => s.cy + s.h / 2)) + 110;
const W = Math.round(maxX - minX), H = Math.round(maxY - minY);
const tx = (x) => (x - minX).toFixed(1), ty = (y) => (y - minY).toFixed(1);
const out = [];
const L = (a, b, w = 1.8) => `<line x1="${tx(a[0])}" y1="${ty(a[1])}" x2="${tx(b[0])}" y2="${ty(b[1])}" stroke="#14213d" stroke-width="${w}"/>`;
attrLinks.forEach((l) => out.push(L(l.a, l.b, 1.5)));
links.forEach((l) => {
  if (l.dbl) { const dx = l.b[0] - l.a[0], dy = l.b[1] - l.a[1], len = Math.hypot(dx, dy), nx = -dy / len * 2.6, ny = dx / len * 2.6; out.push(L([l.a[0] + nx, l.a[1] + ny], [l.b[0] + nx, l.b[1] + ny])); out.push(L([l.a[0] - nx, l.a[1] - ny], [l.b[0] - nx, l.b[1] - ny])); }
  else out.push(L(l.a, l.b));
  if (l.arrow) { const dx = l.b[0] - l.a[0], dy = l.b[1] - l.a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len; const bx = l.b[0] - ux * 14, by = l.b[1] - uy * 14; out.push(`<polygon points="${tx(l.b[0])},${ty(l.b[1])} ${tx(bx - uy * 7)},${ty(by + ux * 7)} ${tx(bx + uy * 7)},${ty(by - ux * 7)}" fill="#14213d"/>`); }
});
entities.forEach((e) => { const s = shapes[e]; out.push(`<rect x="${tx(s.cx - s.w / 2)}" y="${ty(s.cy - s.h / 2)}" width="${s.w}" height="${s.h}" fill="#eef0fe" stroke="#14213d" stroke-width="2.2"/><text x="${tx(s.cx)}" y="${ty(s.cy + 6)}" text-anchor="middle" class="e">${e}</text>`); });
dia.forEach((d) => { out.push(`<polygon points="${tx(d.cx)},${ty(d.cy - d.h / 2)} ${tx(d.cx + d.w / 2)},${ty(d.cy)} ${tx(d.cx)},${ty(d.cy + d.h / 2)} ${tx(d.cx - d.w / 2)},${ty(d.cy)}" fill="#fff4dc" stroke="#14213d" stroke-width="2"/><text x="${tx(d.cx)}" y="${ty(d.cy + 5)}" text-anchor="middle" class="r">${d.label}</text>`); });
placed.forEach((a) => { out.push(`<ellipse cx="${tx(a.cx)}" cy="${ty(a.cy)}" rx="${a.w / 2}" ry="${a.h / 2}" fill="#fff" stroke="#14213d" stroke-width="1.6"/><text x="${tx(a.cx)}" y="${ty(a.cy + 5)}" text-anchor="middle" class="a"${a.pk ? ' text-decoration="underline"' : a.uk ? ' text-decoration="underline" style="text-decoration-style:dashed"' : ''}>${a.label}</text>`); });
// legend
const lx = 40, ly = H - 90;
out.push(`<text x="${lx}" y="${ly}" class="lg">Legend</text><line x1="${lx}" y1="${ly + 22}" x2="${lx + 46}" y2="${ly + 22}" stroke="#14213d" stroke-width="1.8"/><text x="${lx + 56}" y="${ly + 27}" class="lg2">partial participation</text><line x1="${lx + 230}" y1="${ly + 19}" x2="${lx + 276}" y2="${ly + 19}" stroke="#14213d" stroke-width="1.8"/><line x1="${lx + 230}" y1="${ly + 25}" x2="${lx + 276}" y2="${ly + 25}" stroke="#14213d" stroke-width="1.8"/><text x="${lx + 286}" y="${ly + 27}" class="lg2">total participation</text><line x1="${lx + 470}" y1="${ly + 22}" x2="${lx + 516}" y2="${ly + 22}" stroke="#14213d" stroke-width="1.8"/><polygon points="${lx + 524},${ly + 22} ${lx + 510},${ly + 16} ${lx + 510},${ly + 28}" fill="#14213d"/><text x="${lx + 536}" y="${ly + 27}" class="lg2">arrow points to the "one" side (many-to-one)</text><text x="${lx + 90}" y="${ly + 56}" class="lg2"><tspan text-decoration="underline">underlined</tspan> = primary key, <tspan text-decoration="underline" style="text-decoration-style:dashed">dashed underline</tspan> = unique key. Foreign keys appear as relationships; table CriminalCase is the many-to-many relationship "involves".</text>`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif"><style>.e{font-size:20px;font-weight:700;fill:#14213d}.r{font-size:16px;font-weight:600;fill:#14213d}.a{font-size:16px;fill:#14213d}.lg{font-size:15px;font-weight:700;fill:#14213d}.lg2{font-size:13px;fill:#3b4158}</style><rect width="100%" height="100%" fill="#fff"/>${out.join('')}</svg>`;
fs.writeFileSync(R + '/Diagrams_Source/er_diagram.svg', svg);
// ---------- consistency check ----------
let bad = 0;
entities.forEach((e) => {
  const cols = schema.cols.filter((c) => c.t.toLowerCase() === e.toLowerCase()).map((c) => c.c);
  const shown = attrsOf(e).map((a) => a.n); const fks = schema.fks.filter((f) => f.t.toLowerCase() === e.toLowerCase()).map((f) => f.c);
  const missing = cols.filter((c) => !shown.includes(c) && !fks.includes(c));
  if (missing.length) { bad++; console.log('missing', e, missing); }
  const placedN = placed.filter(() => true).length; void placedN;
});
const nRel = dia.length; console.log('entities', entities.length, 'relationship diamonds', nRel, 'attribute ellipses', placed.length, bad ? 'CHECK FAILED' : 'schema check OK', W + 'x' + H);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await (await p.$('svg')).screenshot({ path: R + '/ER_Diagram.png' });
  fs.copyFileSync(R + '/ER_Diagram.png', R + '/figures/er_diagram.png');
  await b.close();
})();
