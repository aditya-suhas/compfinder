import { X, AlertTriangle } from 'lucide-react';
import { daysUntil, daysLabel } from '../lib/utils.js';
import styles from './UrgencyBanner.module.css';

export function UrgencyBanner({ entries, dismissed, onDismiss }) {
  if (dismissed) return null;

  const urgent = entries
    .filter(e => {
      const n = daysUntil(e.deadline);
      return n !== null && n >= 0 && n <= 30 && e.status !== 'Done' && e.status !== 'Skipped';
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 4);

  if (!urgent.length) return null;

  return (
    <div className={styles.banner}>
      <AlertTriangle size={14} className={styles.icon} />
      <div className={styles.content}>
        <span className={styles.label}>Due within 30 days</span>
        <div className={styles.items}>
          {urgent.map(e => (
            <span key={e.id} className={styles.item}>
              {e.name}
              <strong> — {daysLabel(e.deadline)}</strong>
            </span>
          ))}
        </div>
      </div>
      <button className={styles.dismiss} onClick={onDismiss} title="Dismiss" aria-label="Dismiss banner">
        <X size={13} />
      </button>
    </div>
  );
}
