import { EVIDENCE_MAX_BYTES, EVIDENCE_MEDIA_TYPES, EvidenceResponseSchema } from '@kotak/shared'
import type { EvidenceMediaType, EvidenceRequest, EvidenceResponse, MilestoneEvidence } from '@kotak/shared'
import { getLocale } from '../i18n/locale'

/** A file the user chose, read in the browser and ready to send. previewUrl is an object URL for images, else null. */
export type EvidenceFile = {
  name: string
  size: number
  media_type: EvidenceMediaType
  data: string
  previewUrl: string | null
}

/** Why a chosen file can't be sent; each has a message in evidenceText.sheet.errors. */
export type EvidenceFileProblem = 'heic' | 'type' | 'size' | 'read'

/** How a step stands on proof. */
export type StepProof =
  | { status: 'open' } // not done, no attempt yet
  | { status: 'judging' }
  | { status: 'fail'; reason: string }
  | { status: 'unclear'; hint: string | null }
  | { status: 'error' } // network, timeout, rate limit or a bad answer: the step stays open
  | { status: 'proven'; evidence: MilestoneEvidence }
  | { status: 'unproven' } // ticked before proof existed

export type JudgeResult = { status: 'judged'; data: EvidenceResponse } | { status: 'error' }

/** How long the judge may take before the step gives up and stays open. */
const JUDGE_TIMEOUT_MS = 90_000

const HEIC_TYPES = ['image/heic', 'image/heif']
// An empty file.type still reads its extension, so a drag from a file manager works.
const MEDIA_TYPE_BY_EXTENSION: Record<string, EvidenceMediaType> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf'
}

function isHeic(file: File): boolean {
  const name = file.name.toLowerCase()
  return HEIC_TYPES.includes(file.type.toLowerCase()) || name.endsWith('.heic') || name.endsWith('.heif')
}

function mediaTypeOf(file: File): EvidenceMediaType | null {
  const declared = EVIDENCE_MEDIA_TYPES.find((mediaType) => mediaType === file.type)
  if (declared) return declared
  if (file.type) return null
  const extension = file.name.toLowerCase().split('.').pop() ?? ''
  return MEDIA_TYPE_BY_EXTENSION[extension] ?? null
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      if (comma === -1) reject(new Error('Unexpected read result'))
      else resolve(result.slice(comma + 1))
    }
    reader.onerror = () => reject(new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}

export async function readEvidenceFile(
  file: File
): Promise<{ ok: true; file: EvidenceFile } | { ok: false; problem: EvidenceFileProblem }> {
  if (isHeic(file)) return { ok: false, problem: 'heic' }

  const mediaType = mediaTypeOf(file)
  if (!mediaType) return { ok: false, problem: 'type' }
  if (file.size > EVIDENCE_MAX_BYTES) return { ok: false, problem: 'size' }

  let data: string
  try {
    data = await readAsDataUrl(file)
  } catch {
    return { ok: false, problem: 'read' }
  }
  if (!data) return { ok: false, problem: 'read' }

  return {
    ok: true,
    file: {
      name: file.name,
      size: file.size,
      media_type: mediaType,
      data,
      previewUrl: mediaType === 'application/pdf' ? null : URL.createObjectURL(file)
    }
  }
}

export async function judgeEvidence(request: Omit<EvidenceRequest, 'lang'>): Promise<JudgeResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), JUDGE_TIMEOUT_MS)

  try {
    const response = await fetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, lang: getLocale() }),
      signal: controller.signal
    })
    if (response.status !== 200) return { status: 'error' }

    const result = EvidenceResponseSchema.safeParse(await response.json())
    return result.success ? { status: 'judged', data: result.data } : { status: 'error' }
  } catch {
    // A failure of any kind fails closed, so the step stays open.
    return { status: 'error' }
  } finally {
    clearTimeout(timer)
  }
}
