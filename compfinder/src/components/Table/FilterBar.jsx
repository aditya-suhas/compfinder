import { Settings2 } from 'lucide-react';
import styles from './FilterBar.module.css';

const TYPES = ['__all__', 'Competition', 'Program', 'Fellowship', 'Other'];
const LABELS = { __all__: 'All' };

export function FilterBar({ entries, categories, activeType, activeCats, onTypeChange, onCatToggle, onManageCats }) {
  const typeCounts = {};
  entries.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  const usedCats = [...new Set(entries.map(e => e.category).filter(Boolean))].sort();

  return (
    <div className={styles.wrap}>
      <div className={styles.typeTabs}>
        {TYPES.map(type => {
          const label = LABELS[type] || type;
          const count = type === '__all__' ? entries.length : (typeCounts[type] || 0);
          return (
            <button
              key={type}
              className={`${styles.tab} ${activeType === type ? styles.tabActive : ''}`}
              onClick={() => onTypeChange(type)}
            >
              {label}
              {count > 0 && <span className={styles.count}>{count}</span>}
            </button>
          );
        })}
      </div>

      {usedCats.length > 0 && (
        <div className={styles.pills}>
          <button
            className={`${styles.pill} ${activeCats.has('__all__') ? styles.pillActive : ''}`}
            onClick={() => onCatToggle('__all__')}
          >
            All categories
          </button>
          {usedCats.map(cat => (
            <button
              key={cat}
              className={`${styles.pill} ${!activeCats.has('__all__') && activeCats.has(cat) ? styles.pillActive : ''}`}
              onClick={() => onCatToggle(cat)}
            >
              {cat}
            </button>
          ))}
          <button className={styles.manageCats} onClick={onManageCats} title="Manage categories">
            <Settings2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
