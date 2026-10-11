const puppeteer = require('puppeteer-core');
const fs = require('fs');
const R = 'C:/Users/arpit/OneDrive/Documents/GitHub/PCRMS/report';
const out = [];
const RH = 128, Y0 = 70, XE = 40, EW = 160, XP = 400, PR = 56, XS = 650, SW = 270, SH = 66, BUS = 990;
const y = (r) => Y0 + r * RH;
const ent = (r, t, sub) => out.push(`<rect x="${XE}" y="${y(r) - 24}" width="${EW}" height="48" fill="#fff" stroke="#14213d" stroke-width="2"/><text x="${XE + EW / 2}" y="${y(r) + (sub ? -2 : 5)}" text-anchor="middle" class="t">${t}</text>${sub ? `<text x="${XE + EW / 2}" y="${y(r) + 14}" text-anchor="middle" class="s">${sub}</text>` : ''}`);
const proc = (r, id, l1, l2) => out.push(`<circle cx="${XP}" cy="${y(r)}" r="${PR}" fill="#eef0fe" stroke="#5b5bf0" stroke-width="2"/><text x="${XP}" y="${y(r) - 12}" text-anchor="middle" class="id">${id}</text><text x="${XP}" y="${y(r) + 6}" text-anchor="middle" class="t">${l1}</text><text x="${XP}" y="${y(r) + 22}" text-anchor="middle" class="t">${l2}</text>`);
const store = (r, id, l1, l2) => out.push(`<path d="M${XS},${y(r) - SH / 2} h${SW} M${XS},${y(r) + SH / 2} h${SW}" stroke="#14213d" stroke-width="2"/><rect x="${XS}" y="${y(r) - SH / 2}" width="${SW}" height="${SH}" fill="#fff4dc" stroke="none"/><path d="M${XS},${y(r) - SH / 2} h${SW} M${XS},${y(r) + SH / 2} h${SW} M${XS},${y(r) - SH / 2} v${SH}" stroke="#b7791f" stroke-width="2" fill="none"/><text x="${XS + 12}" y="${y(r) - 6}" class="id">${id}</text><text x="${XS + 12}" y="${y(r) + 12}" class="t">${l1}</text><text x="${XS + 12}" y="${y(r) + 28}" class="s">${l2}</text>`);
const arr = (pts, o = {}) => out.push(`<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#14213d" stroke-width="1.8" ${o.dash ? 'stroke-dasharray="6 4"' : ''} ${o.both ? 'marker-start="url(#a)"' : ''} marker-end="url(#a)" stroke-linejoin="round"/>`);
const lab = (x, yy, t) => out.push(`<rect x="${x - t.length * 3.4 - 4}" y="${yy - 11}" width="${t.length * 6.8 + 8}" height="16" fill="#fff"/><text x="${x}" y="${yy + 2}" text-anchor="middle" class="l">${t}</text>`);

// rows: 0 auth, 1 master data, 2 arrest/evidence, 3 FIR, 4 court, 5 search
ent(0, 'All users', 'Admin, Officer, Viewer'); proc(0, '1.0', 'Authenticate', 'and authorize'); store(0, 'D1', 'AppUser', 'logins, roles');
arr([[XE + EW, y(0)], [XP - PR, y(0)]]); lab((XE + EW + XP - PR) / 2, y(0) - 12, 'credentials');
arr([[XP + PR, y(0)], [XS, y(0)]], { both: true });
ent(1, 'Administrator'); proc(1, '2.0', 'Manage', 'master data'); store(1, 'D2', 'Stations, Officers, Courts,', 'Criminals');
arr([[XE + EW, y(1)], [XP - PR, y(1)]]); lab((XE + EW + XP - PR) / 2, y(1) - 12, 'master data');
arr([[XP + PR, y(1)], [XS, y(1)]], { both: true });
ent(2, 'Police Officer'); proc(2, '4.0', 'Record arrest', 'and evidence'); store(2, 'D4', 'Arrest, Evidence,', 'EvidenceCustody');
arr([[XE + EW, y(2)], [XP - PR, y(2)]]); lab((XE + EW + XP - PR) / 2, y(2) - 12, 'arrest, evidence');
arr([[XP + PR, y(2)], [XS, y(2)]], { both: true });
ent(3, 'Police Officer'); proc(3, '3.0', 'Register', 'complaint, FIR'); store(3, 'D3', 'Cases, Complaint,', 'CriminalCase');
arr([[XE + EW, y(3)], [XP - PR, y(3)]]); lab((XE + EW + XP - PR) / 2, y(3) - 12, 'complaint, FIR');
arr([[XP + PR, y(3)], [XS, y(3)]], { both: true });
ent(4, 'Police Officer'); proc(4, '5.0', 'Track court', 'proceedings'); store(4, 'D5', 'CourtProceeding,', 'CaseStatusLog');
arr([[XE + EW, y(4)], [XP - PR, y(4)]]); lab((XE + EW + XP - PR) / 2, y(4) - 12, 'hearing, outcome');
arr([[XP + PR, y(4)], [XS, y(4)]], { both: true });
ent(5, 'Viewer'); proc(5, '6.0', 'Search and', 'reports');
arr([[XE + EW, y(5)], [XP - PR, y(5)]]); lab((XE + EW + XP - PR) / 2, y(5) - 12, 'queries');
arr([[XP - PR, y(5) + 30], [XE + EW, y(5) + 30]]); lab((XE + EW + XP - PR) / 2, y(5) + 42, 'results');
// triggers: P4 -> D3, P5 -> D3 (dashed)
arr([[XP + 40, y(2) + 40], [XS + 70, y(3) - SH / 2]], { dash: true }); lab(XP + 175, y(2) + 66, 'trigger: statuses');
arr([[XP + 40, y(4) - 40], [XS + 70, y(3) + SH / 2]], { dash: true }); lab(XP + 175, y(4) - 66, 'trigger: In Court');
// P6 reads via bus
out.push(`<polyline points="${XP + PR},${y(5)} ${BUS},${y(5)} ${BUS},${y(1)}" fill="none" stroke="#14213d" stroke-width="1.8" stroke-dasharray="6 4"/>`);
[1, 2, 3, 4].forEach((r) => arr([[BUS, y(r)], [XS + SW, y(r)]], { dash: true }));
lab(XP + 260, y(5) - 12, 'reads (read-only queries and views)');
const W = BUS + 40, H = y(5) + 80;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif"><defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#14213d"/></marker></defs><style>.t{font-size:15px;font-weight:600;fill:#14213d}.s{font-size:12.5px;fill:#4b5266}.id{font-size:13px;font-weight:700;fill:#5b5bf0}.l{font-size:12.5px;font-style:italic;fill:#3b4158;text-anchor:middle}</style><rect width="100%" height="100%" fill="#fff"/>${out.join('')}</svg>`;
fs.writeFileSync(R + '/Diagrams_Source/dfd1.svg', svg);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 2.5 });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`); await (await p.$('svg')).screenshot({ path: R + '/figures/dfd1.png' });
  await b.close(); console.log('ok', W, H);
})();
