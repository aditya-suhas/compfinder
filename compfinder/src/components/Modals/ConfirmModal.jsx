import { ModalBase } from './ModalBase.jsx';
import { Button } from '../ui/Button.jsx';
import { Trash2 } from 'lucide-react';
import styles from './ConfirmModal.module.css';

export function ConfirmModal({ entryName, onConfirm, onClose }) {
  return (
    <ModalBase title="Delete entry" onClose={onClose} width={400}>
      <div className={styles.content}>
        <div className={styles.iconWrap}>
          <Trash2 size={20} />
        </div>
        <p className={styles.message}>
          Delete <strong>&ldquo;{entryName}&rdquo;</strong>?
          <br />
          <span className={styles.hint}>This cannot be undone.</span>
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>
            Delete
          </Button>
        </div>
      </div>
    </ModalBase>
  );
}
