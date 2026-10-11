import React from 'react';
import { motion } from 'motion/react';

const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  folder: <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
  inbox: <><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  package: <><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></>,
  scale: <><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /><path d="m5 8-3 8a5 5 0 0 0 6 0Z" /><path d="m19 8-3 8a5 5 0 0 0 6 0Z" /></>,
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  building: <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" /></>,
  landmark: <><path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7" /><path d="m12 2 8 5H4Z" /></>,
  chart: <path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  plus: <path d="M5 12h14M12 5v14" />,
  edit: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  trash: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  arrowLeft: <path d="m12 19-7-7 7-7M19 12H5" />,
  alert: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  printer: <><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  badge: <><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></>,
  siren: <><path d="M7 18v-6a5 5 0 1 1 10 0v6" /><path d="M5 21a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1H5zM21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.93 4.93l.7.7" /></>,
  file: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></>,
};

export const Icon = ({ name, size = 18, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{paths[name]}</svg>
);

export const navIcons = {
  '/': 'dashboard', '/cases': 'folder', '/complaints': 'inbox', '/criminals': 'users', '/arrests': 'lock',
  '/evidence': 'package', '/proceedings': 'scale', '/officers': 'shield', '/stations': 'building',
  '/courts': 'landmark', '/reports': 'chart',
};

export const PageHeader = ({ title, subtitle, children, back }) => (
  <div className="page-head">
    <div>
      {back}
      <h2>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
    {children && <div className="page-actions">{children}</div>}
  </div>
);

export const Spinner = ({ label = 'Loading' }) => (
  <div className="state" role="status"><span className="spinner" /><span>{label}…</span></div>
);

export const Skeleton = ({ rows = 5 }) => (
  <div className="skeleton-list" aria-busy="true">
    {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" style={{ opacity: 1 - i * 0.14 }} />)}
  </div>
);

export const EmptyState = ({ icon = 'inbox', title = 'Nothing here yet', hint }) => (
  <div className="state empty-state">
    <span className="state-icon"><Icon name={icon} size={22} /></span>
    <b>{title}</b>
    {hint && <span>{hint}</span>}
  </div>
);

export const ErrorBanner = ({ children }) => (
  <motion.div className="error" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
    <Icon name="alert" size={16} /> <span>{children}</span>
  </motion.div>
);

export const Badge = ({ value }) => (
  <span className={'badge ' + String(value).replace(/\s/g, '')}><i />{value}</span>
);
