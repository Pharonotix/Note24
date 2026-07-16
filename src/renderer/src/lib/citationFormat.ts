import type { Citation, CitationStyle } from '@shared/types'

interface ParsedName {
  last: string
  first: string
}

/** Authors are stored as "Last, First; Last, First". Parses to structured names. */
function parseAuthors(authors: string): ParsedName[] {
  return authors
    .split(';')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => {
      const [last, first] = a.split(',').map((p) => p.trim())
      return { last: last || a, first: first || '' }
    })
}

function initials(first: string): string {
  return first
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0].toUpperCase() + '.')
    .join(' ')
}

function joinWithAnd(items: string[], word: string): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${word} ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, ${word} ${items[items.length - 1]}`
}

// ---- Per-style author-list formatting ----

function apaAuthors(names: ParsedName[]): string {
  const parts = names.map((n) => (n.first ? `${n.last}, ${initials(n.first)}` : n.last))
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts.slice(0, -1).join(', ')}, & ${parts[parts.length - 1]}`
}

function mlaAuthors(names: ParsedName[]): string {
  if (names.length === 0) return ''
  const first = names[0].first ? `${names[0].last}, ${names[0].first}` : names[0].last
  if (names.length === 1) return first
  if (names.length >= 3) return `${first}, et al.`
  const second = names[1].first ? `${names[1].first} ${names[1].last}` : names[1].last
  return `${first}, and ${second}`
}

function chicagoAuthors(names: ParsedName[]): string {
  if (names.length === 0) return ''
  const first = names[0].first ? `${names[0].last}, ${names[0].first}` : names[0].last
  const rest = names.slice(1).map((n) => (n.first ? `${n.first} ${n.last}` : n.last))
  return joinWithAnd([first, ...rest], 'and')
}

function ieeeAuthors(names: ParsedName[]): string {
  const parts = names.map((n) => (n.first ? `${initials(n.first)} ${n.last}` : n.last))
  return joinWithAnd(parts, 'and')
}

/** Formats a citation as a single reference-list entry in the given style. */
export function formatCitation(c: Citation, style: CitationStyle): string {
  const names = parseAuthors(c.authors)
  const title = c.title.trim() || 'Untitled'
  const year = c.year.trim() || 'n.d.'

  switch (style) {
    case 'apa': {
      const author = apaAuthors(names)
      const lead = author ? `${author} (${year}).` : `(${year}).`
      switch (c.type) {
        case 'book':
          return [lead, `${title}.`, c.publisher && `${c.publisher}.`].filter(Boolean).join(' ')
        case 'paper':
          return [lead, `${title}.`, c.publisher && `${c.publisher}.`].filter(Boolean).join(' ')
        case 'website':
          return [lead, `${title}.`, c.publisher && `${c.publisher}.`, c.url].filter(Boolean).join(' ')
        case 'video':
          return [lead, `${title} [Video].`, c.publisher && `${c.publisher}.`, c.url]
            .filter(Boolean)
            .join(' ')
        case 'doi':
          return [lead, `${title}.`, c.doi && `https://doi.org/${c.doi}`].filter(Boolean).join(' ')
      }
      break
    }
    case 'mla': {
      const author = mlaAuthors(names)
      const lead = author ? `${author}.` : ''
      switch (c.type) {
        case 'book':
          return [lead, `${title}.`, [c.publisher, year].filter(Boolean).join(', ') + '.']
            .filter(Boolean)
            .join(' ')
        case 'paper':
        case 'website':
        case 'video':
          return [lead, `"${title}."`, [c.publisher, year, c.url].filter(Boolean).join(', ') + '.']
            .filter(Boolean)
            .join(' ')
        case 'doi':
          return [lead, `"${title}."`, [year, c.doi && `doi:${c.doi}`].filter(Boolean).join(', ') + '.']
            .filter(Boolean)
            .join(' ')
      }
      break
    }
    case 'chicago': {
      const author = chicagoAuthors(names)
      const lead = author ? `${author}. ${year}.` : `${year}.`
      switch (c.type) {
        case 'book':
          return [lead, `${title}.`, c.publisher && `${c.publisher}.`].filter(Boolean).join(' ')
        case 'paper':
        case 'website':
        case 'video':
          return [lead, `"${title}."`, c.publisher && `${c.publisher}.`, c.url].filter(Boolean).join(' ')
        case 'doi':
          return [lead, `"${title}."`, c.doi && `https://doi.org/${c.doi}.`].filter(Boolean).join(' ')
      }
      break
    }
    case 'ieee': {
      const author = ieeeAuthors(names)
      const lead = author ? `${author},` : ''
      switch (c.type) {
        case 'book':
          return [lead, `${title}.`, [c.publisher, year].filter(Boolean).join(', ') + '.']
            .filter(Boolean)
            .join(' ')
        case 'paper':
          return [lead, `"${title},"`, [c.publisher, year].filter(Boolean).join(', ') + '.']
            .filter(Boolean)
            .join(' ')
        case 'website':
        case 'video':
          return [
            lead,
            `"${title},"`,
            c.publisher && `${c.publisher},`,
            year + '.',
            c.url && `[Online]. Available: ${c.url}`
          ]
            .filter(Boolean)
            .join(' ')
        case 'doi':
          return [lead, `"${title},"`, year + '.', c.doi && `doi: ${c.doi}.`].filter(Boolean).join(' ')
      }
      break
    }
  }
  return title
}

/** Short in-text/inline marker for a citation, e.g. "(Smith, 2020)" — style-agnostic. */
export function formatInline(c: Citation): string {
  const names = parseAuthors(c.authors)
  const lastName = names[0]?.last || c.publisher || c.title || 'Untitled'
  const suffix = names.length > 1 ? ' et al.' : ''
  const year = c.year.trim()
  return year ? `(${lastName}${suffix}, ${year})` : `(${lastName}${suffix})`
}

export const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'apa', label: 'APA' },
  { value: 'mla', label: 'MLA' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'ieee', label: 'IEEE' }
]

export const CITATION_TYPES: { value: Citation['type']; label: string }[] = [
  { value: 'book', label: 'Book' },
  { value: 'paper', label: 'Paper' },
  { value: 'website', label: 'Website' },
  { value: 'video', label: 'Video' },
  { value: 'doi', label: 'DOI source' }
]
