import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { Reveal } from '../motion.jsx';
import { Icon, PageHeader, Spinner, EmptyState, ErrorBanner, Badge } from '../ui.jsx';

export default function SearchResults() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [r, setR] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { setR(null); api('/search?q=' + encodeURIComponent(q)).then(setR).catch((e) => setError(e.message)); }, [q]);
  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  if (!r) return <Spinner label="Searching" />;
  const total = r.criminals.length + r.cases.length + r.officers.length;
  return (
    <div>
      <PageHeader title={`Results for “${q}”`} subtitle={`${total} match${total === 1 ? '' : 'es'} across criminals, cases and officers`} />
      <div className="grid2">
        <Reveal className="card"><h3><Icon name="users" size={17} />Criminals ({r.criminals.length})</h3>
          {r.criminals.length === 0 ? <EmptyState icon="search" title="No matches" /> :
            r.criminals.map((c) => <p key={c.id}><Link to={`/criminals/${c.id}`}>{c.name}</Link> <Badge value={c.status} /></p>)}</Reveal>
        <Reveal className="card" delay={0.06}><h3><Icon name="folder" size={17} />Cases ({r.cases.length})</h3>
          {r.cases.length === 0 ? <EmptyState icon="search" title="No matches" /> :
            r.cases.map((c) => <p key={c.id}><Link to={`/cases/${c.id}`}>{c.fir_number}</Link> — {c.title} <Badge value={c.status} /></p>)}</Reveal>
        <Reveal className="card" delay={0.12}><h3><Icon name="shield" size={17} />Officers ({r.officers.length})</h3>
          {r.officers.length === 0 ? <EmptyState icon="search" title="No matches" /> :
            r.officers.map((o) => <p key={o.id}>{o.name} — {o.badge_number}</p>)}</Reveal>
      </div>
    </div>
  );
}
