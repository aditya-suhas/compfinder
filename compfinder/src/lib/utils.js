export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function daysUntil(deadline) {
  if (!deadline) return null;
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const target = new Date(deadline); target.setHours(0, 0, 0, 0);
  return Math.ceil((target - now) / 86400000);
}

/** Returns 'red' | 'amber' | 'green' | 'none' */
export function urgencyLevel(deadline) {
  const n = daysUntil(deadline);
  if (n === null) return 'none';
  if (n <= 14) return 'red';
  if (n <= 60) return 'amber';
  return 'green';
}

/** Days label for display */
export function daysLabel(deadline) {
  const n = daysUntil(deadline);
  if (n === null) return '';
  if (n < 0) return `${Math.abs(n)}d ago`;
  if (n === 0) return 'Today';
  if (n === 1) return '1 day';
  return `${n}d`;
}

/** Formatted deadline string */
export function fmtDeadline(entry) {
  if (entry.deadlineLabel) return entry.deadlineLabel;
  if (entry.deadline) {
    return new Date(entry.deadline).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }
  return 'No fixed date';
}

/**
 * Drain percentage (0–100) representing time remaining.
 * 0 = deadline passed/very close. 100 = very far away.
 * Capped at 365 days for the full bar.
 */
export function drainPct(deadline) {
  const n = daysUntil(deadline);
  if (n === null) return null;
  if (n <= 0) return 0;
  return Math.min(100, (n / 365) * 100);
}

export const STATUSES = ['Contemplating', 'Committed', 'Doing', 'Done', 'Skipped'];
export const TYPES    = ['Competition', 'Program', 'Fellowship', 'Other'];
export const PRI      = { High: 0, Medium: 1, Low: 2 };

export const STATUS_MIGRATE = {
  Aware: 'Contemplating',
  Planning: 'Contemplating',
  Registered: 'Committed',
  Applied: 'Doing',
};

/** Cycle any past deadlines forward by full years, reset status */
export function cyclePastDeadlines(entries) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let changed = false;
  const cycled = entries.map(e => {
    if (!e.deadline) return e;
    const d = new Date(e.deadline); d.setHours(0, 0, 0, 0);
    if (d >= today) return e;
    const updated = { ...e, lastCycled: e.deadline };
    while (d < today) d.setFullYear(d.getFullYear() + 1);
    updated.deadline = d.toISOString().slice(0, 10);
    updated.status   = 'Contemplating';
    changed = true;
    return updated;
  });
  return { entries: cycled, changed };
}

/** Filter + sort entries */
export function getFiltered(entries, { activeType, activeCats, searchText, sortKey, sortDir }) {
  let r = entries;
  if (activeType !== '__all__') r = r.filter(e => e.type === activeType);
  if (!activeCats.has('__all__')) r = r.filter(e => activeCats.has(e.category));
  if (searchText) {
    const q = searchText.toLowerCase();
    r = r.filter(e =>
      (e.name       || '').toLowerCase().includes(q) ||
      (e.pipeline   || '').toLowerCase().includes(q) ||
      (e.category   || '').toLowerCase().includes(q) ||
      (e.type       || '').toLowerCase().includes(q) ||
      (e.notes      || '').toLowerCase().includes(q) ||
      (e.eligibility|| '').toLowerCase().includes(q)
    );
  }
  return [...r].sort((a, b) => {
    if (sortKey === 'deadline') {
      const av = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bv = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      if (av === bv) return (PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1);
      return (av - bv) * sortDir;
    }
    if (sortKey === 'priority') return ((PRI[a.priority] ?? 1) - (PRI[b.priority] ?? 1)) * sortDir;
    if (sortKey === 'name') return a.name.localeCompare(b.name) * sortDir;
    return 0;
  });
}
