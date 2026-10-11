import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { MButton } from '../motion.jsx';
import { Icon, PageHeader, Skeleton, EmptyState, ErrorBanner, Badge } from '../ui.jsx';

const reports = [
  ['case-overview', 'Case overview'], ['wanted-criminals', 'Wanted criminals'], ['station-stats', 'Station statistics'],
  ['officer-workload', 'Officer workload'], ['repeat-offenders', 'Repeat offenders'], ['status-log', 'Case status changes'],
];

export default function Reports() {
  const [name, setName] = useState(reports[0][0]);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    setRows(null);
    api('/reports/' + name).then((r) => { setRows(r); setError(''); }).catch((e) => { setError(e.message); setRows([]); });
  }, [name]);

  const csv = () => {
    if (!rows?.length) return;
    const cols = Object.keys(rows[0]);
    const text = [cols, ...rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? '')))].map((r) => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
    a.download = name + '.csv';
    a.click();
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generated live from database views and queries">
        <button className="ghost" onClick={() => window.print()}><Icon name="printer" size={16} />Print</button>
        <MButton onClick={csv} disabled={!rows?.length}><Icon name="download" size={16} />Export CSV</MButton>
      </PageHeader>
      <div className="filters">
        <select aria-label="Report" value={name} onChange={(e) => setName(e.target.value)}>
          {reports.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {rows && <span className="result-count">{rows.length} row{rows.length === 1 ? '' : 's'}</span>}
      </div>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <div className="table-wrap">
        {rows === null ? <Skeleton /> : rows.length === 0 ? <EmptyState icon="chart" title="No data for this report" /> : (
          <table>
            <thead><tr>{Object.keys(rows[0]).map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>{Object.entries(r).map(([k, v]) => <td key={k}>{k === 'status' ? <Badge value={v} /> : v ?? '—'}</td>)}</tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
