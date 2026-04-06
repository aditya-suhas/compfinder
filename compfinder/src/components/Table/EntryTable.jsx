import { ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { TableRow } from './TableRow.jsx';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import styles from './EntryTable.module.css';

const COLS = [
  { key: 'name',     label: 'Entry',    sortable: true },
  { key: 'type',     label: 'Type',     sortable: false },
  { key: 'deadline', label: 'Deadline', sortable: true },
  { key: 'status',   label: 'Status',   sortable: false },
  { key: 'actions',  label: '',         sortable: false },
];

function SortIcon({ colKey, sortKey, sortDir }) {
  if (sortKey !== colKey) return <Minus size={10} style={{ opacity: 0.25 }} />;
  return sortDir === 1
    ? <ChevronDown size={11} />
    : <ChevronUp size={11} />;
}

export function EntryTable({
  entries,
  filteredEntries,
  expandedIds,
  sortKey,
  sortDir,
  onSort,
  onToggleExpand,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleCheck,
  onDeleteCheck,
  onAddCheck,
  onAddEntry,
  highlightId,
}) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headRow}>
            {COLS.map(col => (
              <th key={col.key} className={styles.th}>
                {col.sortable ? (
                  <button className={styles.sortBtn} onClick={() => onSort(col.key)}>
                    {col.label}
                    <SortIcon colKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </button>
                ) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredEntries.length === 0 ? (
            <tr>
              <td colSpan={5} className={styles.empty}>
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>No entries found</p>
                  <p className={styles.emptyHint}>Try adjusting your filters or search</p>
                  <Button variant="primary" size="sm" onClick={onAddEntry}>
                    <Plus size={13} /> Add entry
                  </Button>
                </div>
              </td>
            </tr>
          ) : (
            filteredEntries.map((entry, i) => (
              <TableRow
                key={entry.id}
                entry={entry}
                index={i}
                isExpanded={expandedIds.has(entry.id)}
                highlight={highlightId === entry.id}
                onToggleExpand={onToggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onToggleCheck={onToggleCheck}
                onDeleteCheck={onDeleteCheck}
                onAddCheck={onAddCheck}
              />
            ))
          )}
        </tbody>
      </table>

      <div className={styles.footer}>
        <span className={styles.count}>
          {filteredEntries.length === entries.length
            ? `${entries.length} entries`
            : `${filteredEntries.length} of ${entries.length} entries`}
        </span>
        <Button variant="primary" size="sm" onClick={onAddEntry}>
          <Plus size={13} /> Add entry
        </Button>
      </div>
    </div>
  );
}
