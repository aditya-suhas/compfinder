import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

/**
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size: 'sm' | 'md' (default)
 */
export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  title,
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
      {...rest}
    >
      {loading ? (
        <Loader2 size={14} className={styles.spinner} />
      ) : children}
    </button>
  );
}
