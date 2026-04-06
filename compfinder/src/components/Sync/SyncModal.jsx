import { useState } from 'react';
import { motion } from 'framer-motion';
import { ModalBase } from '../Modals/ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { Copy, Check, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import styles from './SyncModal.module.css';

export function SyncModal({ code, status, onSwitchCode, onRegenerate, onClose }) {
  const [newCode, setNewCode]   = useState('');
  const [copied, setCopied]     = useState(false);
  const [codeError, setCodeError] = useState('');

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(code); }
    catch { const ta = document.createElement('textarea'); ta.value = code; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitch = async () => {
    const trimmed = newCode.trim().toUpperCase();
    if (trimmed.length < 4) { setCodeError('Code must be at least 4 characters'); return; }
    setCodeError('');
    await onSwitchCode(trimmed);
    onClose();
  };

  return (
    <ModalBase title="Sync across devices" onClose={onClose} width={480}>
      <div className={styles.content}>
        {/* Your code */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Your sync code</p>
          <p className={styles.desc}>
            Enter this code on another device to sync your data in real time.
          </p>
          <div className={styles.codeDisplay}>
            <span className={styles.code}>{code}</span>
            <motion.button
              className={styles.copyBtn}
              onClick={copyCode}
              whileTap={{ scale: 0.9 }}
              title="Copy code"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </motion.button>
          </div>
          <button
            className={styles.regenLink}
            onClick={onRegenerate}
            title="Generate a fresh sync code (disconnects other devices)"
          >
            <RefreshCw size={11} /> Generate new code
          </button>
        </div>

        <div className={styles.divider}>
          <span>or join a different device</span>
        </div>

        {/* Enter code */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Enter another device's code</p>
          <div className={styles.inputRow}>
            <input
              className={`${styles.input} ${codeError ? styles.inputError : ''}`}
              value={newCode}
              onChange={e => { setNewCode(e.target.value.toUpperCase()); setCodeError(''); }}
              placeholder="e.g. XK7MN2QP"
              maxLength={12}
              onKeyDown={e => { if (e.key === 'Enter') handleSwitch(); }}
            />
            <Button variant="primary" size="sm" onClick={handleSwitch}>
              Connect
            </Button>
          </div>
          {codeError && <p className={styles.error}>{codeError}</p>}
        </div>

        {/* How it works */}
        <div className={styles.howItWorks}>
          <div className={styles.device}>
            <Monitor size={14} />
            <span>This device</span>
          </div>
          <div className={styles.arrow}>⟷</div>
          <div className={styles.device}>
            <Smartphone size={14} />
            <span>Other device</span>
          </div>
        </div>
        <p className={styles.fine}>
          Changes sync automatically. Last-write wins. No account needed.
        </p>
      </div>
    </ModalBase>
  );
}
