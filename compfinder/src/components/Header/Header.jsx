import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Search, Download, Upload, Sparkles, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { Button } from '../ui/Button.jsx';
import styles from './Header.module.css';

function MagneticButton({ children, onClick, className, title, variant = 'secondary', size = 'sm' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 20, stiffness: 300 });
  const springY = useSpring(y, { damping: 20, stiffness: 300 });

  const handleMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    x.set((e.clientX - cx) * 0.25);
    y.set((e.clientY - cy) * 0.25);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <Button variant={variant} size={size} onClick={onClick} title={title} className={className}>
        {children}
      </Button>
    </motion.div>
  );
}

function SyncIndicator({ status }) {
  if (!status || status === 'disabled') return null;
  const map = {
    syncing: { icon: <Loader2 size={11} className={styles.spinIcon} />, label: 'Syncing…', cls: styles.syncSyncing },
    synced:  { icon: <Cloud size={11} />,    label: 'Synced',   cls: styles.syncSynced },
    error:   { icon: <CloudOff size={11} />, label: 'Offline',  cls: styles.syncError },
  };
  const info = map[status];
  if (!info) return null;
  return (
    <motion.div
      className={`${styles.syncBadge} ${info.cls}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {info.icon}
      <span>{info.label}</span>
    </motion.div>
  );
}

export function Header({
  searchText, onSearch, theme, onThemeToggle,
  onExport, onImport, onAIImport, onSync,
  syncStatus, syncCode,
}) {
  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.logoWrap}>
        <motion.div
          className={styles.logo}
          whileHover={{ letterSpacing: '0.04em' }}
          transition={{ duration: 0.3 }}
        >
          <span className={styles.logoComp}>Comp</span>
          <span className={styles.logoFinder}>Finder</span>
        </motion.div>
        {syncCode && (
          <span className={styles.syncCode} title="Your sync code — enter on another device">
            {syncCode}
          </span>
        )}
      </div>

      <div className={styles.searchWrap}>
        <Search size={14} className={styles.searchIcon} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search… (Cmd+K)"
          value={searchText}
          onChange={e => onSearch(e.target.value)}
        />
        {searchText && (
          <motion.button
            className={styles.searchClear}
            onClick={() => onSearch('')}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
          >
            &times;
          </motion.button>
        )}
      </div>

      <div className={styles.actions}>
        <SyncIndicator status={syncStatus} />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />

        {onSync && (
          <MagneticButton onClick={onSync} title={syncCode ? `Sync code: ${syncCode}` : 'Enable sync'} variant="ghost" size="sm">
            <RefreshCw size={13} /> Sync
          </MagneticButton>
        )}

        <MagneticButton onClick={onExport} title="Export data as JSON" variant="ghost" size="sm">
          <Download size={13} /> Export
        </MagneticButton>

        <MagneticButton onClick={onImport} title="Import JSON data" variant="secondary" size="sm">
          <Upload size={13} /> Import
        </MagneticButton>

        <MagneticButton onClick={onAIImport} title="AI-assisted import" variant="primary" size="sm">
          <Sparkles size={13} /> AI Import
        </MagneticButton>
      </div>
    </motion.header>
  );
}
