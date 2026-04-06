import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { daysUntil, daysLabel, urgencyLevel } from '../../lib/utils.js';
import styles from './Timeline.module.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function RippleDot({ entry, isPast, onDotClick }) {
  const [rippling, setRippling] = useState(false);
  const urg = urgencyLevel(entry.deadline);
  const n   = daysUntil(entry.deadline);
  const tip = `${entry.name}${n !== null ? ' — ' + daysLabel(entry.deadline) : ''}`;

  const handleClick = () => {
    if (isPast) return;
    setRippling(true);
    setTimeout(() => setRippling(false), 600);
    onDotClick(entry.id);
  };

  return (
    <div className={styles.dotWrap} title={tip}>
      <motion.button
        className={`${styles.dot} ${styles[`urg_${urg}`]} ${isPast ? styles.past : ''}`}
        disabled={isPast}
        onClick={handleClick}
        whileHover={!isPast ? { scale: 1.8 } : {}}
        whileTap={!isPast ? { scale: 0.9 } : {}}
        transition={{ type: 'spring', damping: 15, stiffness: 400 }}
      />
      <AnimatePresence>
        {rippling && (
          <motion.div
            className={`${styles.ripple} ${styles[`urg_${urg}`]}`}
            initial={{ scale: 0.5, opacity: 0.7 }}
            animate={{ scale: 3.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function Timeline({ entries, onDotClick }) {
  const now = new Date(); now.setHours(0,0,0,0);

  const slots = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const bySlot = Array.from({ length: 12 }, () => []);
  entries.forEach(e => {
    if (!e.deadline) return;
    const d = new Date(e.deadline);
    const idx = slots.findIndex(s => s.year === d.getFullYear() && s.month === d.getMonth());
    if (idx !== -1) bySlot[idx].push(e);
  });

  if (!bySlot.some(m => m.length > 0)) return null;

  return (
    <motion.div
      className={styles.timeline}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {slots.map(({ year, month }, i) => {
        const isCurrent = i === 0;
        const showYear  = month === 0 && i > 0;
        return (
          <div key={`${year}-${month}`} className={`${styles.col} ${isCurrent ? styles.current : ''}`}>
            <div className={styles.monthLabel}>
              {MONTHS[month]}
              {showYear && <span className={styles.yearSuffix}>'{String(year).slice(2)}</span>}
            </div>
            <div className={styles.dots}>
              {bySlot[i].map(e => {
                const n    = daysUntil(e.deadline);
                const past = n !== null && n < 0;
                return (
                  <RippleDot key={e.id} entry={e} isPast={past} onDotClick={onDotClick} />
                );
              })}
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}
