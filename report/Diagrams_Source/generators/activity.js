const puppeteer = require('puppeteer-core');
const fs = require('fs');
const R = 'C:/Users/arpit/OneDrive/Documents/GitHub/PCRMS/report';
const BW = 176, BH = 66, CP = 225, RP = 140, X0 = 40, Y0 = 50;
const cx = (c) => X0 + c * CP + BW / 2, cy = (r) => Y0 + r * RP + BH / 2;
const out = [];
const node = (c, r, kind, l1, l2) => {
  const x = cx(c), y = cy(r);
  if (kind === 'start' || kind === 'end') { out.push(`<circle cx="${x}" cy="${y}" r="${kind === 'end' ? 14 : 12}" fill="${kind === 'end' ? '#fff' : '#14213d'}" stroke="#14213d" stroke-width="2.5"/>${kind === 'end' ? `<circle cx="${x}" cy="${y}" r="8" fill="#14213d"/>` : ''}<text x="${x}" y="${y + 36}" text-anchor="middle" class="n">${l1}</text>`); return; }
  if (kind === 'dec') { out.push(`<polygon points="${x},${y - 40} ${x + 92},${y} ${x},${y + 40} ${x - 92},${y}" fill="#fff4dc" stroke="#b7791f" stroke-width="2"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="t">${l1}</text>`); return; }
  out.push(`<rect x="${x - BW / 2}" y="${y - BH / 2}" width="${BW}" height="${BH}" rx="12" fill="#eef0fe" stroke="#5b5bf0" stroke-width="2"/><text x="${x}" y="${y + (l2 ? -4 : 5)}" text-anchor="middle" class="t">${l1}</text>${l2 ? `<text x="${x}" y="${y + 16}" text-anchor="middle" class="s">${l2}</text>` : ''}`);
};
const arrow = (pts, label, lp) => {
  out.push(`<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="#14213d" stroke-width="2" marker-end="url(#a)" stroke-linejoin="round"/>`);
  if (label) out.push(`<rect x="${lp[0] - 22}" y="${lp[1] - 11}" width="44" height="17" rx="4" fill="#fff"/><text x="${lp[0]}" y="${lp[1] + 3}" text-anchor="middle" class="l">${label}</text>`);
};
const L = (c, w = BW / 2) => cx(c) - w, Rg = (c, w = BW / 2) => cx(c) + w;
// row 0 (left to right)
node(0, 0, 'start', 'Start'); node(1, 0, 'act', 'Open app and log in'); node(2, 0, 'dec', 'Valid login?'); node(3, 0, 'act', 'Dashboard', 'role decides actions');
arrow([[cx(0) + 12, cy(0)], [L(1), cy(0)]]); arrow([[Rg(1), cy(0)], [cx(2) - 92, cy(0)]]); arrow([[cx(2) + 92, cy(0)], [L(3), cy(0)]], 'Yes', [(cx(2) + 92 + L(3)) / 2, cy(0) - 10]);
arrow([[cx(2), cy(0) + 40], [cx(2), cy(0) + 62], [cx(1), cy(0) + 62], [cx(1), cy(0) + BH / 2]], 'No: error', [(cx(1) + cx(2)) / 2, cy(0) + 62]);
// row 1 (right to left)
node(3, 1, 'act', 'Record complaint', 'Complaint table'); node(2, 1, 'act', 'Register FIR', 'sp_register_fir'); node(1, 1, 'act', 'Case status: Open'); node(0, 1, 'dec', 'Suspect arrested?');
arrow([[cx(3), cy(0) + BH / 2], [cx(3), cy(1) - BH / 2]]);
arrow([[L(3), cy(1)], [Rg(2), cy(1)]]); arrow([[L(2), cy(1)], [Rg(1), cy(1)]]); arrow([[L(1), cy(1)], [cx(0) + 92, cy(1)]]);
arrow([[cx(0), cy(1) - 40], [cx(0), cy(1) - 56], [cx(1), cy(1) - 56], [cx(1), cy(1) - BH / 2]], 'No', [(cx(0) + cx(1)) / 2, cy(1) - 56]);
// row 2 (left to right)
node(0, 2, 'act', 'Record arrest', 'trigger sets statuses'); node(1, 2, 'act', 'Add evidence', 'first custody entry'); node(2, 2, 'act', 'Log custody transfers'); node(3, 2, 'dec', 'Hearing scheduled?');
arrow([[cx(0), cy(1) + 40], [cx(0), cy(2) - BH / 2]], 'Yes', [cx(0), (cy(1) + 40 + cy(2) - BH / 2) / 2]);
arrow([[Rg(0), cy(2)], [L(1), cy(2)]]); arrow([[Rg(1), cy(2)], [L(2), cy(2)]]); arrow([[Rg(2), cy(2)], [cx(3) - 92, cy(2)]]);
arrow([[cx(3), cy(2) - 40], [cx(3), cy(2) - 56], [cx(2), cy(2) - 56], [cx(2), cy(2) - BH / 2]], 'No', [(cx(2) + cx(3)) / 2, cy(2) - 56]);
// row 3 (right to left)
node(3, 3, 'act', 'Record proceeding', 'trigger: case In Court'); node(2, 3, 'act', 'Record outcome'); node(1, 3, 'act', 'Close case', 'sp_close_case'); node(0, 3, 'end', 'End');
arrow([[cx(3), cy(2) + 40], [cx(3), cy(3) - BH / 2]], 'Yes', [cx(3), (cy(2) + 40 + cy(3) - BH / 2) / 2]);
arrow([[L(3), cy(3)], [Rg(2), cy(3)]]); arrow([[L(2), cy(3)], [Rg(1), cy(3)]]); arrow([[L(1), cy(3)], [cx(0) + 14, cy(3)]]);
out.push(`<text x="${X0}" y="${Y0 + 3 * RP + BH + 44}" class="s">Every case status change (Open, Under Investigation, In Court, Closed) is recorded in CaseStatusLog by trigger trg_case_status_log.</text>`);
const W = X0 * 2 + 3 * CP + BW, H = Y0 + 3 * RP + BH + 70;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif"><defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#14213d"/></marker></defs><style>.t{font-size:15px;font-weight:600;fill:#14213d}.s{font-size:12.5px;fill:#4b5266}.n{font-size:13px;font-weight:600;fill:#14213d}.l{font-size:12px;font-weight:600;fill:#b7791f}</style><rect width="100%" height="100%" fill="#fff"/>${out.join('')}</svg>`;
fs.writeFileSync(R + '/Diagrams_Source/activity.svg', svg);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, deviceScaleFactor: 2.5 });
  await p.setContent(`<html><body style="margin:0">${svg}</body></html>`); await (await p.$('svg')).screenshot({ path: R + '/figures/activity.png' });
  await b.close(); console.log('ok', W, H);
})();
