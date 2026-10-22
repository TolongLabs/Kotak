import {
  BUNDLE_PATHS,
  BundleManifestSchema,
  BundleRoleIndexSchema,
  BundleRoleSchema,
  type BundleRole
} from '@kotak/shared'
import { useEffect, useState } from 'react'

// The static client bundle (#88), fetched once per file and checked with its Zod schema (TRD.md "Client runtime").

/** A bundle file that could not be fetched or failed its schema. The UI shows an error state with a retry. */
export class BundleFileError extends Error {
  readonly path: string

  constructor(path: string, message: string, cause: unknown) {
    super(message, { cause })
    this.name = 'BundleFileError'
    this.path = path
  }
}

const cache = new Map<string, Promise<unknown>>()

async function fetchFile<T>(path: string, schema: { parse: (value: unknown) => T }): Promise<T> {
  let response: Response
  try {
    response = await fetch(path)
  } catch (cause) {
    throw new BundleFileError(path, `Couldn't fetch ${path}.`, cause)
  }
  if (!response.ok) throw new BundleFileError(path, `${path} answered HTTP ${response.status}.`, null)
  try {
    return schema.parse(await response.json())
  } catch (cause) {
    console.error(`${path} is not a valid bundle file.`, cause)
    throw new BundleFileError(path, `${path} is not a valid bundle file.`, cause)
  }
}

function load<T>(path: string, schema: { parse: (value: unknown) => T }): Promise<T> {
  let request = cache.get(path) as Promise<T> | undefined
  if (!request) {
    request = fetchFile(path, schema)
    cache.set(path, request)
    // A failed file is fetched again on the next try.
    request.catch(() => cache.delete(path))
  }
  return request
}

export const loadManifest = () => load(BUNDLE_PATHS.manifest, BundleManifestSchema)
export const loadRoleIndex = () => load(BUNDLE_PATHS.roles, BundleRoleIndexSchema)
export const loadRole = (onetCode: string) => load(BUNDLE_PATHS.role(onetCode), BundleRoleSchema)

export interface RoleBundle {
  role: BundleRole
  /** The related roles that loaded, in O*NET's order; the fit scores rank them with the role itself. */
  related: BundleRole[]
  /** Related roles whose file failed; they are left out of the ranking rather than failing the role. */
  unavailable: string[]
}

export async function loadRoleBundle(onetCode: string): Promise<RoleBundle> {
  const role = await loadRole(onetCode)
  const results = await Promise.allSettled(role.related.map((related) => loadRole(related.onet_code)))
  return {
    role,
    related: results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
    unavailable: role.related.filter((_, i) => results[i]!.status === 'rejected').map((related) => related.onet_code)
  }
}

export type Loaded<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error; retry: () => void }
  | { status: 'ready'; data: T }

// `load` must be a stable, module-level function.
function useLoaded<T>(key: string | null, load: (key: string) => Promise<T>): Loaded<T> {
  const [attempt, setAttempt] = useState(0)
  const [settled, setSettled] = useState<{ key: string; attempt: number; result: Loaded<T> } | null>(null)

  useEffect(() => {
    if (key === null) return
    let current = true
    const settle = (result: Loaded<T>) => {
      if (current) setSettled({ key, attempt, result })
    }
    load(key).then(
      (data) => settle({ status: 'ready', data }),
      (error: Error) => settle({ status: 'error', error, retry: () => setAttempt((n) => n + 1) })
    )
    return () => {
      current = false
    }
  }, [key, attempt, load])

  if (key === null) return { status: 'idle' }
  return settled?.key === key && settled.attempt === attempt ? settled.result : { status: 'loading' }
}

export const useManifest = () => useLoaded('manifest', loadManifest)
export const useRoleIndex = () => useLoaded('roles', loadRoleIndex)
export const useRoleBundle = (onetCode: string | null) => useLoaded(onetCode, loadRoleBundle)
