import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { Reveal, MButton } from '../motion.jsx';
import { Icon, PageHeader, Spinner, ErrorBanner, EmptyState, Badge } from '../ui.jsx';

export default function CaseDetail({ role }) {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [all, setAll] = useState([]);
  const [link, setLink] = useState({ criminal_id: '', role: 'Accused' });
  const [error, setError] = useState('');
  const load = useCallback(() => api(`/cases/${id}/detail`).then(setD).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); api('/criminals').then(setAll); }, [load]);

  const run = async (fn) => { try { await fn(); setError(''); load(); } catch (e) { setError(e.message); } };
  if (!d) return error ? <ErrorBanner>{error}</ErrorBanner> : <Spinner label="Loading case" />;
  const { info, criminals, proceedings, evidence, history } = d;
  const canWrite = role !== 'viewer';

  return (
    <div>
      <PageHeader title={info.title} subtitle={`${info.fir_number} · ${info.type} · filed ${info.filed_date}`}
        back={<Link to="/cases" className="back-link"><Icon name="arrowLeft" size={15} />All cases</Link>}>
        <Badge value={info.status} />
        {canWrite && info.status !== 'Closed' && (
          <MButton onClick={() => run(() => api(`/cases/${id}/close`, 'POST'))}><Icon name="lock" size={16} />Close case</MButton>
        )}
      </PageHeader>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <Reveal className="card">
        <p>Handled by <b>{info.officer}</b> at {info.station}</p>
        <p>{info.arrests} arrest(s) · {info.evidence_items} evidence item(s) · {info.criminals} person(s) linked</p>
      </Reveal>
      <div className="grid2">
        <Reveal className="card"><h3><Icon name="users" size={17} />Criminals involved</h3>
          {criminals.length === 0 ? <EmptyState icon="users" title="No one linked yet" /> : (
            <div className="table-wrap"><table><tbody>{criminals.map((c) => (
              <tr key={c.criminal_id}>
                <td><Link to={`/criminals/${c.criminal_id}`}>{c.name}</Link></td><td>{c.role}</td><td><Badge value={c.status} /></td>
                <td className="actions">{canWrite && <button className="ghost icon" aria-label={`Remove ${c.name}`} title="Remove" onClick={() => run(() => api(`/cases/${id}/criminals/${c.criminal_id}`, 'DELETE'))}><Icon name="x" size={15} /></button>}</td>
              </tr>))}
            </tbody></table></div>
          )}
          {canWrite && (
            <form className="inline" onSubmit={(e) => { e.preventDefault(); run(() => api(`/cases/${id}/criminals`, 'POST', link)); }}>
              <select aria-label="Criminal" required value={link.criminal_id} onChange={(e) => setLink({ ...link, criminal_id: e.target.value })}>
                <option value="">Add criminal…</option>
                {all.map((c) => <option key={c.criminal_id} value={c.criminal_id}>{c.name}</option>)}
              </select>
              <select aria-label="Role" value={link.role} onChange={(e) => setLink({ ...link, role: e.target.value })}>
                {['Accused', 'Suspect', 'Convict'].map((r) => <option key={r}>{r}</option>)}
              </select>
              <button>Link</button>
            </form>
          )}
        </Reveal>
        <Reveal className="card"><h3><Icon name="scale" size={17} />Court proceedings</h3>
          {proceedings.length === 0 ? <EmptyState icon="scale" title="No hearings" /> : (
            <div className="table-wrap"><table><tbody>{proceedings.map((p, i) => <tr key={i}><td>{p.date}</td><td>{p.court}</td><td>{p.outcome ?? 'Pending'}</td></tr>)}</tbody></table></div>
          )}
        </Reveal>
        <Reveal className="card"><h3><Icon name="package" size={17} />Evidence</h3>
          {evidence.length === 0 ? <EmptyState icon="package" title="No evidence recorded" /> : (
            <div className="table-wrap"><table><tbody>{evidence.map((e) => <tr key={e.evidence_id}><td>{e.type}</td><td>{e.description}</td><td>{e.collected_on}</td></tr>)}</tbody></table></div>
          )}
        </Reveal>
        <Reveal className="card"><h3><Icon name="clock" size={17} />Status history</h3>
          {history.length === 0 ? <EmptyState icon="clock" title="No status changes yet" /> : (
            <div className="table-wrap"><table><tbody>{history.map((h) => <tr key={h.log_id}><td>{h.changed_at}</td><td>{h.old_status} → {h.new_status}</td></tr>)}</tbody></table></div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
