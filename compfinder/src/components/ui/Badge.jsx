import styles from './Badge.module.css';

export function TypeBadge({ type }) {
  return (
    <span className={`${styles.badge} ${styles[`type_${type?.replace('/', '_')}`] || styles.type_Other}`}>
      {type || 'Other'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const key = status?.replace(/\s/g, '_') || 'Contemplating';
  return (
    <span className={`${styles.badge} ${styles[`status_${key}`] || ''}`}>
      {status}
    </span>
  );
}

export function PriBadge({ priority }) {
  return (
    <span className={`${styles.priBadge} ${styles[`pri_${priority}`] || styles.pri_Medium}`} title={priority}>
      <span className={styles.priDot} />
      {priority}
    </span>
  );
}

export function CatBadge({ category }) {
  return <span className={styles.catBadge}>{category}</span>;
}
