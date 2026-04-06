import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import styles from './ModalBase.module.css';

export function ModalBase({ title, onClose, children, width = 520 }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      className={styles.backdrop}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className={styles.modal}
        style={{ maxWidth: width }}
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: 'spring', damping: 24, stiffness: 350, mass: 0.8 }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <motion.button
            className={styles.closeBtn}
            onClick={onClose}
            title="Close"
            aria-label="Close modal"
            whileHover={{ rotate: 90, scale: 1.1 }}
            whileTap={{ scale: 0.85 }}
            transition={{ duration: 0.2 }}
          >
            <X size={16} />
          </motion.button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
