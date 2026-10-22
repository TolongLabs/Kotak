import { createBundle, fetchSource } from '@kotak/sdk'
import { useEffect, useState } from 'react'

// The static client bundle (#88), read through @kotak/sdk from the page's origin: each file fetched once and checked
// with its Zod schema (TRD.md "Client runtime"). The React hooks stay here.

export { BundleFileError, type RoleBundle } from '@kotak/sdk'

const bundle = createBundle(fetchSource({ baseUrl: window.location.origin, fetch }))

export const loadManifest = () => bundle.manifest()
export const loadRoleIndex = () => bundle.roleIndex()
export const loadRole = (onetCode: string) => bundle.role(onetCode)
export const loadRoleBundle = (onetCode: string) => bundle.roleBundle(onetCode)

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
