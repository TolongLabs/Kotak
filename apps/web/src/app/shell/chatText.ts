// Claude's replies in Ask Kopi use light Markdown: bold, inline code, headings and lists. Showing it raw put
// "**Technical documentation**" on screen. This parses that subset into blocks and spans that the panel renders as
// React elements, so nothing in a reply is ever inserted as HTML.

export type ChatSpan = { kind: 'text' | 'strong' | 'em' | 'code'; text: string }
export type ChatBlock =
  | { kind: 'paragraph'; lines: ChatSpan[][] }
  | { kind: 'heading'; spans: ChatSpan[] }
  | { kind: 'list'; ordered: boolean; start: number; items: ChatSpan[][] }

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/
const HEADING = /^\s*#{1,6}\s+(.*?)\s*#*\s*$/
// Bold first, so "**x**" isn't read as two italics, and bold may hold a lone asterisk ("**O*NET 30.1**"). Italics take
// asterisks only, since tool names use underscores, and never one inside a word, so "O*NET" stays as written.
const INLINE =
  /(\*\*(?:[^*\n]|\*(?!\*))+?\*\*|__[^_\n]+?__|`[^`\n]+`|(?<![\w*])\*(?![\s*])[^*\n]*?[^*\s]\*(?![\w*])|(?<![\w*])\*[^*\s]\*(?![\w*]))/g

/** One line's bold, italic and code spans; unmatched markers stay as plain text. */
export function parseInline(line: string): ChatSpan[] {
  const spans: ChatSpan[] = []
  let last = 0
  for (const match of line.matchAll(INLINE)) {
    const token = match[0]
    if (match.index > last) spans.push({ kind: 'text', text: line.slice(last, match.index) })
    if (token.startsWith('**') || token.startsWith('__')) spans.push({ kind: 'strong', text: token.slice(2, -2) })
    else if (token.startsWith('`')) spans.push({ kind: 'code', text: token.slice(1, -1) })
    else spans.push({ kind: 'em', text: token.slice(1, -1) })
    last = match.index + token.length
  }
  if (last < line.length) spans.push({ kind: 'text', text: line.slice(last) })
  return spans
}

/** The reply as plain sentences for the screen-reader announcement: no markers, one block after another. */
export function plainChatText(text: string): string {
  const line = (spans: ChatSpan[]) => spans.map((span) => span.text).join('')
  return parseChatText(text)
    .map((block) =>
      block.kind === 'heading'
        ? line(block.spans)
        : block.kind === 'list'
          ? block.items.map(line).join('; ')
          : block.lines.map(line).join(' ')
    )
    .join(' ')
}

/** Splits a reply into paragraphs, headings and lists; consecutive list lines form one list. */
export function parseChatText(text: string): ChatBlock[] {
  const blocks: ChatBlock[] = []
  let paragraph: ChatSpan[][] = []
  let list: { ordered: boolean; start: number; items: ChatSpan[][] } | null = null
  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', lines: paragraph })
    if (list) blocks.push({ kind: 'list', ...list })
    paragraph = []
    list = null
  }
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!raw.trim()) {
      flush()
      continue
    }
    const heading = raw.match(HEADING)
    const bullet = raw.match(BULLET)
    const numbered = bullet ? null : raw.match(NUMBERED)
    if (heading) {
      flush()
      blocks.push({ kind: 'heading', spans: parseInline(heading[1]!) })
    } else if (bullet || numbered) {
      const ordered = !!numbered
      if (paragraph.length || (list && list.ordered !== ordered)) flush()
      // A numbered list split by blank lines or sub-bullets keeps its numbers: each part starts where it left off.
      list ??= { ordered, start: numbered ? Number(numbered[1]) : 1, items: [] }
      list.items.push(parseInline(bullet ? bullet[1]! : numbered![2]!))
    } else {
      if (list) flush()
      paragraph.push(parseInline(raw.trim()))
    }
  }
  flush()
  return blocks
}
