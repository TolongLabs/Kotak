import { X } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { IconButton } from './IconButton'
import { cn } from './cn'

export interface ModalProps extends Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'title' | 'onClose'> {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
}

export const Modal = forwardRef<HTMLDialogElement, ModalProps>(function Modal(
  { open, onClose, title, children, actions, className, ...props },
  ref
) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const openRef = useRef(open)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleNativeClose = () => {
      if (!openRef.current) return
      onCloseRef.current()
    }

    dialog.addEventListener('close', handleNativeClose)

    if (open) {
      if (!dialog.open) {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        dialog.showModal()
        dialog.focus()
      }
    } else if (dialog.open) {
      dialog.close()
    }

    return () => {
      dialog.removeEventListener('close', handleNativeClose)
      if (dialog.open) dialog.close()
    }
  }, [open])

  useEffect(() => {
    if (open) return
    openerRef.current?.focus()
    openerRef.current = null
  }, [open])

  const setRef = (instance: HTMLDialogElement | null) => {
    dialogRef.current = instance
    if (typeof ref === 'function') ref(instance)
    else if (ref) ref.current = instance
  }

  return (
    <dialog
      ref={setRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      className={cn(
        'm-auto w-[min(28rem,calc(100vw-2rem))] rounded-md bg-bg-default p-6 text-text-primary shadow-[var(--shadow-popover)] [&::backdrop]:bg-surface-glass [&::backdrop]:backdrop-blur-[24px]',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-title-s">
            {title}
          </h2>
          <IconButton label="Close" icon={X} variant="plain" className="-mr-2 -mt-2" onClick={onClose} />
        </div>
        <div className="break-words text-body-m text-text-primary">{children}</div>
        {actions ? <div className="flex justify-end gap-3">{actions}</div> : null}
      </div>
    </dialog>
  )
})
