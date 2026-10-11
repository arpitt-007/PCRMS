import React, { useState } from 'react';
import { motion } from 'motion/react';
import { api } from '../api.js';
import { MButton, container, item } from '../motion.jsx';
import { Icon, ErrorBanner } from '../ui.jsx';

const demos = [['admin', 'admin123'], ['officer', 'officer123'], ['viewer', 'viewer123']];
const features = [
  ['folder', 'Cases, FIRs and complaints in one place'],
  ['users', 'Criminal profiles with full case history'],
  ['package', 'Evidence with a tamper-evident chain of custody'],
  ['chart', 'Instant reports and statistics'],
];

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const { token, user } = await api('/login', 'POST', { username, password });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="login">
      <motion.section className="login-hero" variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="brand">
          <span className="brand-mark"><Icon name="shield" size={19} color="#fff" /></span>
          <h1>PCRMS</h1>
        </motion.div>
        <motion.h2 variants={item}>Every record. <span>One secure system.</span></motion.h2>
        <motion.p variants={item}>Police Records &amp; Criminal Management System — a centralized database for cases, arrests, evidence and court proceedings.</motion.p>
        <ul className="feature-list">
          {features.map(([icon, text]) => (
            <motion.li key={text} variants={item}><span className="ico"><Icon name={icon} size={17} /></span>{text}</motion.li>
          ))}
        </ul>
      </motion.section>

      <section className="login-panel">
        <motion.form className="login-form" onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}>
          <div>
            <h3>Welcome back</h3>
            <p className="subtitle">Sign in to access the records system.</p>
          </div>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <label>Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          <MButton disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</MButton>
          <div className="demo-box">
            Demo accounts — click to fill:<br />
            {demos.map(([u, p]) => (
              <button type="button" key={u} onClick={() => { setUsername(u); setPassword(p); }}>{u}</button>
            ))}
          </div>
        </motion.form>
      </section>
    </div>
  );
}
