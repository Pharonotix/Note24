import type { Tag } from '@shared/types'
import { getDb } from './database'

export function listTags(): Tag[] {
  return getDb().prepare(`SELECT id, name FROM tags ORDER BY name`).all() as Tag[]
}
