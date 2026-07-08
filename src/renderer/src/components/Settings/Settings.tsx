import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { ADVANCED_TOKENS, PRESETS, contrastOn, lighten, readToken, rgbToHex } from '../../lib/theme'
import { DEMO_API_KEY } from '../../lib/desmos'
import styles from './Settings.module.css'

export function Settings(): React.JSX.Element | null {
  const open = useStore((s) => s.settingsOpen)
  const setOpen = useStore((s) => s.setSettingsOpen)
  const theme = useStore((s) => s.theme)
  const setTheme = useStore((s) => s.setTheme)
  const [apiKey, setApiKey] = useState('')
  const [advanced, setAdvanced] = useState(false)

  useEffect(() => {
    if (open) window.api.settings.get('desmosApiKey').then((k) => setApiKey(k || ''))
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

  return (
    <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
      <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <span className={styles.title}>Settings</span>
          <button className={styles.close} onClick={() => setOpen(false)} title="Close">
            ✕
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
        </div>
      </div>
    </div>
  )
}
