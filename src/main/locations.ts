import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join, basename } from 'path'
import { randomUUID } from 'crypto'
import type { DataLocation, LocationsRegistry } from '@shared/types'

/**
 * This pointer file always lives at Electron's fixed default userData path —
 * it only ever stores *where* your real data is, never the data itself, so it
 * can safely stay put while the actual note24.db/attachments/ move anywhere.
 */
function registryPath(): string {
  return join(app.getPath('userData'), 'locations.json')
}

function bootstrap(): LocationsRegistry {
  const defaultPath = app.getPath('userData')
  const registry: LocationsRegistry = {
    locations: [{ id: 'default', label: 'Default', path: defaultPath }],
    activeId: 'default'
  }
  writeRegistry(registry)
  return registry
}

function readRegistry(): LocationsRegistry {
  const file = registryPath()
  if (!existsSync(file)) return bootstrap()
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as LocationsRegistry
    if (!parsed.locations?.length || !parsed.activeId) return bootstrap()
    return parsed
  } catch {
    return bootstrap()
  }
}

function writeRegistry(registry: LocationsRegistry): void {
  writeFileSync(registryPath(), JSON.stringify(registry, null, 2))
}

/** Called once at startup, before initDatabase() — returns the active data folder. */
export function resolveActiveLocation(): string {
  const registry = readRegistry()
  const active = registry.locations.find((l) => l.id === registry.activeId) ?? registry.locations[0]
  mkdirSync(active.path, { recursive: true })
  return active.path
}

export function listLocations(): LocationsRegistry {
  return readRegistry()
}

export function addLocation(path: string, label?: string): DataLocation {
  const registry = readRegistry()
  const existing = registry.locations.find((l) => l.path === path)
  if (existing) return existing
  mkdirSync(path, { recursive: true })
  const loc: DataLocation = { id: randomUUID(), label: label?.trim() || basename(path) || path, path }
  registry.locations.push(loc)
  writeRegistry(registry)
  return loc
}

export function renameLocation(id: string, label: string): void {
  const registry = readRegistry()
  const loc = registry.locations.find((l) => l.id === id)
  if (!loc) throw new Error('Location not found')
  loc.label = label.trim() || loc.label
  writeRegistry(registry)
}

/** Switches the active location pointer. Does not itself restart the app. */
export function switchActiveLocation(id: string): void {
  const registry = readRegistry()
  if (!registry.locations.some((l) => l.id === id)) throw new Error('Location not found')
  registry.activeId = id
  writeRegistry(registry)
}

/** Forgets a location from the list — never deletes files on disk. */
export function removeLocation(id: string): void {
  const registry = readRegistry()
  if (registry.activeId === id) throw new Error('Cannot remove the active location')
  registry.locations = registry.locations.filter((l) => l.id !== id)
  writeRegistry(registry)
}
