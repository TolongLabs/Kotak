import { Moon, Sun } from 'lucide-react'
import { cn } from './cn'
import { setTheme, useTheme } from './theme'

// Flips between light and dark. It matches the bar's menu button, so it has no tooltip that could spill off a phone
// screen; the label names the theme it switches to.
export function ThemeToggle({ className }: { className?: string }) {
  const next = useTheme() === 'dark' ? 'light' : 'dark'
  const Icon = next === 'dark' ? Moon : Sun

  return (
    <button
      type="button"
      aria-label={next === 'dark' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      onClick={() => setTheme(next)}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg-default',
        className
      )}
    >
      <Icon className="h-5 w-5 stroke-current" aria-hidden="true" />
    </button>
  )
}
