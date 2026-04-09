import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useTheme } from './hooks/useTheme.js';
import { useStore } from './hooks/useStore.js';
import { useSync } from './hooks/useSync.js';
import { uid } from './lib/utils.js';

import { Header }        from './components/Header/Header.jsx';
import { StatCards }     from './components/Dashboard/StatCards.jsx';
import { Timeline }      from './components/Dashboard/Timeline.jsx';
import { FilterBar }     from './components/Table/FilterBar.jsx';
import { EntryTable }    from './components/Table/EntryTable.jsx';
import { FocusPanel }    from './components/FocusPanel/FocusPanel.jsx';
import { UrgencyBanner } from './components/UrgencyBanner.jsx';
import { ToastContainer } from './components/ui/Toast.jsx';
import { Cursor }        from './components/ui/Cursor.jsx';

import { EntryModal }   from './components/Modals/EntryModal.jsx';
import { ConfirmModal } from './components/Modals/ConfirmModal.jsx';
import { ImportModal }  from './components/Modals/ImportModal.jsx';
import { AIModal }      from './components/Modals/AIModal.jsx';
import { CatModal }     from './components/Modals/CatModal.jsx';
import { SyncModal }    from './components/Sync/SyncModal.jsx';

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const store = useStore();

  const {
    entries, categories, activeType, activeCats,
    searchText, sortKey, sortDir, expandedIds,
    focusPanelCollapsed, restoredFromIDB, filteredEntries,
    setType, toggleCat, setSearchText, setSort, toggleExpand,
    toggleFocusPanel, addEntry, updateEntry, deleteEntry, updateStatus,
    addCheckItem, toggleCheckItem, deleteCheckItem, exportData, commitImport,
    saveCategories, setRestoredFromIDB,
  } = store;

  // Modal state
  const [modal, setModal] = useState(null); // null | { type, id? }

  // Toast state
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'success') => {
    const id = uid();
    setToasts(t => [...t, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // Sync
  const onRemoteUpdate = useCallback((remoteEntries, remoteCats) => {
    commitImport({ entries: remoteEntries, categories: remoteCats }, 'replace');
  }, [commitImport]);

  const { code: syncCode, status: syncStatus, setPassphrase, disconnect, syncEnabled: isSyncEnabled } = useSync({
    entries,
    categories,
    onRemoteUpdate,
  });

  // Banner dismissed state
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Timeline dot click → highlight + scroll
  const [highlightId, setHighlightId] = useState(null);
  const handleDotClick = useCallback((id) => {
    setHighlightId(id);
    // Expand the row
    if (!expandedIds.has(id)) toggleExpand(id);
    // Scroll to it
    setTimeout(() => {
      const el = document.querySelector(`[data-id="${id}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    setTimeout(() => setHighlightId(null), 1400);
  }, [expandedIds, toggleExpand]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // IDB restore toast
  useEffect(() => {
    if (restoredFromIDB) {
      addToast(`Data restored from backup — ${entries.length} entries recovered`, 'success');
      setRestoredFromIDB(false);
    }
  }, [restoredFromIDB]);

  // Modal helpers
  const openAdd    = () => setModal({ type: 'add' });
  const openEdit   = (id) => setModal({ type: 'edit', id });
  const openDelete = (id) => setModal({ type: 'delete', id });
  const openImport = () => setModal({ type: 'import' });
  const openAI     = () => setModal({ type: 'ai' });
  const openCats   = () => setModal({ type: 'cats' });
  const openSync   = () => setModal({ type: 'sync' });
  const closeModal = () => setModal(null);

  const editEntry = entries.find(e => e.id === modal?.id);

  return (
    <div className="app-container">
      <Header
        searchText={searchText}
        onSearch={setSearchText}
        theme={theme}
        onThemeToggle={toggleTheme}
        onExport={() => { exportData(); addToast('Data exported'); }}
        onImport={openImport}
        onAIImport={openAI}
        onSync={openSync}
        syncStatus={syncStatus}
        syncCode={syncCode}
        isSyncEnabled={isSyncEnabled}
      />

      <UrgencyBanner
        entries={entries}
        dismissed={bannerDismissed}
        onDismiss={() => setBannerDismissed(true)}
      />

      <StatCards entries={entries} />

      <Timeline entries={entries} onDotClick={handleDotClick} />

      <FocusPanel
        entries={entries}
        collapsed={focusPanelCollapsed}
        onToggle={toggleFocusPanel}
        onToggleCheck={toggleCheckItem}
      />

      <FilterBar
        entries={entries}
        categories={categories}
        activeType={activeType}
        activeCats={activeCats}
        onTypeChange={setType}
        onCatToggle={toggleCat}
        onManageCats={openCats}
      />

      <EntryTable
        entries={entries}
        filteredEntries={filteredEntries}
        expandedIds={expandedIds}
        sortKey={sortKey}
        sortDir={sortDir}
        highlightId={highlightId}
        onSort={setSort}
        onToggleExpand={toggleExpand}
        onEdit={openEdit}
        onDelete={openDelete}
        onStatusChange={(id, status) => { updateStatus(id, status); }}
        onToggleCheck={toggleCheckItem}
        onDeleteCheck={deleteCheckItem}
        onAddCheck={addCheckItem}
        onAddEntry={openAdd}
      />

      {/* ── MODALS ── */}
      {modal?.type === 'add' && (
        <EntryModal
          categories={categories}
          onSave={(data) => { addEntry(data); addToast('Entry added'); }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'edit' && editEntry && (
        <EntryModal
          entry={editEntry}
          categories={categories}
          onSave={(data) => { updateEntry(modal.id, data); addToast('Entry updated'); }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'delete' && (
        <ConfirmModal
          entryName={entries.find(e => e.id === modal.id)?.name || ''}
          onConfirm={() => { deleteEntry(modal.id); addToast('Entry deleted'); }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'import' && (
        <ImportModal
          onImport={(parsed, mode) => {
            commitImport(parsed, mode);
            addToast(`Imported ${parsed.entries.length} entries`);
          }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'ai' && (
        <AIModal
          categories={categories}
          onImport={(parsed, mode) => {
            commitImport(parsed, mode);
            addToast(`Imported ${parsed.entries.length} entries via AI`);
          }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'cats' && (
        <CatModal
          categories={categories}
          entries={entries}
          onSave={(cats) => { saveCategories(cats); addToast('Categories updated'); }}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'sync' && (
        <SyncModal
          code={syncCode}
          status={syncStatus}
          onSetPassphrase={setPassphrase}
          onDisconnect={disconnect}
          onClose={closeModal}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      <Cursor />
      <SpeedInsights />
    </div>
  );
}
