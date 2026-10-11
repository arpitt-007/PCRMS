import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api.js';
import { Stagger, rowItem, MButton } from '../motion.jsx';
import { resources } from '../config.js';
import { Icon, PageHeader, Skeleton, EmptyState, ErrorBanner, Badge } from '../ui.jsx';

export default function ResourcePage({ name, role }) {
  const cfg = resources[name];
  const [rows, setRows] = useState(null); // null = loading
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | row
  const [refs, setRefs] = useState({});
  const [custody, setCustody] = useState(null);
  const canWrite = role !== 'viewer';

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    api(`/${name}?${p}`).then(setRows).catch((e) => { setError(e.message); setRows([]); });
  }, [name, q, status]);
  useEffect(load, [load]);

  useEffect(() => {
    cfg.fields.filter((f) => f.ref).forEach((f) =>
      api('/' + f.ref.resource).then((d) => setRefs((r) => ({ ...r, [f.name]: d }))));
  }, [name]);

  const refLabel = (f, row) => (f.show ? row[f.show] : row[f.name]);
  const remove = async (row) => {
    if (!confirm('Delete this record?')) return;
    try { await api(`/${name}/${row[cfg.pk]}`, 'DELETE'); setError(''); load(); }
    catch (e) { setError(e.message); }
  };
  const save = async (form) => {
    try {
      if (form[cfg.pk]) await api(`/${name}/${form[cfg.pk]}`, 'PUT', form);
      else if (name === 'cases') await api('/fir', 'POST', form); // stored procedure sp_register_fir
      else await api(`/${name}`, 'POST', form);
      setEditing(null); setError(''); load();
    } catch (e) { setError(e.message); }
  };
  const showCustody = async (row) => setCustody({ row, log: await api(`/evidence/${row.evidence_id}/custody`) });
  const cols = cfg.fields.filter((f) => !f.hideInTable);

  return (
    <div>
      <PageHeader title={cfg.title} subtitle={rows ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : 'Loading…'}>
        {canWrite && <MButton onClick={() => setEditing({})}><Icon name="plus" size={16} />Add new</MButton>}
      </PageHeader>
      <div className="filters">
        <div className="search">
          <Icon name="search" size={16} />
          <input aria-label={`Search ${cfg.title}`} placeholder={`Search ${cfg.title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {cfg.statusFilter && (
          <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {cfg.statusFilter.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <div className="table-wrap">
        {rows === null ? <Skeleton /> : rows.length === 0 ? (
          <EmptyState title={q || status ? 'No matching records' : `No ${cfg.title.toLowerCase()} yet`}
            hint={q || status ? 'Try a different search or clear the filter.' : canWrite ? 'Use “Add new” to create the first record.' : undefined} />
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                {cols.map((f) => <th key={f.name}>{f.label}</th>)}
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <Stagger as="tbody" key={name + rows.length}>
              {rows.map((r) => (
                <motion.tr key={r[cfg.pk]} variants={rowItem} whileHover={{ backgroundColor: '#f8f9fd' }}>
                  <td>{cfg.link ? <Link to={cfg.link(r)}>{r[cfg.pk]}</Link> : r[cfg.pk]}</td>
                  {cols.map((f) => (
                    <td key={f.name}>{f.name === 'status' ? <Badge value={r.status} /> : refLabel(f, r) ?? '—'}</td>
                  ))}
                  <td className="actions">
                    <span className="row-actions">
                      {cfg.custody && <button className="ghost" onClick={() => showCustody(r)}><Icon name="clock" size={15} />Custody</button>}
                      {canWrite && <button className="ghost icon" aria-label="Edit" title="Edit" onClick={() => setEditing(r)}><Icon name="edit" size={15} /></button>}
                      {role === 'admin' && <button className="danger icon" aria-label="Delete" title="Delete" onClick={() => remove(r)}><Icon name="trash" size={15} /></button>}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </Stagger>
          </table>
        )}
      </div>
      <AnimatePresence>{editing && <FormModal cfg={cfg} refs={refs} initial={editing} onSave={save} onClose={() => setEditing(null)} isNew={!editing[cfg.pk]} isCase={name === 'cases'} />}</AnimatePresence>
      <AnimatePresence>{custody && <CustodyModal data={custody} canWrite={canWrite} onClose={() => setCustody(null)} reload={() => showCustody(custody.row)} />}</AnimatePresence>
    </div>
  );
}

function FormModal({ cfg, refs, initial, onSave, onClose, isNew, isCase }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  // new FIRs are filed through sp_register_fir: status and date are set by the database
  const fields = cfg.fields.filter((f) => !(isCase && isNew && ['status', 'filed_date'].includes(f.name)));
  return (
    <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.form className="modal" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <h3>{isNew ? 'Add to' : 'Edit in'} {cfg.title}</h3>
        {fields.map((f) => (
          <label key={f.name}>{f.label}{f.required && ' *'}
            {f.ref ? (
              <select value={form[f.name] ?? ''} required={f.required} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">— select —</option>
                {(refs[f.name] || []).map((o) => (
                  <option key={o[Object.keys(o)[0]]} value={o[Object.keys(o)[0]]}>
                    {o[f.ref.label]}{f.ref.label !== 'name' && o.name ? ` — ${o.name}` : ''}{o.criminal ? ` (${o.criminal})` : ''}
                  </option>
                ))}
              </select>
            ) : f.options ? (
              <select value={form[f.name] ?? ''} required={f.required} onChange={(e) => set(f.name, e.target.value)}>
                <option value="">— select —</option>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea rows={3} value={form[f.name] ?? ''} required={f.required} onChange={(e) => set(f.name, e.target.value)} />
            ) : (
              <input type={f.type || 'text'} value={form[f.name] ?? ''} required={f.required} onChange={(e) => set(f.name, e.target.value)} />
            )}
          </label>
        ))}
        <div className="row"><MButton type="button" className="ghost" onClick={onClose}>Cancel</MButton><MButton>Save</MButton></div>
      </motion.form>
    </motion.div>
  );
}

function CustodyModal({ data, canWrite, onClose, reload }) {
  const [action, setAction] = useState('');
  const [officers, setOfficers] = useState([]);
  const [officer, setOfficer] = useState('');
  useEffect(() => { api('/officers').then(setOfficers); }, []);
  const add = async (e) => {
    e.preventDefault();
    await api(`/evidence/${data.row.evidence_id}/custody`, 'POST', { officer_id: officer, action });
    setAction(''); reload();
  };
  return (
    <motion.div className="overlay" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="modal" initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
        <h3>Chain of custody <span className="subtitle">· evidence #{data.row.evidence_id}</span></h3>
        <div className="table-wrap"><table><thead><tr><th>When</th><th>Officer</th><th>Action</th></tr></thead>
          <tbody>{data.log.map((l) => <tr key={l.custody_id}><td>{l.logged_at}</td><td>{l.officer}</td><td>{l.action}</td></tr>)}</tbody></table></div>
        {canWrite && (
          <form onSubmit={add} className="inline">
            <select required value={officer} onChange={(e) => setOfficer(e.target.value)}>
              <option value="">Officer</option>{officers.map((o) => <option key={o.officer_id} value={o.officer_id}>{o.name}</option>)}
            </select>
            <input required placeholder="e.g. Transferred to forensic lab" value={action} onChange={(e) => setAction(e.target.value)} />
            <button>Log</button>
          </form>
        )}
        <div className="row"><button className="ghost" onClick={onClose}>Close</button></div>
      </motion.div>
    </motion.div>
  );
}
