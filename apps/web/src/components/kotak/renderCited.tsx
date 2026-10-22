import { Fragment, type ReactNode } from 'react'
import { Citation } from '../ui/Citation'

// Turns each [n] marker into a Citation that links to #source-n.
export function renderCited(text: string): ReactNode {
  return text.split(/(\[\d+\])/).map((part, index) => {
    const marker = /^\[(\d+)\]$/.exec(part)
    return marker ? <Citation key={index} n={Number(marker[1])} /> : <Fragment key={index}>{part}</Fragment>
  })
}
