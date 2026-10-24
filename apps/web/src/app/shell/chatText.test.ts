import { expect, test } from 'bun:test'
import { parseChatText, parseInline, plainChatText } from './chatText'

test('bold, italic and code become spans, and the markers go', () => {
  expect(parseInline('Close **Technical documentation** next, with `run_checkup` and *care*.')).toEqual([
    { kind: 'text', text: 'Close ' },
    { kind: 'strong', text: 'Technical documentation' },
    { kind: 'text', text: ' next, with ' },
    { kind: 'code', text: 'run_checkup' },
    { kind: 'text', text: ' and ' },
    { kind: 'em', text: 'care' },
    { kind: 'text', text: '.' }
  ])
})

test('underscores in tool names and lone asterisks stay as text', () => {
  expect(parseInline('national_skill_gaps reads 5 * 3 rows')).toEqual([
    { kind: 'text', text: 'national_skill_gaps reads 5 * 3 rows' }
  ])
})

test('paragraphs, headings and lists split into blocks', () => {
  const blocks = parseChatText(
    '## Your Gaps\n\nTwo skills are rising:\n- **Testing**, needed at 3\n- Accessibility\n\n1. Practise\n2. Review\nThat is all.'
  )
  expect(blocks.map((block) => block.kind)).toEqual(['heading', 'paragraph', 'list', 'list', 'paragraph'])
  expect(blocks[2]).toEqual({
    kind: 'list',
    ordered: false,
    start: 1,
    items: [
      [
        { kind: 'strong', text: 'Testing' },
        { kind: 'text', text: ', needed at 3' }
      ],
      [{ kind: 'text', text: 'Accessibility' }]
    ]
  })
  expect(blocks[3]).toMatchObject({ kind: 'list', ordered: true })
})

test('an asterisk inside a word stays, and bold may hold one', () => {
  expect(parseInline('O*NET 30.1 and O*NET 30.3')).toEqual([{ kind: 'text', text: 'O*NET 30.1 and O*NET 30.3' }])
  expect(parseInline('From **O*NET 30.1**, *dated*.')).toEqual([
    { kind: 'text', text: 'From ' },
    { kind: 'strong', text: 'O*NET 30.1' },
    { kind: 'text', text: ', ' },
    { kind: 'em', text: 'dated' },
    { kind: 'text', text: '.' }
  ])
  expect(plainChatText('**O*NET** says')).toBe('O*NET says')
})

test('a numbered list split by blank lines or sub-bullets keeps its numbers', () => {
  const blocks = parseChatText('1. Practise\n\n2. Review\n   - with a colleague\n3. Re-check')
  expect(
    blocks.map((block) => (block.kind === 'list' ? `${block.ordered ? 'ol' : 'ul'}${block.start}` : block.kind))
  ).toEqual(['ol1', 'ol2', 'ul1', 'ol3'])
})

test('the screen-reader text has no Markdown markers', () => {
  expect(plainChatText('## Gaps\n\nClose **Testing** next:\n- `Accessibility`\n- Review')).toBe(
    'Gaps Close Testing next: Accessibility; Review'
  )
})

test('single line breaks stay inside one paragraph', () => {
  expect(parseChatText('Line one\nLine two')).toEqual([
    {
      kind: 'paragraph',
      lines: [[{ kind: 'text', text: 'Line one' }], [{ kind: 'text', text: 'Line two' }]]
    }
  ])
})
