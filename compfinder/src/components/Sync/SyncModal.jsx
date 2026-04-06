import { useState } from 'react';
import { motion } from 'framer-motion';
import { ModalBase } from '../Modals/ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import styles from './SyncModal.module.css';

export function SyncModal({ code, status, onSetPassphrase, onDisconnect, onClose }) {
  const [input, setInput]   = useState('');
  const [error, setError]   = useState('');
  const [editing, setEditing] = useState(!code);

  const handleConnect = async () => {
    const trimmed = input.trim();
    if (trimmed.length < 2) { setError('Enter at least 2 characters'); return; }
    setError('');
    await onSetPassphrase(trimmed);
    onClose();
  };

  // ── Connected state ──
  if (code && !editing) {
    return (
      <ModalBase title="Sync" onClose={onClose} width={400}>
        <div className={styles.content}>
          <div className={styles.connectedCard}>
            <motion.div
              className={`${styles.statusRow} ${status === 'synced' ? styles.statusSynced : status === 'error' ? styles.statusError : styles.statusSyncing}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {status === 'syncing' ? <Loader2 size={14} className={styles.spin} /> :
               status === 'synced'  ? <Cloud size={14} /> :
               <CloudOff size={14} />}
              <span>{status === 'syncing' ? 'Syncing…' : status === 'synced' ? 'Synced' : 'Offline'}</span>
            </motion.div>

            <div className={styles.passphraseBlock}>
              <span className={styles.passphraseLabel}>Passphrase</span>
              <span className={styles.passphrase}>{code}</span>
            </div>

            <p className={styles.hint}>
              Any device using this passphrase stays in sync automatically.
            </p>
          </div>

          <div className={styles.btnRow}>
            <Button variant="secondary" size="sm" onClick={() => { setEditing(true); setInput(''); }}>
              Change passphrase
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { onDisconnect(); onClose(); }}>
              Stop syncing
            </Button>
          </div>
        </div>
      </ModalBase>
    );
  }

  // ── Setup / edit state ──
  return (
    <ModalBase title="Sync across devices" onClose={onClose} width={420}>
      <div className={styles.content}>
        <p className={styles.desc}>
          Pick any word or phrase you'll remember — like <em>family</em> or <em>ourlist</em>.
          Enter the <strong>same passphrase</strong> on every device to keep your data in sync.
        </p>

        <div className={styles.inputRow}>
          <input
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="e.g. family, ourlist, mymom…"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleConnect(); }}
          />
          <Button variant="primary" size="sm" onClick={handleConnect}>
            Start syncing
          </Button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {code && (
          <button className={styles.cancelLink} onClick={() => setEditing(false)}>
            Cancel
          </button>
        )}

        <p className={styles.fine}>No account needed. Works instantly on any browser or device.</p>
      </div>
    </ModalBase>
  );
}
