import type { Source } from '../engine'

/** The bare citations of a list of sourced records, each once, in first-seen order. */
export function uniqueSources(records: Source[]): Source[] {
  const seen = new Map<string, Source>()
  for (const { source_name, source_url, vintage_date, geo_or_layer } of records) {
    const s = { source_name, source_url, vintage_date, geo_or_layer }
    seen.set(JSON.stringify(s), s)
  }
  return [...seen.values()]
}
