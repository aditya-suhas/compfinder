import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { daysUntil } from '../../lib/utils.js';
import styles from './StatCards.module.css';

function CountUp({ value }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return display;
}

function TiltCard({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-6, 6]);
  const springRX = useSpring(rotateX, { damping: 20, stiffness: 200 });
  const springRY = useSpring(rotateY, { damping: 20, stiffness: 200 });

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: springRX, rotateY: springRY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay }}
      whileHover={{ boxShadow: '0 8px 32px rgba(26,25,23,0.14)' }}
    >
      {children}
    </motion.div>
  );
}

export function StatCards({ entries }) {
  const total  = entries.length;
  const urgent = entries.filter(e => {
    const n = daysUntil(e.deadline);
    return n !== null && n >= 0 && n <= 14 && e.status !== 'Done' && e.status !== 'Skipped';
  }).length;
  const active = entries.filter(e => e.status === 'Committed' || e.status === 'Doing').length;

  return (
    <div className={styles.cards}>
      <TiltCard className={styles.card} delay={0.05}>
        <div className={styles.num}><CountUp value={total} /></div>
        <div className={styles.label}>total tracked</div>
      </TiltCard>

      <TiltCard className={`${styles.card} ${urgent > 0 ? styles.urgent : ''}`} delay={0.1}>
        <div className={styles.num}><CountUp value={urgent} /></div>
        <div className={styles.label}>due in 14 days</div>
        {urgent > 0 && (
          <motion.div
            className={styles.urgentPulse}
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </TiltCard>

      <TiltCard className={styles.card} delay={0.15}>
        <div className={styles.num}><CountUp value={active} /></div>
        <div className={styles.label}>active now</div>
      </TiltCard>
    </div>
  );
}
