import { useState, useRef } from 'react';
import { ModalBase } from './ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { uid, TYPES, STATUSES, STATUS_MIGRATE } from '../../lib/utils.js';
import styles from './ImportModal.module.css';

function parseJSON(raw) {
  let data;
  try { data = JSON.parse(raw); } catch(e) { return { error: 'Invalid JSON — ' + e.message }; }
  const rawEntries = Array.isArray(data) ? data : data.entries;
  const rawCats = !Array.isArray(data) && Array.isArray(data.categories) ? data.categories : null;
  if (!Array.isArray(rawEntries)) return { error: 'No entries array found. Expected { "entries": [...] } or a bare array.' };
  if (rawEntries.length === 0) return { error: 'The entries array is empty.' };

  const valid = [], warnings = [];
  rawEntries.forEach((e, i) => {
    if (typeof e !== 'object' || e === null) { warnings.push(`Entry #${i+1}: not an object — skipped`); return; }
    if (!e.name || typeof e.name !== 'string' || !e.name.trim()) { warnings.push(`Entry #${i+1}: missing "name" — skipped`); return; }
    const fixed = {
      id: e.id || uid(),
      name: e.name.trim(),
      pipeline: typeof e.pipeline === 'string' ? e.pipeline : '',
      type: TYPES.includes(e.type) ? e.type : 'Competition',
      category: e.category || 'Other',
      deadline: e.deadline || null,
      deadlineLabel: e.deadlineLabel || e.deadline_label || '',
      eligibility: e.eligibility || '',
      notes: e.notes || '',
      status: STATUS_MIGRATE[e.status] || (STATUSES.includes(e.status) ? e.status : 'Contemplating'),
      priority: ['High','Medium','Low'].includes(e.priority) ? e.priority : 'Medium',
      checklist: Array.isArray(e.checklist) ? e.checklist.map(c => ({ id: c.id || uid(), text: String(c.text || ''), done: !!c.done })) : [],
      url: e.url || '',
    };
    if (fixed.deadline && !/^\d{4}-\d{2}-\d{2}$/.test(fixed.deadline)) {
      warnings.push(`"${fixed.name}": deadline format invalid — cleared`);
      fixed.deadline = null;
    }
    valid.push(fixed);
  });

  if (!valid.length) return { error: 'No valid entries found. Each entry needs at least a "name".' };
  return { entries: valid, categories: rawCats, warnings, skipped: rawEntries.length - valid.length };
}

export function ImportModal({ onImport, onClose }) {
  const [tab, setTab] = useState('file');
  const [mode, setMode] = useState('merge');
  const [paste, setPaste] = useState('');
  const [parsed, setParsed] = useState(null);
  const [validationState, setValidationState] = useState(null); // { level, msg }
  const [fileName, setFileName] = useState('');
  const fileRef = useRef(null);

  const processRaw = (raw) => {
    const result = parseJSON(raw);
    if (result.error) {
      setValidationState({ level: 'error', msg: result.error });
      setParsed(null);
    } else {
      setParsed(result);
      const lines = [`${result.entries.length} valid ${result.entries.length === 1 ? 'entry' : 'entries'} ready`];
      if (result.skipped) lines.push(`${result.skipped} skipped (missing name)`);
      if (result.warnings.length) lines.push(`${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`);
      setValidationState({ level: result.warnings.length ? 'warn' : 'ok', msg: lines.join(' · ') });
    }
  };

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => processRaw(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePaste = (val) => {
    setPaste(val);
    if (!val.trim()) { setValidationState(null); setParsed(null); return; }
    processRaw(val.trim());
  };

  const handleConfirm = () => {
    if (!parsed) return;
    onImport(parsed, mode);
    onClose();
  };

  return (
    <ModalBase title="Import data" onClose={onClose} width={540}>
      <div className={styles.content}>
        <div className={styles.tabs}>
          {['file', 'paste'].map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => { setTab(t); setParsed(null); setValidationState(null); setPaste(''); setFileName(''); }}
            >
              {t === 'file' ? <Upload size={12} /> : <FileText size={12} />}
              {t === 'file' ? 'Choose file' : 'Paste JSON'}
            </button>
          ))}
        </div>

        {tab === 'file' && (
          <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".json" className={styles.fileInput} onChange={handleFile} />
            <Upload size={20} className={styles.dropIcon} />
            {fileName
              ? <span className={styles.fileName}>{fileName}</span>
              : <>
                  <span className={styles.dropLabel}>Click to choose a .json file</span>
                  <span className={styles.dropHint}>or drag and drop</span>
                </>
            }
          </div>
        )}

        {tab === 'paste' && (
          <textarea
            className={styles.pasteArea}
            value={paste}
            onChange={e => handlePaste(e.target.value)}
            placeholder='Paste JSON here — [ { "name": "..." }, ... ] or { "entries": [...] }'
            rows={8}
            spellCheck={false}
          />
        )}

        {validationState && (
          <div className={`${styles.validation} ${styles[validationState.level]}`}>
            {validationState.level === 'ok'    && <CheckCircle size={13} />}
            {validationState.level === 'warn'  && <AlertTriangle size={13} />}
            {validationState.level === 'error' && <XCircle size={13} />}
            {validationState.msg}
          </div>
        )}

        <div className={styles.modeRow}>
          <span className={styles.modeLabel}>Import mode:</span>
          {['merge', 'replace'].map(m => (
            <label key={m} className={styles.modeOption}>
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
              <span>{m === 'merge' ? 'Merge (add new)' : 'Replace all'}</span>
            </label>
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!parsed} onClick={handleConfirm}>
            Import
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
