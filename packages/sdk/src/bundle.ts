import {
  BUNDLE_PATHS,
  BundleManifestSchema,
  BundlePathwaysSchema,
  BundleRoleIndexSchema,
  BundleRoleSchema,
  SdgReasonsFileSchema,
  type BundleManifest,
  type BundlePathways,
  type BundleRole,
  type BundleRoleIndex,
  type SdgReasonsFile,
  type SpaceFile
} from '@kotak/shared'

// The static client bundle (#88), read through a bundle source, checked with its Zod schema and kept in memory for
// the life of the `Bundle` (TRD.md "Client runtime").

/**
 * Where the bundle files come from: `read` returns the parsed JSON at a bundle path (a `BUNDLE_PATHS` value) and
 * throws when there is no such file. A trusted source skips the Zod parse; the build already checked every file.
 */
export interface BundleSource {
  read: (path: string) => Promise<unknown>
  trusted?: boolean
}

/** A bundle file that could not be read or failed its schema. The UI shows an error state with a retry. */
export class BundleFileError extends Error {
  readonly path: string

  constructor(path: string, message: string, cause: unknown) {
    super(message, { cause })
    this.name = 'BundleFileError'
    this.path = path
  }
}

/**
 * Reads the bundle over HTTP from `baseUrl`: the page's origin, the live site, or a Worker's `ASSETS` binding. An
 * HTML or non-JSON answer counts as a missing file, because the Worker answers unknown paths with index.html and 200.
 */
export function fetchSource({
  baseUrl,
  fetch,
  trusted
}: {
  baseUrl: string
  fetch: (url: string) => Promise<Response>
  trusted?: boolean
}): BundleSource {
  return {
    trusted,
    async read(path) {
      let response: Response
      try {
        response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`)
      } catch (cause) {
        throw new BundleFileError(path, `Couldn't fetch ${path}.`, cause)
      }
      if (!response.ok) throw new BundleFileError(path, `${path} answered HTTP ${response.status}.`, null)
      const missing = (cause: unknown) =>
        new BundleFileError(path, `${path} is missing: the server answered with a page, not a bundle file.`, cause)
      if (response.headers.get('content-type')?.includes('text/html')) throw missing(null)
      try {
        return await response.json()
      } catch (cause) {
        throw missing(cause)
      }
    }
  }
}

async function readFile<T>(source: BundleSource, path: string, schema: { parse: (value: unknown) => T }): Promise<T> {
  let file: unknown
  try {
    file = await source.read(path)
  } catch (cause) {
    throw cause instanceof BundleFileError ? cause : new BundleFileError(path, `Couldn't read ${path}.`, cause)
  }
  if (source.trusted) return file as T
  try {
    return schema.parse(file)
  } catch (cause) {
    console.error(`${path} is not a valid bundle file.`, cause)
    throw new BundleFileError(path, `${path} is not a valid bundle file.`, cause)
  }
}

export interface RoleBundle {
  role: BundleRole
  /**
   * The related roles that loaded, in O*NET's order, then the extra roles asked for (#284's wider pool); the fit
   * scores rank them with the role itself.
   */
  related: BundleRole[]
  /** Related or extra roles whose file failed; they are left out of the ranking rather than failing the role. */
  unavailable: string[]
}

export interface Bundle {
  manifest: () => Promise<BundleManifest>
  roleIndex: () => Promise<BundleRoleIndex>
  /** Fields of study, interest areas, regulated professions and each occupation's preparation (#284). */
  pathways: () => Promise<BundlePathways>
  /** The UN text and Kotak's one-line reason for each SDG target a skill is tagged with (#391). */
  sdgReasons: () => Promise<SdgReasonsFile>
  role: (onetCode: string) => Promise<BundleRole>
  /** The role, every related role and the `extra` roles, which the check-up ranks it against. */
  roleBundle: (onetCode: string, extra?: string[]) => Promise<RoleBundle>
  /**
   * Every role cut to what the engine reads for a ranked role, for the 3D space. It has no schema: the build cut it
   * from role files it had already checked (packages/shared/src/bundle/space.ts).
   */
  space: () => Promise<SpaceFile>
}

/** Role files kept at most; the least recently read goes first. Every other file always stays. */
const MAX_CACHED_ROLES = 200

/** The bundle's files, each read once and kept; a failed file is read again on the next try. */
export function createBundle(source: BundleSource): Bundle {
  const cache = new Map<string, Promise<unknown>>()
  const roleFiles: string[] = []

  function load<T>(path: string, schema: { parse: (value: unknown) => T }): Promise<T> {
    let request = cache.get(path) as Promise<T> | undefined
    const isRole = path.startsWith('/data/roles/')
    if (request && isRole) {
      roleFiles.splice(roleFiles.indexOf(path), 1)
      roleFiles.push(path)
    }
    if (!request) {
      request = readFile(source, path, schema)
      cache.set(path, request)
      request.catch(() => {
        cache.delete(path)
        if (isRole && roleFiles.includes(path)) roleFiles.splice(roleFiles.indexOf(path), 1)
      })
      if (isRole) {
        roleFiles.push(path)
        while (roleFiles.length > MAX_CACHED_ROLES) cache.delete(roleFiles.shift()!)
      }
    }
    return request
  }

  const role = (onetCode: string) => load(BUNDLE_PATHS.role(onetCode), BundleRoleSchema)

  return {
    manifest: () => load(BUNDLE_PATHS.manifest, BundleManifestSchema),
    roleIndex: () => load(BUNDLE_PATHS.roles, BundleRoleIndexSchema),
    pathways: () => load(BUNDLE_PATHS.pathways, BundlePathwaysSchema),
    sdgReasons: () => load(BUNDLE_PATHS.sdgReasons, SdgReasonsFileSchema),
    space: () => load(BUNDLE_PATHS.space, { parse: (file) => file as SpaceFile }),
    role,
    async roleBundle(onetCode, extra = []) {
      const main = await role(onetCode)
      const codes = [...new Set([...main.related.map((related) => related.onet_code), ...extra])].filter(
        (code) => code !== onetCode
      )
      const results = await Promise.allSettled(codes.map((code) => role(code)))
      return {
        role: main,
        related: results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
        unavailable: codes.filter((_, i) => results[i]!.status === 'rejected')
      }
    }
  }
}
