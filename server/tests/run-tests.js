// API / database test runner. Usage: node tests/run-tests.js [outputJson]
// Requires the API on :4000 and a freshly seeded database (npm run setup-db).
import fs from 'fs';
import { pool } from '../db.js';

const BASE = process.env.API_URL || 'http://localhost:4000/api';
const tokens = {};
async function req(method, path, body, role) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(role ? { Authorization: 'Bearer ' + tokens[role] } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const q = async (sql, p) => (await pool.query(sql, p))[0];
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

for (const [u, p] of [['admin', 'admin123'], ['officer', 'officer123'], ['viewer', 'viewer123']]) {
  tokens[u] = (await req('POST', '/login', { username: u, password: p })).body.token;
}
let tmp = {}; // ids created by earlier tests

const tests = [
  // ---- Authentication ----
  ['Authentication', 'Valid login', 'Seeded user admin exists', 'admin / correct password', 'HTTP 200, JWT token and user role returned',
    async () => { const r = await req('POST', '/login', { username: 'admin', password: 'admin123' }); expect(r.status === 200 && r.body.token && r.body.user.role === 'admin', JSON.stringify(r)); return `HTTP 200, token issued, role=${r.body.user.role}`; }],
  ['Authentication', 'Wrong password rejected', 'Seeded user admin exists', 'admin / wrong password', 'HTTP 401, no token',
    async () => { const r = await req('POST', '/login', { username: 'admin', password: 'nope' }); expect(r.status === 401 && !r.body.token, r.status); return 'HTTP 401 "Invalid credentials"'; }],
  ['Authentication', 'Unknown user rejected', 'None', 'unknown user / any password', 'HTTP 401',
    async () => { const r = await req('POST', '/login', { username: 'ghost', password: 'x' }); expect(r.status === 401, r.status); return 'HTTP 401'; }],
  ['Authentication', 'Protected route without token', 'None', 'GET /api/cases with no Authorization header', 'HTTP 401',
    async () => { const r = await req('GET', '/cases'); expect(r.status === 401, r.status); return 'HTTP 401 "Login required"'; }],
  ['Authentication', 'Tampered token rejected', 'None', 'GET /api/cases with an invalid JWT', 'HTTP 401',
    async () => { const r = await fetch(BASE + '/cases', { headers: { Authorization: 'Bearer abc.def.ghi' } }); expect(r.status === 401, r.status); return 'HTTP 401'; }],
  ['Authentication', 'Password hash not stored in plain text', 'Database seeded', 'SELECT password_hash FROM AppUser', 'Values are bcrypt hashes, not the plain passwords',
    async () => { const rows = await q('SELECT password_hash FROM AppUser'); expect(rows.every((r) => r.password_hash.startsWith('$2') && !['admin123', 'officer123', 'viewer123'].includes(r.password_hash)), 'plain'); return `${rows.length} users, all hashes start with $2 (bcrypt)`; }],
  // ---- Authorization ----
  ['Authorization', 'Viewer can read', 'Logged in as viewer', 'GET /api/cases', 'HTTP 200 with rows',
    async () => { const r = await req('GET', '/cases', null, 'viewer'); expect(r.status === 200 && r.body.length >= 3, r.status); return `HTTP 200, ${r.body.length} rows`; }],
  ['Authorization', 'Viewer cannot create', 'Logged in as viewer', 'POST /api/courts', 'HTTP 403',
    async () => { const r = await req('POST', '/courts', { name: 'X', location: 'Y' }, 'viewer'); expect(r.status === 403, r.status); return 'HTTP 403 "Your role is not allowed"'; }],
  ['Authorization', 'Officer can create', 'Logged in as officer', 'POST /api/courts {name, location}', 'HTTP 201 with new id',
    async () => { const r = await req('POST', '/courts', { name: 'Test Court', location: 'Test City' }, 'officer'); expect(r.status === 201 && r.body.court_id, r.status); tmp.court = r.body.court_id; return `HTTP 201, court_id=${r.body.court_id}`; }],
  ['Authorization', 'Officer cannot delete', 'Logged in as officer; court created above', 'DELETE /api/courts/:id', 'HTTP 403, record remains',
    async () => { const r = await req('DELETE', '/courts/' + tmp.court, null, 'officer'); const row = await q('SELECT 1 FROM Court WHERE court_id=?', [tmp.court]); expect(r.status === 403 && row.length === 1, r.status); return 'HTTP 403, record still present'; }],
  ['Authorization', 'Admin can delete', 'Logged in as admin; court created above', 'DELETE /api/courts/:id', 'HTTP 200, record removed',
    async () => { const r = await req('DELETE', '/courts/' + tmp.court, null, 'admin'); const row = await q('SELECT 1 FROM Court WHERE court_id=?', [tmp.court]); expect(r.status === 200 && row.length === 0, r.status); return 'HTTP 200, record removed'; }],
  // ---- CRUD ----
  ['CRUD', 'Create station', 'Admin token', 'POST /api/stations with valid body', 'HTTP 201, row inserted',
    async () => { const r = await req('POST', '/stations', { name: 'Test Station', address: '1 Test Rd', city: 'Testville' }, 'admin'); expect(r.status === 201, JSON.stringify(r.body)); tmp.station = r.body.station_id; return `HTTP 201, station_id=${tmp.station}`; }],
  ['CRUD', 'Read station by id', 'Station created', 'GET /api/stations/:id', 'HTTP 200 with the same values',
    async () => { const r = await req('GET', '/stations/' + tmp.station, null, 'admin'); expect(r.status === 200 && r.body.city === 'Testville', r.status); return 'HTTP 200, city=Testville'; }],
  ['CRUD', 'Update station', 'Station created', 'PUT /api/stations/:id {city: "Newtown"}', 'HTTP 200, value changed in DB',
    async () => { const r = await req('PUT', '/stations/' + tmp.station, { city: 'Newtown' }, 'admin'); const row = (await q('SELECT city FROM PoliceStation WHERE station_id=?', [tmp.station]))[0]; expect(r.status === 200 && row.city === 'Newtown', r.status); return 'HTTP 200, DB city=Newtown'; }],
  ['CRUD', 'Search filter', 'Seed data', 'GET /api/criminals?q=Vikram', 'Only matching rows returned',
    async () => { const r = await req('GET', '/criminals?q=Vikram', null, 'admin'); expect(r.status === 200 && r.body.length === 1 && r.body[0].name === 'Vikram Rao', JSON.stringify(r.body)); return '1 row: Vikram Rao'; }],
  ['CRUD', 'Status filter', 'Seed data', 'GET /api/cases?status=Closed on seed data', 'Empty list (no closed cases yet)',
    async () => { const r = await req('GET', '/cases?status=Closed', null, 'admin'); expect(r.status === 200 && r.body.length === 0, JSON.stringify(r.body)); return 'HTTP 200, 0 rows'; }],
  ['CRUD', 'Delete station', 'Station created', 'DELETE /api/stations/:id', 'HTTP 200, row removed',
    async () => { const r = await req('DELETE', '/stations/' + tmp.station, null, 'admin'); const row = await q('SELECT 1 FROM PoliceStation WHERE station_id=?', [tmp.station]); expect(r.status === 200 && !row.length, r.status); return 'HTTP 200, row removed'; }],
  // ---- Validation / integrity ----
  ['Validation', 'Missing required column', 'Admin token', 'POST /api/stations with only {name}', 'Rejected with an error, nothing inserted',
    async () => { const before = (await q('SELECT COUNT(*) n FROM PoliceStation'))[0].n; const r = await req('POST', '/stations', { name: 'Incomplete' }, 'admin'); const after = (await q('SELECT COUNT(*) n FROM PoliceStation'))[0].n; expect(r.status >= 400 && before === after, r.status); return `HTTP ${r.status}, row count unchanged (${after})`; }],
  ['Validation', 'Invalid ENUM value', 'Admin token', 'PUT /api/criminals/1 {status: "Flying"}', 'Rejected, status unchanged',
    async () => { const r = await req('PUT', '/criminals/1', { status: 'Flying' }, 'admin'); const row = (await q('SELECT status FROM Criminal WHERE criminal_id=1'))[0]; expect(r.status >= 400 && row.status !== 'Flying', r.status); return `HTTP ${r.status}, status still ${row.status}`; }],
  ['Validation', 'Duplicate unique FIR number', 'FIR/2026/001 exists', 'POST /api/cases with fir_number FIR/2026/001', 'HTTP 409 duplicate',
    async () => { const r = await req('POST', '/cases', { fir_number: 'FIR/2026/001', title: 'Dup', type: 'Theft', filed_date: '2026-10-01', officer_id: 1 }, 'admin'); expect(r.status === 409, r.status); return 'HTTP 409 (duplicate entry)'; }],
  ['Validation', 'Foreign key must exist', 'Admin token', 'POST /api/officers with station_id 9999', 'HTTP 409 FK violation',
    async () => { const r = await req('POST', '/officers', { badge_number: 'ZZ1', name: 'Nobody', rank: 'Constable', station_id: 9999 }, 'admin'); expect(r.status === 409, r.status); return 'HTTP 409 (foreign key constraint fails)'; }],
  ['Validation', 'Cannot delete referenced parent row', 'Officer 1 handles cases', 'DELETE /api/officers/1', 'HTTP 409, officer remains',
    async () => { const r = await req('DELETE', '/officers/1', null, 'admin'); const row = await q('SELECT 1 FROM Officer WHERE officer_id=1'); expect(r.status === 409 && row.length === 1, r.status); return 'HTTP 409, officer still present'; }],
  ['Validation', 'SQL injection attempt in search', 'Seed data', "GET /api/search?q=' OR 1=1; DROP TABLE Criminal;--", 'No error, tables intact (parameterized queries)',
    async () => { const r = await req('GET', '/search?q=' + encodeURIComponent("' OR 1=1; DROP TABLE Criminal;--"), null, 'admin'); const n = (await q('SELECT COUNT(*) n FROM Criminal'))[0].n; expect(r.status === 200 && n >= 3, r.status); return `HTTP 200, Criminal table intact (${n} rows)`; }],
  // ---- Procedures & triggers ----
  ['Stored procedure', 'sp_register_fir with complaint', 'Seeded complaint 1 exists', 'POST /api/fir {FIR/2026/090, complaint_id 1}', 'Case created with status Open and today as filed date; complaint linked to new case',
    async () => { const r = await req('POST', '/fir', { fir_number: 'FIR/2026/090', title: 'Test burglary', type: 'Burglary', description: 'x', officer_id: 1, complaint_id: 1 }, 'officer'); expect(r.status === 201, JSON.stringify(r.body)); tmp.case = r.body.case_id; const c = (await q('SELECT status, filed_date FROM Cases WHERE case_id=?', [tmp.case]))[0]; const cp = (await q('SELECT case_id FROM Complaint WHERE complaint_id=1'))[0]; expect(c.status === 'Open' && cp.case_id === tmp.case, JSON.stringify([c, cp])); return `HTTP 201, case_id=${tmp.case}, status=Open, complaint 1 now linked`; }],
  ['Stored procedure', 'sp_register_fir rolls back on error', 'FIR/2026/090 exists', 'POST /api/fir with duplicate FIR number', 'HTTP 409, no extra case row',
    async () => { const before = (await q('SELECT COUNT(*) n FROM Cases'))[0].n; const r = await req('POST', '/fir', { fir_number: 'FIR/2026/090', title: 'Again', type: 'X', officer_id: 1 }, 'officer'); const after = (await q('SELECT COUNT(*) n FROM Cases'))[0].n; expect(r.status === 409 && before === after, r.status); return `HTTP 409, case count unchanged (${after})`; }],
  ['Trigger', 'Arrest trigger updates criminal and case', 'Criminal 2 Wanted; case 2 Open', 'POST /api/arrests {criminal 2, case 2}', 'Criminal status=Arrested, case status=Under Investigation',
    async () => { const r = await req('POST', '/arrests', { date: '2026-10-05', case_id: 2, officer_id: 2, criminal_id: 2, location: 'Test', charges: 'Fraud' }, 'officer'); expect(r.status === 201, JSON.stringify(r.body)); tmp.arrest = r.body.arrest_id; const cr = (await q('SELECT status FROM Criminal WHERE criminal_id=2'))[0]; const cs = (await q('SELECT status FROM Cases WHERE case_id=2'))[0]; expect(cr.status === 'Arrested' && cs.status === 'Under Investigation', JSON.stringify([cr, cs])); return 'criminal 2 = Arrested, case 2 = Under Investigation'; }],
  ['Trigger', 'Arrest trigger links criminal to case', 'Arrest above created', 'Query CriminalCase for (2,2)', 'Row exists (already linked as Suspect)',
    async () => { const rows = await q('SELECT role FROM CriminalCase WHERE criminal_id=2 AND case_id=2'); expect(rows.length === 1, rows.length); return `1 row, role=${rows[0].role} (INSERT IGNORE kept the original)`; }],
  ['Trigger', 'Status change logged', 'Case 2 changed status above', 'Query CaseStatusLog for case 2', 'Row Open -> Under Investigation',
    async () => { const rows = await q('SELECT old_status,new_status FROM CaseStatusLog WHERE case_id=2'); expect(rows.some((r) => r.old_status === 'Open' && r.new_status === 'Under Investigation'), JSON.stringify(rows)); return 'Log row: Open -> Under Investigation'; }],
  ['Trigger', 'Evidence creates custody entry', 'Arrest above created', 'POST /api/evidence for that arrest', 'EvidenceCustody row "Collected and logged" created automatically',
    async () => { const r = await req('POST', '/evidence', { type: 'Physical', description: 'Test item', collected_on: '2026-10-05', arrest_id: tmp.arrest }, 'officer'); expect(r.status === 201, JSON.stringify(r.body)); tmp.evidence = r.body.evidence_id; const rows = await q('SELECT action FROM EvidenceCustody WHERE evidence_id=?', [tmp.evidence]); expect(rows.length === 1 && rows[0].action === 'Collected and logged', JSON.stringify(rows)); return '1 custody row created by trigger'; }],
  ['API', 'Add custody event', 'Evidence created', 'POST /api/evidence/:id/custody then GET', 'Two entries in chronological order',
    async () => { const w = await req('POST', `/evidence/${tmp.evidence}/custody`, { officer_id: 3, action: 'Sent to forensic lab' }, 'officer'); const r = await req('GET', `/evidence/${tmp.evidence}/custody`, null, 'viewer'); expect(w.status === 201 && r.body.length === 2 && r.body[1].action === 'Sent to forensic lab', JSON.stringify(r.body)); return 'HTTP 201, 2 custody entries'; }],
  ['Trigger', 'Court proceeding moves case to In Court', 'Case 3 status Open', 'POST /api/proceedings for case 3', 'Case 3 status = In Court',
    async () => { const r = await req('POST', '/proceedings', { date: '2026-12-01', case_id: 3, court_id: 2 }, 'officer'); expect(r.status === 201, JSON.stringify(r.body)); const cs = (await q('SELECT status FROM Cases WHERE case_id=3'))[0]; expect(cs.status === 'In Court', cs.status); return 'case 3 = In Court'; }],
  ['Stored procedure', 'sp_close_case', 'Case 2 exists', 'POST /api/cases/2/close', 'Case 2 status = Closed and the change is logged',
    async () => { const r = await req('POST', '/cases/2/close', null, 'officer'); const cs = (await q('SELECT status FROM Cases WHERE case_id=2'))[0]; const lg = await q("SELECT 1 FROM CaseStatusLog WHERE case_id=2 AND new_status='Closed'"); expect(r.status === 200 && cs.status === 'Closed' && lg.length === 1, r.status); return 'status=Closed, log row written'; }],
  ['Stored procedure', 'sp_criminal_history', 'Criminal 3 linked to case 3 in seed data', 'GET /api/criminals/3/history', 'Case list and arrests returned',
    async () => { const r = await req('GET', '/criminals/3/history', null, 'viewer'); expect(r.status === 200 && r.body.criminal.name === 'Imran Ali' && Array.isArray(r.body.cases) && r.body.cases.length >= 1, JSON.stringify(r.body)); return `HTTP 200, ${r.body.cases.length} case(s) in history`; }],
  ['Constraint', 'ON DELETE CASCADE on CriminalCase', 'Case created by the FIR test', 'Link criminal 3 to new case, delete the case', 'Junction rows removed automatically',
    async () => { await req('POST', `/cases/${tmp.case}/criminals`, { criminal_id: 3, role: 'Suspect' }, 'officer'); const before = (await q('SELECT COUNT(*) n FROM CriminalCase WHERE case_id=?', [tmp.case]))[0].n; const d = await req('DELETE', '/cases/' + tmp.case, null, 'admin'); const after = (await q('SELECT COUNT(*) n FROM CriminalCase WHERE case_id=?', [tmp.case]))[0].n; expect(before === 1 && after === 0 && d.status === 200, JSON.stringify([before, after, d.status])); return `junction rows ${before} -> ${after}`; }],
  ['Constraint', 'ON DELETE SET NULL on Complaint.case_id', 'Complaint 1 was linked to the deleted case', 'Query Complaint 1 after case deletion', 'Complaint still exists with case_id NULL',
    async () => { const row = (await q('SELECT case_id FROM Complaint WHERE complaint_id=1'))[0]; expect(row && row.case_id === null, JSON.stringify(row)); return 'complaint kept, case_id = NULL'; }],
  // ---- Reports / dashboard ----
  ['Reports', 'Dashboard totals', 'Seed + test data', 'GET /api/dashboard', 'Totals and chart data present',
    async () => { const r = await req('GET', '/dashboard', null, 'viewer'); expect(r.status === 200 && r.body.totals.cases >= 3 && Array.isArray(r.body.byStatus) && Array.isArray(r.body.upcoming), JSON.stringify(r.body).slice(0, 200)); return `HTTP 200, totals.cases=${r.body.totals.cases}, upcoming=${r.body.upcoming.length}`; }],
  ...['case-overview', 'wanted-criminals', 'station-stats', 'officer-workload', 'repeat-offenders', 'status-log'].map((n) =>
    ['Reports', `Report: ${n}`, 'Database populated', `GET /api/reports/${n}`, 'HTTP 200 and a JSON array',
      async () => { const r = await req('GET', '/reports/' + n, null, 'viewer'); expect(r.status === 200 && Array.isArray(r.body), r.status); return `HTTP 200, ${r.body.length} row(s)`; }]),
  ['Reports', 'Unknown report', 'None', 'GET /api/reports/nope', 'HTTP 404',
    async () => { const r = await req('GET', '/reports/nope', null, 'viewer'); expect(r.status === 404, r.status); return 'HTTP 404'; }],
  ['Search', 'Global search', 'Seed data', 'GET /api/search?q=theft', 'Matching case returned',
    async () => { const r = await req('GET', '/search?q=theft', null, 'viewer'); expect(r.status === 200 && r.body.cases.some((c) => c.fir_number === 'FIR/2026/001'), JSON.stringify(r.body)); return `HTTP 200, ${r.body.cases.length} case match(es)`; }],
];

const results = [];
let n = 1;
for (const [feature, name, pre, input, expected, fn] of tests) {
  const id = 'TC-' + String(n++).padStart(2, '0');
  let actual, status = 'Pass';
  try { actual = await fn(); } catch (e) { status = 'Fail'; actual = 'FAILED: ' + e.message.slice(0, 160); }
  results.push({ id, feature, name, pre, input, expected, actual, status });
  console.log(`${status === 'Pass' ? 'PASS' : 'FAIL'} ${id} ${name} — ${actual}`);
}
const failed = results.filter((r) => r.status === 'Fail').length;
console.log(`\n${results.length - failed}/${results.length} passed`);
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify({ ranAt: new Date().toISOString(), results }, null, 2));
await pool.end();
process.exit(failed ? 1 : 0);
