import { X } from 'lucide-react'
import { forwardRef, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { commonText } from '../../i18n/common'
import { useText } from '../../i18n/text'
import { IconButton } from './IconButton'
import { cn } from './cn'

export interface ModalProps extends Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'title' | 'onClose'> {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions?: ReactNode
  /** An action in the header, right of the title and before the close button, so it comes first in the tab order. */
  headerAction?: ReactNode
  /**
   * The dialog's width class, in place of the default. Set a width here, not in className, where it would stack with the
   * default (cn doesn't merge classes) and win only by stylesheet order.
   */
  widthClass?: string
  /** Show the "Close" tooltip on the close button. */
  closeTooltip?: boolean
  /** The close button's look: `bare` drops its hover fill and line, keeping only the keyboard's focus ring. */
  closeVariant?: 'plain' | 'bare'
  /** What covers the page behind the dialog: 'blur' frosts it, and 'none' leaves it fully visible, as over the 3D space. */
  backdrop?: 'blur' | 'none'
  /**
   * How the body meets the screen. 'flow', the default, grows with its content. 'scroll' caps the dialog at the screen's
   * height and scrolls the body, keeping the title, close button and actions in view; the body is a region named by the
   * title, and a tab stop while it overflows, so the keys scroll it even when it holds nothing focusable. 'fill' caps the
   * dialog the same way and hands the body the height left as a flex column that doesn't scroll, for content with its
   * own scroller that gives way to a short screen, such as a table's box.
   */
  body?: 'flow' | 'scroll' | 'fill'
  /**
   * Let the close button and Esc close the dialog. Off, it has neither, so give it an action that leaves, best as the
   * headerAction, where a keyboard reaches it first.
   */
  dismissible?: boolean
}

export const Modal = forwardRef<HTMLDialogElement, ModalProps>(function Modal(
  {
    open,
    onClose,
    title,
    children,
    actions,
    headerAction,
    widthClass = 'w-[min(28rem,calc(100vw-2rem))]',
    closeTooltip = true,
    closeVariant = 'plain',
    backdrop = 'blur',
    body = 'flow',
    dismissible = true,
    className,
    ...props
  },
  ref
) {
  const common = useText(commonText)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const openRef = useRef(open)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    openRef.current = open
  }, [open])

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // The close event comes a task after close(). A dialog that has opened again since (a remount, as StrictMode does to
    // a dialog that mounts open) ignores it.
    const handleNativeClose = () => {
      if (!openRef.current || dialog.open) return
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

  // Esc on a dialog that can't be dismissed does nothing: its keydown is cancelled, so the browser makes no close request
  // (a cancelled cancel event alone gives way to a second Esc), and any other close request is cancelled.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dismissible) return
    const stay = (event: Event) => {
      if (event.type === 'cancel' || (event as KeyboardEvent).key === 'Escape') event.preventDefault()
    }
    dialog.addEventListener('keydown', stay)
    dialog.addEventListener('cancel', stay)
    return () => {
      dialog.removeEventListener('keydown', stay)
      dialog.removeEventListener('cancel', stay)
    }
  }, [dismissible])

  useEffect(() => {
    if (open) return
    openerRef.current?.focus()
    openerRef.current = null
  }, [open])

  // The scrolling body is a tab stop only while there is something to scroll; it checks again whenever it or its content
  // changes size, the content measured as one box that stays put whatever it holds.
  useEffect(() => {
    const scroller = bodyRef.current
    const content = contentRef.current
    if (!scroller || !content) return
    const update = () =>
      setOverflows(scroller.scrollHeight > scroller.clientHeight || scroller.scrollWidth > scroller.clientWidth)
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observer.observe(content)
    return () => observer.disconnect()
  }, [body])

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
        'm-auto rounded-md bg-bg-default p-6 text-text-primary shadow-[var(--shadow-popover)]',
        widthClass,
        body !== 'flow' && 'max-h-[calc(100dvh-2rem)]',
        backdrop === 'blur' && '[&::backdrop]:bg-surface-glass [&::backdrop]:backdrop-blur-[24px]',
        backdrop === 'none' && '[&::backdrop]:bg-transparent',
        className
      )}
      {...props}
    >
      <div className={cn('flex flex-col gap-4', body !== 'flow' && 'max-h-[calc(100dvh-5rem)]')}>
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-title-s">
            {title}
          </h2>
          {headerAction && <div className="-mt-2 ml-auto shrink-0">{headerAction}</div>}
          {dismissible && (
            <IconButton
              label={common.close}
              icon={X}
              variant={closeVariant}
              tooltip={closeTooltip}
              className="-mr-2 -mt-2"
              onClick={onClose}
            />
          )}
        </div>
        {body === 'scroll' ? (
          // The body's scroll box reaches into the padding, so focus rings at its edges aren't clipped; its own ring
          // sits inside it, clear of the dialog's edge.
          <div
            ref={bodyRef}
            role="region"
            aria-labelledby={titleId}
            tabIndex={overflows ? 0 : undefined}
            className="-mx-6 -my-1 min-h-0 overflow-y-auto overscroll-contain break-words px-6 py-1 text-body-m text-text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring"
          >
            <div ref={contentRef}>{children}</div>
          </div>
        ) : (
          <div className={cn('break-words text-body-m text-text-primary', body === 'fill' && 'flex min-h-0 flex-col')}>
            {children}
          </div>
        )}
        {actions ? <div className="flex justify-end gap-3">{actions}</div> : null}
      </div>
    </dialog>
  )
})
