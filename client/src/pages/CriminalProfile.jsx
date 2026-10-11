import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { Reveal } from '../motion.jsx';
import { Icon, PageHeader, Spinner, ErrorBanner, EmptyState, Badge } from '../ui.jsx';

export default function CriminalProfile() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/criminals/${id}/history`).then(setD).catch((e) => setError(e.message)); }, [id]);
  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  if (!d) return <Spinner label="Loading profile" />;
  const c = d.criminal;
  return (
    <div>
      <PageHeader title={c.name} subtitle={`Criminal record #${c.criminal_id}`}
        back={<Link to="/criminals" className="back-link"><Icon name="arrowLeft" size={15} />All criminals</Link>}>
        <Badge value={c.status} />
      </PageHeader>
      <Reveal className="card profile">
        {c.photo ? <img src={c.photo} alt={c.name} /> : <div className="photo"><Icon name="badge" size={36} /></div>}
        <div>
          <p>Date of birth: <b>{c.dob ?? '—'}</b></p>
          <p>Gender: <b>{c.gender ?? '—'}</b></p>
          <p>Address: <b>{c.address ?? '—'}</b></p>
        </div>
      </Reveal>
      <div className="grid2">
        <Reveal className="card"><h3><Icon name="folder" size={17} />Case history</h3>
          {d.cases.length === 0 ? <EmptyState icon="folder" title="No cases on record" /> : (
            <div className="table-wrap"><table><tbody>{d.cases.map((k) => (
              <tr key={k.case_id}><td><Link to={`/cases/${k.case_id}`}>{k.fir_number}</Link></td><td>{k.title}</td><td>{k.role}</td><td><Badge value={k.status} /></td></tr>))}
            </tbody></table></div>
          )}
        </Reveal>
        <Reveal className="card"><h3><Icon name="lock" size={17} />Arrests</h3>
          {d.arrests.length === 0 ? <EmptyState icon="lock" title="No arrests on record" /> : (
            <div className="table-wrap"><table><tbody>{d.arrests.map((a) => <tr key={a.arrest_id}><td>{a.date}</td><td>{a.location}</td><td>{a.charges}</td></tr>)}</tbody></table></div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
