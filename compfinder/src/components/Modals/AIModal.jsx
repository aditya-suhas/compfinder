import { useState } from 'react';
import { ModalBase } from './ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { Sparkles, Copy, Check, Globe } from 'lucide-react';
import { uid, TYPES, STATUSES, STATUS_MIGRATE } from '../../lib/utils.js';
import styles from './AIModal.module.css';

function buildFormatPrompt(list, categories) {
  const catList = categories.join(', ');
  const today   = new Date().toISOString().slice(0, 10);
  const yr      = new Date().getFullYear();
  const listSection = list
    ? `\n\nHere is my list:\n${list}\n`
    : '\n\n[USER WILL ADD THEIR LIST HERE]\n';
  return `You are helping me build a competition tracker. Research each competition or program I list and return a JSON array in the exact format below.

TODAY'S DATE: ${today}

OUTPUT FORMAT — return ONLY a JSON code block, no other text:
\`\`\`json
[
  {
    "name": "Full official name",
    "pipeline": "Stage1 → Stage2 → Stage3  (empty string if not multi-stage)",
    "type": "Competition | Program | Fellowship | Other",
    "category": "one of: ${catList}  (pick best match or use Other)",
    "deadline": "YYYY-MM-DD  (next upcoming or null if unknown)",
    "deadlineLabel": "Human-readable e.g. 'Registration: Sep 15' or '~Mar–Apr'",
    "eligibility": "e.g. 'Ages 13–18, global' or 'Grade 9–12, India'",
    "notes": "2–3 sentence summary",
    "status": "Contemplating",
    "priority": "High | Medium | Low"
  }
]
\`\`\`

RULES:
- Search for current/upcoming deadlines (${yr} or ${yr + 1})
- Multi-stage: list FIRST stage deadline; full pipeline in "pipeline"
- Use null for deadline only if truly unknown; use deadlineLabel for approximations
- priority: High = prestigious/significant; Medium = solid; Low = niche
- Return ONLY the JSON code block${listSection}Research each item above and return the JSON array.`;
}

function buildDiscoveryPrompt({ grade, country, subjects, extra, categories }) {
  const catList = categories.join(', ');
  const today   = new Date().toISOString().slice(0, 10);
  const subjectLine = subjects.length ? subjects.join(', ') : 'all subjects';
  const extraLine = extra ? `\nAdditional context: ${extra}` : '';
  return `You are helping me discover competitions, programs, fellowships, and research opportunities.

MY PROFILE:
- Grade / Year: ${grade}
- Country: ${country || 'unspecified'}
- Subjects / Interests: ${subjectLine}${extraLine}

TODAY'S DATE: ${today}

YOUR TASK: Go deep. Cover prestigious flagships, research programs, fellowships, lesser-known gems, and both highly competitive and accessible options. Include both global and country-specific ones.

OUTPUT FORMAT — ONLY a JSON code block:
\`\`\`json
[
  {
    "name": "Full official name",
    "pipeline": "Stage1 → Stage2 → Stage3  (empty string if not multi-stage)",
    "type": "Competition | Program | Fellowship | Other",
    "category": "one of: ${catList}",
    "deadline": "YYYY-MM-DD or null",
    "deadlineLabel": "Human-readable note",
    "eligibility": "Specific age, grade, country restrictions",
    "notes": "2–3 sentences: what it is, why it matters",
    "status": "Contemplating",
    "priority": "High | Medium | Low"
  }
]
\`\`\`

Aim for 15–25 entries. Do NOT include text outside the JSON block.`;
}

function parseJSON(raw) {
  let data;
  try { data = JSON.parse(raw); } catch(e) { return { error: 'Invalid JSON — ' + e.message }; }
  const rawEntries = Array.isArray(data) ? data : data.entries;
  if (!Array.isArray(rawEntries) || !rawEntries.length) return { error: 'No entries array found.' };
  const valid = rawEntries.filter(e => e && e.name).map(e => ({
    id: e.id || uid(),
    name: String(e.name).trim(),
    pipeline: e.pipeline || '',
    type: TYPES.includes(e.type) ? e.type : 'Competition',
    category: e.category || 'Other',
    deadline: e.deadline || null,
    deadlineLabel: e.deadlineLabel || '',
    eligibility: e.eligibility || '',
    notes: e.notes || '',
    status: STATUS_MIGRATE[e.status] || (STATUSES.includes(e.status) ? e.status : 'Contemplating'),
    priority: ['High','Medium','Low'].includes(e.priority) ? e.priority : 'Medium',
    checklist: [],
    url: e.url || '',
  }));
  if (!valid.length) return { error: 'No valid entries with a "name" field.' };
  return { entries: valid, categories: null, warnings: [], skipped: rawEntries.length - valid.length };
}

