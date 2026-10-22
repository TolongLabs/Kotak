import { X } from 'lucide-react'
import { useEffect, useRef, type RefObject } from 'react'
import { Brand, GuestCard, NavList } from './Sidebar'

interface NavDrawerProps {
  open: boolean
  path: string
  onClose: () => void
  returnFocusRef: RefObject<HTMLButtonElement | null>
}

export function NavDrawer({ open, path, onClose, returnFocusRef }: NavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-label="Menu"
      onClose={() => {
        onClose()
        returnFocusRef.current?.focus()
      }}
      onClick={(event) => {
        // A click on the dialog itself, not its content, is a click on the backdrop.
        if (event.target === event.currentTarget) onClose()
      }}
      className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 border-r border-border-subtle bg-bg-panel p-0 text-text-primary backdrop:bg-surface-glass backdrop:backdrop-blur-xl"
    >
      <div className="flex h-full flex-col gap-8 p-4">
        <div className="flex items-center justify-between">
          <Brand onNavigate={onClose} />
          <button
            type="button"
            aria-label="Close Menu"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-bg-default text-text-primary transition-colors duration-150 ease-out hover:bg-bg-panel"
          >
            <X className="h-5 w-5 stroke-current" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Main">
          <NavList path={path} onNavigate={onClose} />
        </nav>
        <div className="mt-auto">
          <GuestCard />
        </div>
      </div>
    </dialog>
  )
}
