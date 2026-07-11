import {
  Folder,
  BookOpen,
  GraduationCap,
  FlaskConical,
  Atom,
  Ruler,
  Calculator,
  Sigma,
  Dna,
  Globe,
  Microscope,
  Lightbulb,
  Zap,
  Star,
  Heart,
  Rocket,
  type LucideIcon
} from 'lucide-react'

/** Curated folder-icon set (name string ↔ Lucide component). The name string is
 * what's stored in folders.icon; icons render with `currentColor`, so folder.color
 * recolors the icon itself. */
export const FOLDER_ICONS: { name: string; Icon: LucideIcon }[] = [
  { name: 'Folder', Icon: Folder },
  { name: 'BookOpen', Icon: BookOpen },
  { name: 'GraduationCap', Icon: GraduationCap },
  { name: 'FlaskConical', Icon: FlaskConical },
  { name: 'Atom', Icon: Atom },
  { name: 'Ruler', Icon: Ruler },
  { name: 'Calculator', Icon: Calculator },
  { name: 'Sigma', Icon: Sigma },
  { name: 'Dna', Icon: Dna },
  { name: 'Globe', Icon: Globe },
  { name: 'Microscope', Icon: Microscope },
  { name: 'Lightbulb', Icon: Lightbulb },
  { name: 'Zap', Icon: Zap },
  { name: 'Star', Icon: Star },
  { name: 'Heart', Icon: Heart },
  { name: 'Rocket', Icon: Rocket }
]

const ICON_MAP = new Map(FOLDER_ICONS.map((i) => [i.name, i.Icon]))

/** Resolves a stored icon name to its component. Unknown/stale values (e.g. an
 * old emoji character from before Lucide icons) fall back to the default Folder. */
export function getFolderIcon(name: string | null): LucideIcon {
  return (name && ICON_MAP.get(name)) || Folder
}