export function AIModal({ categories, onImport, onClose }) {
  const [tab, setTab] = useState('format');
  const [list, setList] = useState('');
  const [paste, setPaste] = useState('');
  const [mode, setMode] = useState('merge');
  const [copied, setCopied] = useState(false);
  const [discoverCopied, setDiscoverCopied] = useState(false);
  const [grade, setGrade] = useState('Grade 11');
  const [country, setCountry] = useState('India');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [extra, setExtra] = useState('');
  const [importStatus, setImportStatus] = useState(null);

  const copyText = async (text, setCopiedFn) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  const toggleSubject = (cat) => {
    setSelectedSubjects(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleAIImport = () => {
    const raw = paste.trim();
    if (!raw) { setImportStatus({ level: 'error', msg: 'Paste the AI output above first.' }); return; }
    const result = parseJSON(raw);
    if (result.error) { setImportStatus({ level: 'error', msg: result.error }); return; }
    onImport(result, mode);
    setImportStatus({ level: 'ok', msg: `Imported ${result.entries.length} entries` });
    setTimeout(onClose, 900);
  };

  return (
    <ModalBase title="AI Import" onClose={onClose} width={620}>
      <div className={styles.content}>
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'format' ? styles.tabActive : ''}`} onClick={() => setTab('format')}>
            <Sparkles size={12} /> Format known list
          </button>
          <button className={`${styles.tab} ${tab === 'discover' ? styles.tabActive : ''}`} onClick={() => setTab('discover')}>
            <Globe size={12} /> Discover new
          </button>
        </div>

        {tab === 'format' && (
          <div className={styles.section}>
            <p className={styles.desc}>
              List competitions you already know. The AI will research and format them into your tracker.
            </p>
            <label className={styles.fieldLabel}>Your list (one per line, or separated by commas)</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={list}
              onChange={e => setList(e.target.value)}
              placeholder={"John Locke Essay Competition\nBreakthrough Junior Challenge\nRegeneron ISEF"}
            />
            <Button
              variant="secondary"
              onClick={() => copyText(buildFormatPrompt(list, categories), setCopied)}
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy prompt</>}
            </Button>
          </div>
        )}

        {tab === 'discover' && (
          <div className={styles.section}>
            <p className={styles.desc}>
              Tell the AI about yourself. It will discover relevant competitions you may not know.
            </p>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Grade / Year</label>
                <input className={styles.input} value={grade} onChange={e => setGrade(e.target.value)} placeholder="Grade 11" />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Country</label>
                <input className={styles.input} value={country} onChange={e => setCountry(e.target.value)} placeholder="India" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Subjects / Interests</label>
              <div className={styles.subjectGrid}>
                {categories.map(cat => (
                  <label key={cat} className={`${styles.subjectChip} ${selectedSubjects.includes(cat) ? styles.chipActive : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedSubjects.includes(cat)}
                      onChange={() => toggleSubject(cat)}
                      style={{ display: 'none' }}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Extra context (optional)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={extra}
                onChange={e => setExtra(e.target.value)}
                placeholder="e.g. Interested in AI research and policy, preparing for JEE"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => copyText(buildDiscoveryPrompt({ grade, country, subjects: selectedSubjects, extra, categories }), setDiscoverCopied)}
            >
              {discoverCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy discovery prompt</>}
            </Button>
          </div>
        )}

        <div className={styles.divider}>
          <span>Paste AI output below to import</span>
        </div>

        <textarea
          className={styles.textarea}
          rows={5}
          value={paste}
          onChange={e => { setPaste(e.target.value); setImportStatus(null); }}
          placeholder={'Paste the JSON the AI returned here...\n[{ "name": "...", ... }]'}
          spellCheck={false}
        />

        {importStatus && (
          <div className={`${styles.status} ${styles[importStatus.level]}`}>
            {importStatus.msg}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.modeRow}>
            {['merge', 'replace'].map(m => (
              <label key={m} className={styles.modeOption}>
                <input type="radio" name="ai-mode" value={m} checked={mode === m} onChange={() => setMode(m)} />
                <span>{m === 'merge' ? 'Merge' : 'Replace all'}</span>
              </label>
            ))}
          </div>
          <div className={styles.footActions}>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleAIImport} disabled={!paste.trim()}>
              Import JSON
            </Button>
          </div>
        </div>
      </div>
    </ModalBase>
  );
}
