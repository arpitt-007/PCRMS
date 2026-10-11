import React from 'react';
import { motion } from 'motion/react';

// Shared animation presets so every page animates the same way.
export const container = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
export const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };
export const rowItem = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { duration: 0.25 } } };

// Staggered group: wrap children that use `item` / `rowItem`.
export const Stagger = ({ as = 'div', children, ...p }) => {
  const Tag = motion[as];
  return <Tag variants={container} initial="hidden" animate="show" {...p}>{children}</Tag>;
};

// Fades/slides in when scrolled into view.
export const Reveal = ({ children, className, delay = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.45, delay, ease: 'easeOut' }}>
    {children}
  </motion.div>
);

// Button with hover/tap feedback.
export const MButton = ({ children, ...p }) => (
  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} {...p}>
    {children}
  </motion.button>
);

export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};
