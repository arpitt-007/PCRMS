import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants } from './motion.jsx';
import { Icon, navIcons } from './ui.jsx';
import { getUser, logout } from './api.js';
import { nav, resources } from './config.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ResourcePage from './pages/ResourcePage.jsx';
import CaseDetail from './pages/CaseDetail.jsx';
import CriminalProfile from './pages/CriminalProfile.jsx';
import Reports from './pages/Reports.jsx';
import SearchResults from './pages/SearchResults.jsx';

const workspace = nav.filter(([to]) => !['/officers', '/stations', '/courts', '/reports'].includes(to));
const admin = nav.filter(([to]) => ['/officers', '/stations', '/courts', '/reports'].includes(to));

export default function App() {
  const [user, setUser] = useState(getUser());
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login onLogin={setUser} />} />
      </Routes>
    );
  }
  const signOut = () => { logout(); setUser(null); navigate('/login'); };
  const search = (e) => { e.preventDefault(); if (q.trim()) navigate('/search?q=' + encodeURIComponent(q.trim())); };
  const link = ([to, label]) => (
    <motion.div key={to} whileHover={{ x: 3 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }}>
      <NavLink to={to} end={to === '/'}><Icon name={navIcons[to]} size={17} />{label}</NavLink>
    </motion.div>
  );

  return (
    <div className="layout">
      <aside className={open ? 'open' : ''} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-mark"><Icon name="shield" size={19} color="#fff" /></span>
          <h1>PCRMS<small>Police Records System</small></h1>
        </div>
        <nav>
          <div className="nav-label">Workspace</div>
          {workspace.map(link)}
          <div className="nav-label">Manage</div>
          {admin.map(link)}
        </nav>
        <div className="side-foot">Signed in as {user.username}</div>
      </aside>
      <AnimatePresence>
        {open && <motion.div className="drawer-scrim" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
      </AnimatePresence>
      <div className="main">
        <header className="topbar">
          <button className="ghost icon menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="menu" /></button>
          <form className="search" onSubmit={search} role="search">
            <Icon name="search" size={16} />
            <input aria-label="Search" placeholder="Search criminals, cases, officers…" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <span className="spacer" />
          <div className="user-chip">
            <span className="avatar">{user.username[0]}</span>
            <div><b>{user.username}</b><em>{user.role}</em></div>
          </div>
          <motion.button className="ghost icon" aria-label="Log out" title="Log out" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} onClick={signOut}>
            <Icon name="logout" />
          </motion.button>
        </header>
        <main className="content">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
              <Routes location={location}>
                <Route path="/" element={<Dashboard user={user} />} />
                <Route path="/login" element={<Navigate to="/" />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/cases/:id" element={<CaseDetail role={user.role} />} />
                <Route path="/criminals/:id" element={<CriminalProfile />} />
                {Object.keys(resources).map((k) => (
                  <Route key={k} path={'/' + k} element={<ResourcePage key={k} name={k} role={user.role} />} />
                ))}
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
