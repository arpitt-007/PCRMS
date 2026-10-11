import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { pool } from './db.js';
import { resources } from './resources.js';

const app = express();
app.use(cors());
app.use(express.json());
const SECRET = process.env.JWT_SECRET || 'dev-secret';
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  const status = e.code === 'ER_DUP_ENTRY' ? 409 : e.errno === 1451 || e.errno === 1452 ? 409 : 500;
  res.status(status).json({ error: e.sqlMessage || e.message });
});

// ---- auth ----
app.post('/api/login', wrap(async (req, res) => {
  const { username, password } = req.body;
  const [[u]] = await pool.query('SELECT * FROM AppUser WHERE username=?', [username]);
  if (!u || !bcrypt.compareSync(password || '', u.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  const user = { id: u.user_id, username: u.username, role: u.role };
  res.json({ token: jwt.sign(user, SECRET, { expiresIn: '8h' }), user });
}));

app.use('/api', (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), SECRET); next(); }
  catch { res.status(401).json({ error: 'Login required' }); }
});

// viewer: read only; officer: no delete; admin: everything
const can = (role, method) => role === 'admin' || (role === 'officer' && method !== 'DELETE') || method === 'GET';
app.use('/api', (req, res, next) =>
  can(req.user.role, req.method) ? next() : res.status(403).json({ error: 'Your role is not allowed to do this' }));

// ---- dashboard & reports ----
app.get('/api/dashboard', wrap(async (req, res) => {
  const count = async (sql) => (await pool.query(sql))[0][0].n;
  const [byStatus] = await pool.query('SELECT status, COUNT(*) AS n FROM Cases GROUP BY status');
  const [byType] = await pool.query('SELECT type, COUNT(*) AS n FROM Cases GROUP BY type ORDER BY n DESC');
  const [upcoming] = await pool.query(
    `SELECT p.date, c.name AS court, cs.fir_number, cs.title FROM CourtProceeding p
     JOIN Court c ON c.court_id=p.court_id JOIN Cases cs ON cs.case_id=p.case_id
     WHERE p.date >= CURDATE() ORDER BY p.date LIMIT 5`);
  res.json({
    totals: {
      cases: await count('SELECT COUNT(*) n FROM Cases'),
      openCases: await count("SELECT COUNT(*) n FROM Cases WHERE status<>'Closed'"),
      criminals: await count('SELECT COUNT(*) n FROM Criminal'),
      wanted: await count("SELECT COUNT(*) n FROM Criminal WHERE status='Wanted'"),
      officers: await count('SELECT COUNT(*) n FROM Officer'),
      arrests: await count('SELECT COUNT(*) n FROM Arrest'),
      evidence: await count('SELECT COUNT(*) n FROM Evidence'),
      complaints: await count('SELECT COUNT(*) n FROM Complaint'),
    },
    byStatus, byType, upcoming,
  });
}));

const reports = {
  'case-overview': 'SELECT * FROM v_case_overview ORDER BY case_id',
  'wanted-criminals': 'SELECT * FROM v_wanted_criminals',
  'station-stats': 'SELECT * FROM v_station_stats',
  'officer-workload': `SELECT o.name, o.\`rank\`, COUNT(c.case_id) AS cases,
      SUM(c.status<>'Closed') AS active_cases FROM Officer o LEFT JOIN Cases c ON c.officer_id=o.officer_id
      GROUP BY o.officer_id, o.name, o.\`rank\` ORDER BY cases DESC`,
  'repeat-offenders': `SELECT cr.criminal_id, cr.name, COUNT(*) AS cases FROM Criminal cr
      JOIN CriminalCase cc ON cc.criminal_id=cr.criminal_id GROUP BY cr.criminal_id, cr.name HAVING cases > 1`,
  'status-log': `SELECT l.changed_at, c.fir_number, l.old_status, l.new_status FROM CaseStatusLog l
      JOIN Cases c ON c.case_id=l.case_id ORDER BY l.log_id DESC`,
};
app.get('/api/reports/:name', wrap(async (req, res) => {
  const sql = reports[req.params.name];
  if (!sql) return res.status(404).json({ error: 'Unknown report' });
  res.json((await pool.query(sql))[0]);
}));

