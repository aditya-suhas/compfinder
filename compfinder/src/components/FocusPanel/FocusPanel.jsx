import { ChevronRight, Zap, Check } from 'lucide-react';
import styles from './FocusPanel.module.css';

export function FocusPanel({ entries, collapsed, onToggle, onToggleCheck }) {
  const active = entries.filter(
    e => (e.status === 'Committed' || e.status === 'Doing') && (e.checklist || []).length > 0
  );

  if (!active.length) return null;

  const totalPending = active.reduce(
    (sum, e) => sum + (e.checklist || []).filter(c => !c.done).length, 0
  );

  return (
    <div className={styles.panel}>
      <button className={styles.header} onClick={onToggle}>
        <ChevronRight
          size={13}
          className={`${styles.chevron} ${!collapsed ? styles.chevronOpen : ''}`}
        />
        <Zap size={13} className={styles.icon} />
        <span className={styles.title}>What's Active</span>
        <span className={styles.meta}>
          {totalPending} pending task{totalPending !== 1 ? 's' : ''} across {active.length} entr{active.length !== 1 ? 'ies' : 'y'}
        </span>
      </button>

      {!collapsed && (
        <div className={styles.body}>
          {active.map(e => {
            const cl = e.checklist || [];
            const doneCount = cl.filter(c => c.done).length;
            const pct = cl.length > 0 ? (doneCount / cl.length) * 100 : 0;
            return (
              <div key={e.id} className={styles.entry}>
                <div className={styles.entryHeader}>
                  <span className={styles.entryName}>{e.name}</span>
                  <span className={styles.entryProg}>{doneCount}/{cl.length}</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                </div>
                <ul className={styles.tasks}>
                  {cl.map(item => (
                    <li key={item.id} className={`${styles.task} ${item.done ? styles.taskDone : ''}`}>
                      <button
                        className={`${styles.checkBtn} ${item.done ? styles.checkBtnDone : ''}`}
                        onClick={() => onToggleCheck(e.id, item.id)}
                      >
                        {item.done && <Check size={9} />}
                      </button>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
