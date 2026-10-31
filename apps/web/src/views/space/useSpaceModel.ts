import { assessedRoleCode } from '@kotak/sdk'
import { useMemo, useState } from 'react'
import { useCheckupBundle, useManifest, usePathways, useSpaceFile, type Loaded } from '../../engine/bundle'
import { hasAnswers, useGuestSession } from '../../session/store'
import { spaceModel, type SpaceModel } from './model'

/**
 * The space for the guest session's answers, read like useCheckup: the assessed role and its related roles from the
 * session's check-up bundle, every other job from space.json, fetched once, and each job's Job Zone from pathways.json.
 * `idle` means the session has no job or no answers yet, so the page asks for the check-up first. With `lookAround`, a
 * session with no answers gets the space without them instead (Look Around); once it has answers, they win.
 */
export function useSpaceModel({ lookAround }: { lookAround: boolean }): Loaded<SpaceModel> {
  const session = useGuestSession()
  const answered = Boolean(assessedRoleCode(session)) && hasAnswers(session)
  const ready = answered || lookAround
  const bundle = useCheckupBundle(answered ? session : null)
  const space = useSpaceFile(ready)
  const manifest = useManifest()
  const pathways = usePathways()
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  // Every session update makes a new answers array, so the model is keyed on their values: a flip of the AI future
  // or the snapshot doesn't recompute it.
  const answersKey = session.answers.join()

  // The bundle comes overlaid in the language on show, but a switch changes no number, so the model keys on the roles'
  // codes rather than the bundle's identity: a language switch doesn't recompute it or rebuild the scene.
  const loadedRoles = bundle.status === 'ready' ? bundle.data : null
  const rolesKey = loadedRoles && [loadedRoles.role.onet_code, ...loadedRoles.related.map((r) => r.onet_code)].join()
  const roles = useMemo(() => loadedRoles, [rolesKey])
  const file = space.status === 'ready' ? space.data : null
  const snapshots = manifest.status === 'ready' ? manifest.data.snapshots : null
  const pathwaysFile = pathways.status === 'ready' ? pathways.data : null
  const model = useMemo(
    () =>
      ready && (roles || !answered) && file && snapshots && pathwaysFile
        ? spaceModel({
            space: file,
            snapshots,
            pathways: pathwaysFile,
            checkup:
              answered && roles
                ? {
                    role: roles.role,
                    relatedCodes: roles.related.map((r) => r.onet_code),
                    answers: session.answers,
                    startDate: today
                  }
                : null
          })
        : null,
    [ready, answered, roles, file, snapshots, pathwaysFile, answersKey, today]
  )

  if (!ready) return { status: 'idle' }
  for (const loaded of [bundle, space, manifest, pathways]) if (loaded.status === 'error') return loaded
  return model ? { status: 'ready', data: model } : { status: 'loading' }
}
