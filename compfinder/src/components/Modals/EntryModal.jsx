import { useState, useEffect } from 'react';
import { ModalBase } from './ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { TYPES, STATUSES } from '../../lib/utils.js';
import styles from './EntryModal.module.css';

const PRIS = ['High', 'Medium', 'Low'];

const EMPTY = {
  name: '', type: '', category: '', pipeline: '',
  deadline: '', deadlineLabel: '', eligibility: '',
  url: '', notionUrl: '', notes: '', status: 'Contemplating', priority: 'Medium',
};

export function EntryModal({ entry, categories, onSave, onClose }) {
  const isEdit = !!entry;
  const [form, setForm] = useState(
    isEdit
      ? {
          name: entry.name || '', type: entry.type || '',
          category: entry.category || '', pipeline: entry.pipeline || '',
          deadline: entry.deadline || '', deadlineLabel: entry.deadlineLabel || '',
          eligibility: entry.eligibility || '', url: entry.url || '',
          notionUrl: entry.notionUrl || '',
          notes: entry.notes || '', status: entry.status || 'Contemplating',
          priority: entry.priority || 'Medium',
        }
      : { ...EMPTY }
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())     errs.name     = 'Name is required';
    if (!form.type)            errs.type     = 'Type is required';
    if (!form.category)        errs.category = 'Category is required';
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      name: form.name.trim(),
      pipeline: form.pipeline.trim(),
      deadline: form.deadline || null,
      deadlineLabel: form.deadlineLabel.trim(),
      eligibility: form.eligibility.trim(),
      url: form.url.trim(),
      notionUrl: form.notionUrl.trim(),
      notes: form.notes.trim(),
    });
    onClose();
  };

  return (
    <ModalBase title={isEdit ? 'Edit Entry' : 'Add Entry'} onClose={onClose} width={580}>
      <div className={styles.form}>
        <div className={styles.row}>
          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.label}>Name *</label>
            <input
              className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. John Locke Essay Competition"
              autoFocus
            />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Type *</label>
            <select
              className={`${styles.select} ${errors.type ? styles.inputError : ''}`}
              value={form.type}
              onChange={e => set('type', e.target.value)}
            >
              <option value="">Select type...</option>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {errors.type && <span className={styles.error}>{errors.type}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Category *</label>
            <select
              className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              <option value="">Select category...</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <span className={styles.error}>{errors.category}</span>}
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <select className={styles.select} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Deadline date</label>
            <input
              type="date"
              className={styles.input}
              value={form.deadline}
              onChange={e => set('deadline', e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Deadline label</label>
            <input
              className={styles.input}
              value={form.deadlineLabel}
              onChange={e => set('deadlineLabel', e.target.value)}
              placeholder="e.g. Registration: Mar 31"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.label}>Pipeline</label>
            <input
              className={styles.input}
              value={form.pipeline}
              onChange={e => set('pipeline', e.target.value)}
              placeholder="e.g. IOQM → RMO → INMO → IMO"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.label}>Eligibility</label>
            <input
              className={styles.input}
              value={form.eligibility}
              onChange={e => set('eligibility', e.target.value)}
              placeholder="e.g. Grade 9–12, India"
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.label}>URL</label>
            <input
              type="url"
              className={styles.input}
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.label}>Notion page</label>
            <input
              type="url"
              className={styles.input}
              value={form.notionUrl}
              onChange={e => set('notionUrl', e.target.value)}
              placeholder="Paste embed link from Notion's Share menu"
            />
            <span className={styles.hint}>In Notion: Share → Copy embed link</span>
          </div>
        </div>

        <div className={styles.row}>
          <div className={`${styles.field} ${styles.wide}`}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Key details, tips, deadlines..."
              rows={3}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>
            {isEdit ? 'Save changes' : 'Add entry'}
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
