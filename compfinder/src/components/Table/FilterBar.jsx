import { Settings2, Plus, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import styles from './FilterBar.module.css';

const TYPES = ['__all__', 'Competition', 'Program', 'Fellowship', 'Other'];
const LABELS = { __all__: 'All' };

export function FilterBar({ entries, categories, activeType, activeCats, sortKey, onSort, onTypeChange, onCatToggle, onManageCats, onAddEntry }) {
  const typeCounts = {};
  entries.forEach(e => { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; });

  const usedCats = [...new Set(entries.map(e => e.category).filter(Boolean))].sort();

  return (
    <div className={styles.wrap}>
      <div className={styles.typeTabsRow}>
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
        <div className={styles.tabsRight}>
          <button
            className={`${styles.smartSort} ${sortKey === 'smart' ? styles.smartSortActive : ''}`}
            onClick={() => onSort(sortKey === 'smart' ? 'deadline' : 'smart')}
            title="Smart sort: groups by active status first, then by deadline"
          >
            <Sparkles size={11} />
            Smart sort
          </button>
          <Button variant="primary" size="sm" onClick={onAddEntry}>
            <Plus size={13} /> Add entry
          </Button>
        </div>
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