// ---- special endpoints ----
app.post('/api/fir', wrap(async (req, res) => {
  const b = req.body;
  const [r] = await pool.query('CALL sp_register_fir(?,?,?,?,?,?)',
    [b.fir_number, b.title, b.type, b.description || null, b.officer_id, b.complaint_id || null]);
  res.status(201).json(r[0][0]);
}));
app.post('/api/cases/:id/close', wrap(async (req, res) => {
  await pool.query('CALL sp_close_case(?)', [req.params.id]);
  res.json({ ok: true });
}));
app.get('/api/criminals/:id/history', wrap(async (req, res) => {
  const [[criminal]] = await pool.query('SELECT * FROM Criminal WHERE criminal_id=?', [req.params.id]);
  const [r] = await pool.query('CALL sp_criminal_history(?)', [req.params.id]);
  const [arrests] = await pool.query('SELECT * FROM Arrest WHERE criminal_id=? ORDER BY date DESC', [req.params.id]);
  res.json({ criminal, cases: r[0], arrests });
}));
app.get('/api/cases/:id/detail', wrap(async (req, res) => {
  const id = req.params.id;
  const [[info]] = await pool.query('SELECT * FROM v_case_overview WHERE case_id=?', [id]);
  const [criminals] = await pool.query(
    'SELECT cr.criminal_id, cr.name, cr.status, cc.role FROM CriminalCase cc JOIN Criminal cr ON cr.criminal_id=cc.criminal_id WHERE cc.case_id=?', [id]);
  const [proceedings] = await pool.query(
    'SELECT p.date, p.outcome, c.name AS court FROM CourtProceeding p JOIN Court c ON c.court_id=p.court_id WHERE p.case_id=? ORDER BY p.date', [id]);
  const [evidence] = await pool.query(
    'SELECT e.* FROM Evidence e JOIN Arrest a ON a.arrest_id=e.arrest_id WHERE a.case_id=?', [id]);
  const [history] = await pool.query('SELECT * FROM CaseStatusLog WHERE case_id=? ORDER BY log_id', [id]);
  res.json({ info, criminals, proceedings, evidence, history });
}));
// link/unlink a criminal to a case (junction table)
app.post('/api/cases/:id/criminals', wrap(async (req, res) => {
  await pool.query('INSERT INTO CriminalCase(criminal_id,case_id,role) VALUES (?,?,?)',
    [req.body.criminal_id, req.params.id, req.body.role || 'Accused']);
  res.status(201).json({ ok: true });
}));
app.delete('/api/cases/:id/criminals/:cid', wrap(async (req, res) => {
  await pool.query('DELETE FROM CriminalCase WHERE case_id=? AND criminal_id=?', [req.params.id, req.params.cid]);
  res.json({ ok: true });
}));
app.get('/api/evidence/:id/custody', wrap(async (req, res) => {
  const [r] = await pool.query(
    'SELECT ec.*, o.name AS officer FROM EvidenceCustody ec JOIN Officer o ON o.officer_id=ec.officer_id WHERE evidence_id=? ORDER BY custody_id', [req.params.id]);
  res.json(r);
}));
app.post('/api/evidence/:id/custody', wrap(async (req, res) => {
  await pool.query('INSERT INTO EvidenceCustody(evidence_id,officer_id,action) VALUES (?,?,?)',
    [req.params.id, req.body.officer_id, req.body.action]);
  res.status(201).json({ ok: true });
}));
app.get('/api/search', wrap(async (req, res) => {
  const q = `%${req.query.q || ''}%`;
  const [criminals] = await pool.query('SELECT criminal_id AS id, name, status FROM Criminal WHERE name LIKE ? OR address LIKE ? LIMIT 20', [q, q]);
  const [cases] = await pool.query('SELECT case_id AS id, fir_number, title, status FROM Cases WHERE title LIKE ? OR fir_number LIKE ? OR type LIKE ? LIMIT 20', [q, q, q]);
  const [officers] = await pool.query('SELECT officer_id AS id, name, badge_number FROM Officer WHERE name LIKE ? OR badge_number LIKE ? LIMIT 20', [q, q]);
  res.json({ criminals, cases, officers });
}));

// ---- generic CRUD ----
for (const [name, r] of Object.entries(resources)) {
  const base = `/api/${name}`;
  const pick = (body) => Object.fromEntries(r.fields.filter((f) => f in body).map((f) => [f, body[f] === '' ? null : body[f]]));
  const cols = (o) => Object.keys(o).map((k) => `\`${k}\``);

  app.get(base, wrap(async (req, res) => {
    const from = r.select ? `(${r.select}) t` : `\`${r.table}\` t`;
    const params = [];
    let where = '';
    if (req.query.q) {
      where = 'WHERE ' + r.search.map((c) => `t.\`${c}\` LIKE ?`).join(' OR ');
      r.search.forEach(() => params.push(`%${req.query.q}%`));
    }
    if (req.query.status) { where += (where ? ' AND ' : 'WHERE ') + 't.status = ?'; params.push(req.query.status); }
    const [rows] = await pool.query(`SELECT t.* FROM ${from} ${where} ORDER BY t.\`${r.pk}\` DESC`, params);
    res.json(rows);
  }));
  app.get(`${base}/:id`, wrap(async (req, res) => {
    const [[row]] = await pool.query(`SELECT * FROM \`${r.table}\` WHERE \`${r.pk}\`=?`, [req.params.id]);
    row ? res.json(row) : res.status(404).json({ error: 'Not found' });
  }));
  app.post(base, wrap(async (req, res) => {
    const d = pick(req.body);
    const [x] = await pool.query(`INSERT INTO \`${r.table}\` (${cols(d).join(',')}) VALUES (${Object.keys(d).map(() => '?').join(',')})`, Object.values(d));
    res.status(201).json({ [r.pk]: x.insertId });
  }));
  app.put(`${base}/:id`, wrap(async (req, res) => {
    const d = pick(req.body);
    await pool.query(`UPDATE \`${r.table}\` SET ${cols(d).map((c) => `${c}=?`).join(',')} WHERE \`${r.pk}\`=?`, [...Object.values(d), req.params.id]);
    res.json({ ok: true });
  }));
  app.delete(`${base}/:id`, wrap(async (req, res) => {
    await pool.query(`DELETE FROM \`${r.table}\` WHERE \`${r.pk}\`=?`, [req.params.id]);
    res.json({ ok: true });
  }));
}

app.listen(process.env.PORT || 4000, () => console.log('PCRMS API on port', process.env.PORT || 4000));
