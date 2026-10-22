// Kopi's six poses from DESIGN.md, one per moment. Each has static art at /kopi/<pose>.png.
export const kopiPoses = ['idle', 'asking', 'thinking', 'happy', 'worried', 'explaining'] as const

export type KopiPose = (typeof kopiPoses)[number]
