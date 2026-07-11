import { useEffect, useRef } from 'react'
import { FOLDER_ICONS } from './folderIcons'
import styles from './FolderStylePicker.module.css'

// Soft-toned presets matching the app's default palette family.
const COLORS = [
  '#7fb08a', // sage
  '#6fbf8b', // forest
  '#7fb0c8', // slate blue
  '#c8a37f', // warm tan
  '#c88a9a', // soft rose
  '#9d8fc8', // muted violet
  '#9aa4ad' // neutral grey
]

export function FolderStylePicker({
  color,
  icon,
  onChange,
  onClose
}: {
  color: string | null
  icon: string | null
  onChange: (style: { color?: string | null; icon?: string | null }) => void
  onClose: () => void
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  // Icons render in the current folder color so the preview matches the sidebar.
  const iconColor = color ?? 'var(--text-muted)'

  return (
    <div className={styles.popover} ref={ref} onMouseDown={(e) => e.stopPropagation()}>
      <div className={styles.label}>Color</div>
      <div className={styles.row}>
        <button
          className={!color ? `${styles.swatch} ${styles.none} ${styles.sel}` : `${styles.swatch} ${styles.none}`}
          title="No color"
          onClick={() => onChange({ color: null })}
        />
        {COLORS.map((c) => (
          <button
            key={c}
            className={color === c ? `${styles.swatch} ${styles.sel}` : styles.swatch}
            style={{ background: c }}
            onClick={() => onChange({ color: c })}
          />
        ))}
      </div>
      <div className={styles.label}>Icon</div>
      <div className={styles.row}>
        {FOLDER_ICONS.map(({ name, Icon }) => (
          <button
            key={name}
            className={icon === name ? `${styles.iconOpt} ${styles.sel}` : styles.iconOpt}
            title={name}
            onClick={() => onChange({ icon: name })}
          >
            <Icon size={16} color={iconColor} strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  )
}
