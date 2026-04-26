import { useEffect } from 'react';
import styles from './Toast.module.scss';

export type ToastType = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type Props = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

const AUTO_DISMISS_MS = 4000;

export function Toast({ toast, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[toast.type]}`} role="alert" aria-live="assertive">
      <span className={styles.message}>{toast.message}</span>
      <button
        type="button"
        className={styles.close}
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        x
      </button>
    </div>
  );
}
