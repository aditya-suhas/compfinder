import { useState } from 'react';
import { ModalBase } from './ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { Plus, X } from 'lucide-react';
import styles from './CatModal.module.css';

export function CatModal({ categories, entries, onSave, onClose }) {
  const [cats, setCats] = useState([...categories]);
  const [newCat, setNewCat] = useState('');
  const [error, setError] = useState('');

  const usageCounts = {};
  entries.forEach(e => { usageCounts[e.category] = (usageCounts[e.category] || 0) + 1; });

  const addCat = () => {
    const val = newCat.trim();
    if (!val) return;
    if (cats.map(c => c.toLowerCase()).includes(val.toLowerCase())) {
      setError('Category already exists');
      return;
    }
    setCats([...cats, val]);
    setNewCat('');
    setError('');
  };

  const removeCat = (cat) => {
    const count = usageCounts[cat] || 0;
    if (count > 0) {
      if (!window.confirm(`"${cat}" is used by ${count} ${count === 1 ? 'entry' : 'entries'}. Delete anyway?`)) return;
    }
    setCats(cats.filter(c => c !== cat));
  };

  const handleDone = () => {
    onSave(cats);
    onClose();
  };

  return (
    <ModalBase title="Manage categories" onClose={handleDone} width={440}>
      <div className={styles.content}>
        <div className={styles.addRow}>
          <input
            className={styles.input}
            value={newCat}
            onChange={e => { setNewCat(e.target.value); setError(''); }}
            placeholder="New category name..."
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCat(); } }}
            autoFocus
          />
          <Button variant="primary" size="sm" onClick={addCat}>
            <Plus size={13} /> Add
          </Button>
        </div>
        {error && <span className={styles.error}>{error}</span>}

        <ul className={styles.list}>
          {cats.map(cat => {
            const count = usageCounts[cat] || 0;
            return (
              <li key={cat} className={styles.item}>
                <span className={styles.catName}>{cat}</span>
                {count > 0 && (
                  <span className={styles.count}>{count} {count === 1 ? 'entry' : 'entries'}</span>
                )}
                <button className={styles.delBtn} onClick={() => removeCat(cat)} title="Remove category">
                  <X size={12} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleDone}>Done</Button>
        </div>
      </div>
    </ModalBase>
  );
}
