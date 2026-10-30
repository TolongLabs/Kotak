import { Moon, Sun } from 'lucide-react'
import { uiText } from '../../i18n/messages/ui'
import { useText } from '../../i18n/text'
import { cn } from './cn'
import { useTheme } from './theme'
import { switchTheme } from './themeTransition'

// Flips between light and dark. It matches the bar's menu button, so it has no tooltip that could spill off a phone
// screen; the label names the theme it switches to.
export function ThemeToggle({ className }: { className?: string }) {
  const t = useText(uiText)
  const next = useTheme() === 'dark' ? 'light' : 'dark'
  const Icon = next === 'dark' ? Moon : Sun

  return (
    <button
      type="button"
      aria-label={next === 'dark' ? t.switchToDark : t.switchToLight}
      onClick={(event) => {
        const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
        switchTheme(next, { x: left + width / 2, y: top + height / 2 })
      }}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default',
        className
      )}
    >
      <Icon className="h-5 w-5 stroke-current" aria-hidden="true" />
    </button>
  )
}
