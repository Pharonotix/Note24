import { useEffect, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import type { LocationsRegistry } from '@shared/types'
import { useStore } from '../../store/store'
import { ADVANCED_TOKENS, PRESETS, contrastOn, lighten, readToken, rgbToHex } from '../../lib/theme'
import { DEMO_API_KEY } from '../../lib/desmos'
import { FONT_OPTIONS } from '../../lib/editorPrefs'
import { ACTION_LABELS, comboFromEvent, DEFAULT_SHORTCUTS, type ShortcutAction } from '../../lib/shortcuts'
import styles from './Settings.module.css'

function formatCombo(combo: string): string {
  if (!combo) return '—'
  return combo
    .split('+')
    .map((p) => (p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1)))
    .join('+')
}

export function Settings(): React.JSX.Element | null {
  const open = useStore((s) => s.settingsOpen)
  const setOpen = useStore((s) => s.setSettingsOpen)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const editorPrefs = useStore((s) => s.editorPrefs)
  const setEditorPrefs = useStore((s) => s.setEditorPrefs)
  const shortcuts = useStore((s) => s.shortcuts)
  const setShortcut = useStore((s) => s.setShortcut)
  const resetShortcuts = useStore((s) => s.resetShortcuts)
  const [apiKey, setApiKey] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [registry, setRegistry] = useState<LocationsRegistry | null>(null)
  const [renamingLocId, setRenamingLocId] = useState<string | null>(null)
  const [switching, setSwitching] = useState(false)
  const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(null)
  const [backing, setBacking] = useState(false)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)

  useEffect(() => {
    if (open) {
      window.api.settings.get('desmosApiKey').then((k) => setApiKey(k || ''))
      window.api.locations.list().then(setRegistry)
    }
  }, [open])

  if (!open) return null

  const setPreset = (id: string): void => setTheme({ preset: id, overrides: {} })
  const setOverride = (key: string, value: string): void =>
    setTheme({ ...theme, overrides: { ...theme.overrides, [key]: value } })
  const setPrimary = (hex: string): void =>
    setTheme({
      ...theme,
      overrides: {
        ...theme.overrides,
        primary: hex,
        'primary-hover': lighten(hex),
        'primary-contrast': contrastOn(hex)
      }
    })
  const setSecondary = (hex: string): void =>
    setTheme({
      ...theme,
      overrides: {
        ...theme.overrides,
        secondary: hex,
        'secondary-hover': lighten(hex),
        'secondary-contrast': contrastOn(hex)
      }
    })
  const resetColors = (): void => setTheme({ preset: theme.preset, overrides: {} })
  const saveKey = (v: string): void => {
    setApiKey(v)
    window.api.settings.set('desmosApiKey', v)
  }
  const tokenValue = (key: string): string => theme.overrides[key] ?? readToken(key)

  const refreshLocations = async (): Promise<void> => setRegistry(await window.api.locations.list())

  const addDataFolder = async (): Promise<void> => {
    const path = await window.api.locations.pickFolder()
    if (!path) return
    await window.api.locations.add(path)
    await refreshLocations()
  }

  const renameLocation = async (id: string, label: string): Promise<void> => {
    await window.api.locations.rename(id, label)
    await refreshLocations()
    setRenamingLocId(null)
  }

  const switchLocation = async (id: string): Promise<void> => {
    setSwitching(true)
    await window.api.locations.switch(id) // relaunches the app; this call does not return
  }

  const removeLocation = async (id: string, label: string): Promise<void> => {
    if (!window.confirm(`Remove "${label}" from the list? Its files are not deleted.`)) return
    await window.api.locations.remove(id)
    await refreshLocations()
  }

  const runBackup = async (): Promise<void> => {
    setBacking(true)
    setBackupMsg(null)
    try {
      const res = await window.api.vault.backup()
      setBackupMsg(res.canceled ? null : `Backed up to ${res.path}`)
    } finally {
      setBacking(false)
    }
  }

  const runRestore = async (): Promise<void> => {
    setConfirmRestore(false)
    const res = await window.api.vault.restore()
    // On success this never resolves (the app relaunches); only a cancel reaches here.
    if (res.canceled) setBackupMsg(null)
  }

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.title}>Settings</span>
          <button className={styles.close} onClick={() => setOpen(false)} title="Close">
            <X size={15} />
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.h3}>Theme presets</h3>
            <div className={styles.presets}>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  className={theme.preset === p.id ? `${styles.preset} ${styles.presetOn}` : styles.preset}
                  onClick={() => setPreset(p.id)}
                >
                  <span className={styles.swatch} style={{ background: p.bg }}>
                    <span className={styles.dot} style={{ background: p.accent }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.h3}>Colors</h3>
            <div className={styles.colorRow}>
              <label className={styles.colorLabel}>
                <input
                  type="color"
                  value={rgbToHex(tokenValue('primary'))}
                  onChange={(e) => setPrimary(e.target.value)}
                />
                Primary
              </label>
              <label className={styles.colorLabel}>
                <input
                  type="color"
                  value={rgbToHex(tokenValue('secondary'))}
                  onChange={(e) => setSecondary(e.target.value)}
                />
                Secondary
              </label>
              <button className={styles.reset} onClick={resetColors}>
                Reset colors
              </button>
            </div>

            <button className={styles.advToggle} onClick={() => setAdvanced((v) => !v)}>
              {advanced ? '▾' : '▸'} Advanced — edit exact RGB values
            </button>
            {advanced && (
              <div className={styles.advGrid}>
                {ADVANCED_TOKENS.map((t) => (
                  <div key={t.key} className={styles.advRow}>
                    <input
                      type="color"
                      value={rgbToHex(tokenValue(t.key))}
                      onChange={(e) => setOverride(t.key, e.target.value)}
                    />
                    <span className={styles.advLabel}>{t.label}</span>
                    <input
                      className={styles.advText}
                      value={tokenValue(t.key)}
                      spellCheck={false}
                      onChange={(e) => setOverride(t.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={styles.section}>
            <h3 className={styles.h3}>Editor typography</h3>
            <div className={styles.colorRow}>
              <select
                className={styles.keyInput}
                value={editorPrefs.fontFamily}
                onChange={(e) => setEditorPrefs({ ...editorPrefs, fontFamily: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.fontSizeRow}>
              <input
                type="range"
                min={80}
                max={200}
                step={5}
                value={editorPrefs.fontSize}
                onChange={(e) => setEditorPrefs({ ...editorPrefs, fontSize: Number(e.target.value) })}
              />
              <span className={styles.fontSizeValue}>{editorPrefs.fontSize}%</span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.h3}>Desmos graphing</h3>
            <p className={styles.hint}>
              Your personal Desmos API key. Leave blank to use the public demo key. Loading graphs
              requires an internet connection.
            </p>
            <input
              className={styles.keyInput}
              placeholder={`demo: ${DEMO_API_KEY}`}
              value={apiKey}
              spellCheck={false}
              onChange={(e) => saveKey(e.target.value)}
            />
          </section>

          <section className={styles.section}>
            <h3 className={styles.h3}>Storage</h3>
            <p className={styles.hint}>
              Where your notes, equations, and attachments live. Switching restarts Note24.
            </p>
            <div className={styles.locList}>
              {registry?.locations.map((loc) => {
                const isActive = loc.id === registry.activeId
                return (
                  <div key={loc.id} className={isActive ? `${styles.locRow} ${styles.locActive}` : styles.locRow}>
                    <div className={styles.locInfo}>
                      {renamingLocId === loc.id ? (
                        <input
                          className={styles.locRenameInput}
                          autoFocus
                          defaultValue={loc.label}
                          onBlur={(e) => renameLocation(loc.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                            if (e.key === 'Escape') setRenamingLocId(null)
                          }}
                        />
                      ) : (
                        <span
                          className={styles.locLabel}
                          onDoubleClick={() => setRenamingLocId(loc.id)}
                          title="Double-click to rename"
                        >
                          {loc.label}
                          {isActive && <span className={styles.locBadge}>Active</span>}
                        </span>
                      )}
                      <span className={styles.locPath}>{loc.path}</span>
                    </div>
                    {!isActive && (
                      <div className={styles.locActions}>
                        <button className={styles.locBtn} onClick={() => switchLocation(loc.id)}>
                          Switch
                        </button>
                        <button
                          className={styles.locBtn}
                          onClick={() => removeLocation(loc.id, loc.label)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button className={styles.reset} onClick={addDataFolder}>
              + Add data folder…
            </button>
          </section>

          <section className={styles.section}>
            <h3 className={styles.h3}>Backup &amp; restore</h3>
            <p className={styles.hint}>
              A backup is a single file containing every note, equation, citation, and
              attachment reference in this vault. Restoring replaces the current vault and
              restarts Note24.
            </p>
            <div className={styles.backupRow}>
              <button className={styles.backupBtn} onClick={runBackup} disabled={backing}>
                {backing ? 'Backing up…' : 'Back up vault…'}
              </button>
              {confirmRestore ? (
                <>
                  <button className={styles.dangerBtn} onClick={runRestore}>
                    Confirm restore &amp; restart
                  </button>
                  <button className={styles.backupBtn} onClick={() => setConfirmRestore(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className={styles.backupBtn} onClick={() => setConfirmRestore(true)}>
                  Restore from backup…
                </button>
              )}
            </div>
            {backupMsg && <p className={styles.hint}>{backupMsg}</p>}
          </section>

          <section className={styles.section}>
            <div className={styles.shortcutsHead}>
              <h3 className={styles.h3}>Keyboard shortcuts</h3>
              <button className={styles.reset} onClick={resetShortcuts}>
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <div className={styles.shortcutList}>
              {(Object.keys(ACTION_LABELS) as ShortcutAction[]).map((action) => (
                <div key={action} className={styles.shortcutRow}>
                  <span className={styles.shortcutLabel}>{ACTION_LABELS[action]}</span>
                  <button
                    className={
                      recordingAction === action ? `${styles.shortcutKey} ${styles.shortcutKeyRecording}` : styles.shortcutKey
                    }
                    onClick={() => setRecordingAction(action)}
                    onBlur={() => setRecordingAction((a) => (a === action ? null : a))}
                    onKeyDown={(e) => {
                      if (recordingAction !== action) return
                      e.preventDefault()
                      if (e.key === 'Escape') {
                        setRecordingAction(null)
                        return
                      }
                      const combo = comboFromEvent(e)
                      if (combo) {
                        setShortcut(action, combo)
                        setRecordingAction(null)
                      }
                    }}
                  >
                    {recordingAction === action ? 'Press keys…' : formatCombo(shortcuts[action] || DEFAULT_SHORTCUTS[action])}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {switching && (
        <div className={styles.switchingOverlay}>
          <span>Restarting Note24…</span>
        </div>
      )}
    </div>
  )
}
