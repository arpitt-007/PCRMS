import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api.js';
import { Stagger, Reveal, item } from '../motion.jsx';
import { Icon, Spinner, ErrorBanner, EmptyState } from '../ui.jsx';

const stats = {
  cases: ['Total cases', 'folder', ''], openCases: ['Active cases', 'clock', 'warn'], criminals: ['Criminals', 'users', ''],
  wanted: ['Wanted', 'siren', 'danger'], officers: ['Officers', 'shield', ''], arrests: ['Arrests', 'lock', ''],
  evidence: ['Evidence items', 'package', 'ok'], complaints: ['Complaints', 'inbox', ''],
};

function Bars({ rows, keyName }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <EmptyState icon="chart" title="No data yet" />;
  return (
    <div>
      {rows.map((r, i) => (
        <div key={r[keyName]} className="bar-row">
          <span>{r[keyName]}</span>
          <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${(r.n / max) * 100}%` }} transition={{ duration: 0.7, delay: 0.1 + i * 0.07, ease: 'easeOut' }} /></div>
          <b>{r.n}</b>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ user }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/dashboard').then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  if (!d) return <Spinner label="Loading dashboard" />;
  return (
    <div>
      <motion.div className="hero-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h2>Welcome back, {user.username}</h2>
        <p>{d.totals.openCases} active case{d.totals.openCases === 1 ? '' : 's'} and {d.totals.wanted} wanted {d.totals.wanted === 1 ? 'person' : 'people'} on record today.</p>
      </motion.div>
      <Stagger className="stats">
        {Object.entries(d.totals).map(([k, v]) => (
          <motion.div className={'stat ' + stats[k][2]} key={k} variants={item} whileHover={{ y: -3 }}>
            <span className="ico"><Icon name={stats[k][1]} size={20} /></span>
            <div><b>{v}</b><span>{stats[k][0]}</span></div>
          </motion.div>
        ))}
      </Stagger>
      <div className="grid2">
        <Reveal className="card"><h3>Cases by status</h3><Bars rows={d.byStatus} keyName="status" /></Reveal>
        <Reveal className="card" delay={0.08}><h3>Cases by type</h3><Bars rows={d.byType} keyName="type" /></Reveal>
        <Reveal className="card wide" delay={0.12}><h3><Icon name="scale" size={17} /> Upcoming hearings</h3>
          {d.upcoming.length === 0 ? <EmptyState icon="scale" title="No hearings scheduled" hint="Court proceedings with future dates appear here." /> : (
            <div className="table-wrap"><table><tbody>{d.upcoming.map((u, i) => (
              <tr key={i}><td>{u.date}</td><td><b>{u.fir_number}</b></td><td>{u.title}</td><td>{u.court}</td></tr>
            ))}</tbody></table></div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
