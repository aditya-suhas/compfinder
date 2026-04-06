import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { TypeBadge, CatBadge } from '../ui/Badge.jsx';
import { ExpandedRow } from './ExpandedRow.jsx';
import { urgencyLevel, daysLabel, fmtDeadline, drainPct } from '../../lib/utils.js';
import styles from './TableRow.module.css';

const STATUSES = ['Contemplating', 'Committed', 'Doing', 'Done', 'Skipped'];

export function TableRow({
  entry,
  isExpanded,
  index,
  onToggleExpand,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleCheck,
  onDeleteCheck,
  onAddCheck,
}) {
  const [shaking, setShaking] = useState(false);
  const [statusPulsing, setStatusPulsing] = useState(false);

  const urg   = urgencyLevel(entry.deadline);
  const label = daysLabel(entry.deadline);
  const drain = drainPct(entry.deadline);
  const skipped = entry.status === 'Skipped' || entry.status === 'Done';

  const handleDelete = () => {
    setShaking(true);
    setTimeout(() => { setShaking(false); onDelete(entry.id); }, 500);
  };

  const handleStatusChange = (val) => {
    setStatusPulsing(true);
    setTimeout(() => setStatusPulsing(false), 600);
    onStatusChange(entry.id, val);
  };

  return (
    <>
      <motion.tr
        className={`${styles.row} ${skipped ? styles.skipped : ''} ${isExpanded ? styles.expanded : ''}`}
        data-id={entry.id}
        initial={{ opacity: 0, x: -8 }}
        animate={
          shaking
            ? { x: [0, -6, 6, -4, 4, 0], opacity: 1 }
            : { opacity: 1, x: 0 }
        }
        exit={{ opacity: 0, scale: 0.96, y: -4 }}
        transition={
          shaking
            ? { duration: 0.45, times: [0, 0.2, 0.4, 0.6, 0.8, 1] }
            : { duration: 0.22, delay: index * 0.02, ease: [0.4, 0, 0.2, 1] }
        }
        whileHover={{ backgroundColor: 'var(--surface2)' }}
        layout
      >
        {/* Time-drain + name */}
        <td className={styles.nameCell}>
          <div
            className={styles.drainBar}
            title={label || 'No deadline'}
            onMouseEnter={e => {
              e.currentTarget.querySelector(`.${styles.drainFill}`)?.classList.add(styles.drainExpanded);
            }}
            onMouseLeave={e => {
              e.currentTarget.querySelector(`.${styles.drainFill}`)?.classList.remove(styles.drainExpanded);
            }}
          >
            {drain !== null && (
              <motion.div
                className={`${styles.drainFill} ${styles[`urg_${urg}`]}`}
                initial={{ height: '0%' }}
                animate={{ height: `${drain}%` }}
                transition={{ duration: 0.8, delay: index * 0.03 + 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </div>

          <div className={styles.nameContent}>
            <motion.button
              className={styles.expandBtn}
              onClick={() => onToggleExpand(entry.id)}
              title={isExpanded ? 'Collapse' : 'Expand'}
              whileTap={{ scale: 0.85 }}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                <ChevronRight size={13} />
              </motion.div>
            </motion.button>

            <div>
              <motion.div
                className={styles.entryName}
                onClick={() => onToggleExpand(entry.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onToggleExpand(entry.id)}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                {entry.name}
              </motion.div>
              {entry.pipeline && (
                <div className={styles.pipeline}>{entry.pipeline}</div>
              )}
            </div>
          </div>
        </td>

        {/* Type + category */}
        <td className={styles.typeCell}>
          <TypeBadge type={entry.type} />
          <CatBadge category={entry.category} />
        </td>

        {/* Deadline */}
        <td className={styles.deadlineCell}>
          <div className={`${styles.deadlineText} ${styles[`dl_${urg}`]}`}>
            {fmtDeadline(entry)}
          </div>
          {label && (
            <div className={`${styles.daysLabel} ${styles[`dl_${urg}`]}`}>
              {label}
            </div>
          )}
        </td>

        {/* Status */}
        <td className={styles.statusCell}>
          <motion.div
            animate={statusPulsing ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <select
              className={`${styles.statusSelect} ${styles[`st_${entry.status?.replace(/\s/g, '_')}`]}`}
              value={entry.status}
              onChange={e => handleStatusChange(e.target.value)}
            >
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </motion.div>
        </td>

        {/* Actions */}
        <td className={styles.actionsCell}>
          <motion.button
            className={styles.actionBtn}
            onClick={() => onEdit(entry.id)}
            title="Edit entry"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Pencil size={12} />
          </motion.button>
          <motion.button
            className={`${styles.actionBtn} ${styles.actionDanger}`}
            onClick={handleDelete}
            title="Delete entry"
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 size={12} />
          </motion.button>
        </td>
      </motion.tr>

      <AnimatePresence>
        {isExpanded && (
          <motion.tr
            key={`${entry.id}-expanded`}
            className={styles.expandRow}
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ originY: 0 }}
          >
            <td colSpan={5} style={{ padding: 0 }}>
              <ExpandedRow
                entry={entry}
                onToggleCheck={onToggleCheck}
                onDeleteCheck={onDeleteCheck}
                onAddCheck={onAddCheck}
              />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
