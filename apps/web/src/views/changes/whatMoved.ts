import type { ChangeItem } from '../../demo/types'

export type MovedRow = { label: string; effect: string | null }

// shortcut: keyword match on sample effect text, replace with #86's typed diff.
export function whatMovedRows(changes: ChangeItem[]): MovedRow[] {
  const effectWith = (keyword: string) =>
    changes.find((item) => item.effect.toLowerCase().includes(keyword))?.effect ?? null

  return [
    { label: 'Target Levels', effect: null },
    { label: 'Role Ranking', effect: effectWith('match') },
    { label: 'Roadmap Order', effect: effectWith('roadmap') }
  ]
}
