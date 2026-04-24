import { useState, useEffect, useCallback } from 'react';
import {
  loadEntries, loadCategories, loadFilters, loadFocusCollapsed,
  persistEntries, persistCategories, saveFilters, saveFocusCollapsed,
  tryRestoreFromIDB,
} from '../lib/store.js';
import { cyclePastDeadlines, deduplicateEntries, uid, STATUSES, TYPES, STATUS_MIGRATE, getFiltered } from '../lib/utils.js';

export function useStore() {
  const [entries, setEntries]       = useState(() => {
    const raw = loadEntries();
    const { entries: cycled, changed: cycleChanged } = cyclePastDeadlines(raw);
    const { entries: deduped, removed } = deduplicateEntries(cycled);
    if (cycleChanged || removed.length) {
      const cats = loadCategories();
      persistEntries(deduped, cats);
    }
    return deduped;
  });

  const [categories, setCategories] = useState(() => loadCategories());

  const savedFilters = loadFilters();
  const [activeType, setActiveType]   = useState(savedFilters?.type || '__all__');
  const [activeCats, setActiveCats]   = useState(savedFilters?.cats || new Set(['__all__']));
  const [searchText, setSearchText]   = useState('');
  const [sortKey, setSortKey]         = useState('smart');
  const [sortDir, setSortDir]         = useState(1);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [focusPanelCollapsed, setFocusPanelCollapsed] = useState(() => loadFocusCollapsed());
  const [restoredFromIDB, setRestoredFromIDB] = useState(false);

  // IDB restore on mount
  useEffect(() => {
    tryRestoreFromIDB().then(result => {
      if (result) {
        setEntries(result.entries);
        setCategories(result.categories);
        setRestoredFromIDB(true);
      }
    });
  }, []);

  // Persist entries whenever they change
  const saveEntries = useCallback((next) => {
    persistEntries(next, categories);
    setEntries(next);
  }, [categories]);

  const saveCategories = useCallback((next) => {
    persistCategories(next);
    setCategories(next);
  }, []);

  // Filter helpers
  const setType = useCallback((type) => {
    setActiveType(type);
    setActiveCats(new Set(['__all__']));
    saveFilters(type, new Set(['__all__']));
  }, []);

  const toggleCat = useCallback((cat) => {
    setActiveCats(prev => {
      let next;
      if (cat === '__all__') {
        next = new Set(['__all__']);
      } else {
        next = new Set(prev);
        next.delete('__all__');
        if (next.has(cat)) {
          next.delete(cat);
          if (!next.size) next = new Set(['__all__']);
        } else {
          next.add(cat);
        }
      }
      saveFilters(activeType, next);
      return next;
    });
  }, [activeType]);

  // Sort
  const setSort = useCallback((key) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortDir(d => d * -1);
        return prev;
      }
      setSortDir(1);
      return key;
    });
  }, []);

  // Expand
  const toggleExpand = useCallback((id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Focus panel
  const toggleFocusPanel = useCallback(() => {
    setFocusPanelCollapsed(prev => {
      saveFocusCollapsed(!prev);
      return !prev;
    });
  }, []);

  // Entry CRUD
  const addEntry = useCallback((data) => {
    const entry = { id: uid(), checklist: [], ...data };
    const next = [...entries, entry];
    saveEntries(next);
    return entry;
  }, [entries, saveEntries]);

  const updateEntry = useCallback((id, data) => {
    const next = entries.map(e => e.id === id ? { ...e, ...data } : e);
    saveEntries(next);
  }, [entries, saveEntries]);

  const deleteEntry = useCallback((id) => {
    const next = entries.filter(e => e.id !== id);
    setExpandedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    saveEntries(next);
  }, [entries, saveEntries]);

  const updateStatus = useCallback((id, status) => {
    updateEntry(id, { status });
  }, [updateEntry]);

  // Checklist
  const addCheckItem = useCallback((entryId, text) => {
    if (!text) return;
    const next = entries.map(e => {
      if (e.id !== entryId) return e;
      return { ...e, checklist: [...(e.checklist || []), { id: uid(), text, done: false }] };
    });
    saveEntries(next);
  }, [entries, saveEntries]);

  const toggleCheckItem = useCallback((entryId, itemId) => {
    const next = entries.map(e => {
      if (e.id !== entryId) return e;
      return {
        ...e,
        checklist: (e.checklist || []).map(c =>
          c.id === itemId ? { ...c, done: !c.done } : c
        ),
      };
    });
    saveEntries(next);
  }, [entries, saveEntries]);

  const deleteCheckItem = useCallback((entryId, itemId) => {
    const next = entries.map(e => {
      if (e.id !== entryId) return e;
      return { ...e, checklist: (e.checklist || []).filter(c => c.id !== itemId) };
    });
    saveEntries(next);
  }, [entries, saveEntries]);

  // Import/Export
  const exportData = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = { entries, categories };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compfinder-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, categories]);

  const commitImport = useCallback((parsed, mode) => {
    let nextEntries;
    let skipped = 0;
    if (mode === 'replace') {
      const { entries: deduped } = deduplicateEntries(parsed.entries);
      nextEntries = deduped;
    } else {
      const existingIds   = new Set(entries.map(e => e.id));
      const existingNames = new Set(entries.map(e => (e.name || '').toLowerCase().trim()));
      const toAdd = parsed.entries.filter(e =>
        !existingIds.has(e.id) && !existingNames.has((e.name || '').toLowerCase().trim())
      );
      skipped = parsed.entries.length - toAdd.length;
      const { entries: deduped } = deduplicateEntries([...entries, ...toAdd]);
      nextEntries = deduped;
    }
    let nextCats = [...categories];
    if (parsed.categories) {
      const lc = new Set(categories.map(c => c.toLowerCase()));
      parsed.categories.forEach(c => {
        if (!lc.has(c.toLowerCase())) nextCats.push(c);
      });
    }
    saveEntries(nextEntries);
    saveCategories(nextCats);
    setExpandedIds(new Set());
    return { skipped };
  }, [entries, categories, saveEntries, saveCategories]);

  // Filtered + sorted view
  const filteredEntries = getFiltered(entries, { activeType, activeCats, searchText, sortKey, sortDir });

  return {
    entries,
    categories,
    activeType,
    activeCats,
    searchText,
    sortKey,
    sortDir,
    expandedIds,
    focusPanelCollapsed,
    restoredFromIDB,
    filteredEntries,
    // actions
    setType,
    toggleCat,
    setSearchText,
    setSort,
    toggleExpand,
    toggleFocusPanel,
    addEntry,
    updateEntry,
    deleteEntry,
    updateStatus,
    addCheckItem,
    toggleCheckItem,
    deleteCheckItem,
    exportData,
    commitImport,
    saveEntries,
    saveCategories,
    setRestoredFromIDB,
  };
}
