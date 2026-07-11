import styles from './ConfirmDialog.module.css'

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

/** A small themed confirmation modal — replaces native window.confirm() for destructive actions. */
export function ConfirmDialog({
  request,
  onConfirm,
  onCancel
}: {
  request: ConfirmRequest | null
  onConfirm: () => void
  onCancel: () => void
}): React.JSX.Element | null {
  if (!request) return null

  return (
    <div className={styles.overlay} onMouseDown={onCancel}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.title}>{request.title}</div>
        <p className={styles.message}>{request.message}</p>
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>
            Cancel
          </button>
          <button
            className={request.danger === false ? styles.confirm : `${styles.confirm} ${styles.danger}`}
            onClick={onConfirm}
            autoFocus
          >
            {request.confirmLabel ?? 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
