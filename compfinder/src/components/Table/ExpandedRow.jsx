import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, RotateCcw, Plus, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './ExpandedRow.module.css';

export function ExpandedRow({ entry, onToggleCheck, onDeleteCheck, onAddCheck }) {
  const [newTask, setNewTask] = useState('');
  const [showEmbed, setShowEmbed] = useState(false);
  const inputRef = useRef(null);

  const checklist = entry.checklist || [];
  const doneCount = checklist.filter(c => c.done).length;

  const handleAdd = () => {
    const text = newTask.trim();
    if (!text) return;
    onAddCheck(entry.id, text);
    setNewTask('');
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.grid}>
        {entry.notes && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Notes</h4>
            <p className={styles.notes}>{entry.notes}</p>
          </div>
        )}

        {entry.eligibility && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Eligibility</h4>
            <p className={styles.elig}>{entry.eligibility}</p>
          </div>
        )}

        {entry.url && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Website</h4>
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.url}
            >
              {entry.url.replace(/^https?:\/\/(www\.)?/, '')}
              <ExternalLink size={11} />
            </a>
          </div>
        )}

        {entry.lastCycled && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Last cycled</h4>
            <span className={styles.cycled}>
              <RotateCcw size={11} /> {entry.lastCycled}
            </span>
          </div>
        )}

        {entry.notionUrl && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Notion</h4>
            <div className={styles.notionRow}>
              <a
                href={entry.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.url}
              >
                Open in Notion <ExternalLink size={11} />
              </a>
              <button
                className={styles.embedToggle}
                onClick={() => setShowEmbed(v => !v)}
              >
                {showEmbed ? <><ChevronUp size={11} /> Hide embed</> : <><ChevronDown size={11} /> Show embed</>}
              </button>
            </div>
            {showEmbed && (
              <iframe
                src={entry.notionUrl}
                className={styles.notionEmbed}
                title="Notion page"
                frameBorder="0"
                allowFullScreen
              />
            )}
          </div>
        )}

        <div className={`${styles.section} ${styles.checklistSection}`}>
          <h4 className={styles.sectionTitle}>
            Checklist
            {checklist.length > 0 && (
              <span className={styles.checkProg}>{doneCount}/{checklist.length}</span>
            )}
          </h4>
          {checklist.length > 0 && (
            <ul className={styles.checklist}>
              {checklist.map(item => (
                <li key={item.id} className={`${styles.checkItem} ${item.done ? styles.done : ''}`}>
                  <motion.button
                    className={`${styles.checkBtn} ${item.done ? styles.checkBtnDone : ''}`}
                    onClick={() => onToggleCheck(entry.id, item.id)}
                    title={item.done ? 'Mark undone' : 'Mark done'}
                    whileTap={{ scale: 0.8 }}
                    animate={item.done ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 400 }}
                  >
                    {item.done && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 10, stiffness: 500 }}
                      >
                        <Check size={9} />
                      </motion.div>
                    )}
                  </motion.button>
                  <span className={styles.checkText}>{item.text}</span>
                  <button
                    className={styles.checkDel}
                    onClick={() => onDeleteCheck(entry.id, item.id)}
                    title="Remove task"
                  >
                    <X size={10} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className={styles.addTask}>
            <input
              ref={inputRef}
              type="text"
              className={styles.taskInput}
              placeholder="Add a task..."
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
            />
            <button className={styles.addTaskBtn} onClick={handleAdd} title="Add task">
              <Plus size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
