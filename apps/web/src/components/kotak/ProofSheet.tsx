import { BadgeCheck, FileText, Lock, MonitorCheck, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { readEvidenceFile, type EvidenceFile, type EvidenceFileProblem } from '../../engine/evidence'
import { evidenceText } from '../../i18n/messages/evidence'
import { useText } from '../../i18n/text'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { Modal } from '../ui/Modal'

export interface ProofSheetProps {
  open: boolean
  /** The step's skill, named in the sheet's intro. */
  skill: string
  onClose: () => void
  /** Check My Proof: the parent closes the sheet and judges the file on the step card. */
  onSubmit: (file: EvidenceFile) => void
}

// HEIC is accepted here on purpose: the picker shows a greyed-out .heic file, and the user gets the fix message instead.
const FILE_ACCEPT = 'image/png,image/jpeg,image/webp,application/pdf,.heic,.heif'

const EXAMPLES = [
  { icon: FileText, key: 'certificate' },
  { icon: MonitorCheck, key: 'completion' },
  { icon: BadgeCheck, key: 'badge' }
] as const

function fileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export function ProofSheet({ open, skill, onClose, onSubmit }: ProofSheetProps) {
  const t = useText(evidenceText).sheet
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<EvidenceFile | null>(null)
  const [file, setFile] = useState<EvidenceFile | null>(null)
  const [problem, setProblem] = useState<EvidenceFileProblem | null>(null)
  const [dragging, setDragging] = useState(false)

  /** The one place a file is dropped or swapped, so the old object URL is always released. A handed-off file is no longer ours. */
  function put(next: EvidenceFile | null) {
    if (fileRef.current?.previewUrl) URL.revokeObjectURL(fileRef.current.previewUrl)
    fileRef.current = next
    setFile(next)
  }

  /** Check My Proof: the parent judges the file, so its object URL stays live until the parent is done with it. */
  function handOff() {
    if (!file) return
    onSubmit(file)
    fileRef.current = null
    setFile(null)
  }

  async function take(candidate: File) {
    const result = await readEvidenceFile(candidate)
    if (!result.ok) {
      put(null)
      setProblem(result.problem)
      return
    }
    put(result.file)
    setProblem(null)
  }

  useEffect(() => {
    if (open) return
    put(null)
    setProblem(null)
    setDragging(false)
  }, [open])

  // While the sheet is open, a pasted screenshot lands in the drop zone like a dropped file.
  useEffect(() => {
    if (!open) return
    const handlePaste = (event: ClipboardEvent) => {
      const pasted = event.clipboardData?.files[0]
      if (pasted) void take(pasted)
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [open])

  const preview = file ? (
    <div className="flex items-start gap-3">
      {file.previewUrl ? (
        <img
          src={file.previewUrl}
          alt={t.previewLabel(file.name)}
          className="max-h-48 w-full min-w-0 flex-1 rounded-sm border border-border-subtle object-contain"
        />
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3 rounded-sm border border-border-subtle bg-bg-panel p-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 stroke-current" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-label-m [overflow-wrap:anywhere]">{file.name}</p>
            <p className="text-body-s text-text-muted">{fileSize(file.size)}</p>
            <p className="text-body-s text-text-muted">{t.pdfFirstPage}</p>
          </div>
        </div>
      )}
      <IconButton label={t.remove} icon={X} onClick={() => put(null)} />
    </div>
  ) : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t.title}
      body="scroll"
      widthClass="w-[min(32rem,calc(100vw-2rem))]"
      className="max-[479px]:mb-0 max-[479px]:w-full max-[479px]:max-w-full max-[479px]:rounded-b-none"
      actions={
        <div className="flex w-full justify-end gap-3 max-[479px]:flex-col-reverse">
          <Button variant="ghost" className="max-[479px]:w-full" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button variant="primary" className="max-[479px]:w-full" disabled={!file} onClick={handOff}>
            {t.submit}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-body-m">{t.intro(skill)}</p>

        <div className="space-y-2">
          <h3 className="text-label-m">{t.countsHeading}</h3>
          <ul className="grid gap-2 min-[480px]:grid-cols-3">
            {EXAMPLES.map(({ icon: Icon, key }) => (
              <li
                key={key}
                className="flex items-center gap-2 rounded-sm border border-border-subtle bg-bg-panel p-3 text-body-s"
              >
                <Icon className="h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
                <span className="min-w-0">{t.examples[key]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            const dropped = event.dataTransfer.files[0]
            if (dropped) void take(dropped)
          }}
          className={`flex flex-col items-center gap-2 rounded-md border-[1.5px] border-dashed bg-bg-panel p-4 text-center ${
            dragging ? 'border-text-primary' : 'border-border-control'
          }`}
        >
          <Upload className="h-6 w-6 stroke-current" aria-hidden="true" />
          <p className="text-label-m">{t.dropTitle}</p>
          <p className="text-body-s text-text-muted">{t.dropTypes}</p>
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            {file ? t.change : t.choose}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={FILE_ACCEPT}
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
            onChange={(event) => {
              const chosen = event.currentTarget.files?.[0]
              // Reset first, so picking the same file again still reports a change.
              event.currentTarget.value = ''
              if (chosen) void take(chosen)
            }}
          />
        </div>

        {preview}

        {problem && (
          <p role="alert" className="text-body-s text-state-error">
            {t.errors[problem]}
          </p>
        )}

        <p className="flex items-start gap-2 text-body-s text-text-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 stroke-current" aria-hidden="true" />
          <span className="min-w-0">{t.privacy}</span>
        </p>
      </div>
    </Modal>
  )
}
