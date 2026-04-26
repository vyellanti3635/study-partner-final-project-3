import styles from './Pagination.module.scss';

type Props = {
  page: number;
  total: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
};

export function Pagination({ page, total, limit, onPrev, onNext }: Props) {
  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div className={styles.container}>
      <span className={styles.showing}>
        {total === 0
          ? 'No tasks'
          : `Showing ${startItem}–${endItem} of ${total} task${total !== 1 ? 's' : ''}`}
      </span>
      <div className={styles.buttons}>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onPrev}
          disabled={isFirst}
        >
          Prev
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={onNext}
          disabled={isLast}
        >
          Next
        </button>
      </div>
    </div>
  );
}
