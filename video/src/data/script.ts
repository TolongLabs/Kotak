// The demo narration, D1 to M1, as the director script reads it
// (docs/demo/kotak-director-script.md, "Live demo"). `[pause Ns]` marks are silence;
// `[kopi]` is where Kopi's own voice plays in D6. The captions use these words, and Whisper only times them.
// If a take reads a pickup line, change its text here to what was said.
export const SCRIPT = {
  D1: 'First, the problem. [pause 0.3s] Aina starts with who she is: working, as a web developer, and she wants to stay strong in her job as AI changes it.',
  D2: "Then Kopi, Kotak's guide, asks twelve can-do questions about her own work, two for each of six skills. [pause 0.3s] Some are worded the other way round, to catch answers on autopilot. [pause 0.3s] It takes about three minutes.",
  D3: "Her radar compares six skills: her own, self-reported level against what the job is estimated to need a year ahead. [pause 0.3s] Each skill gets a verdict with a dated source. Technical documentation gets rising: AI helps it scale. Web site building gets declining because of AI. [pause 0.4s] And it's tied to real hiring: about a hundred and seventy JobStreet ads in Malaysia match her job, at a median of six thousand three hundred ringgit a month.",
  D4: 'Now the solution. [pause 0.3s] Kotak ranks the roles she fits, each with its score and its reason. [pause 0.3s] See the Maths opens the formula behind every number.',
  D5: 'Her roadmap puts the steps in the order that gains the most fit per hour, and leaves declining skills for last. [pause 0.3s] At ten hours a week, Kotak estimates she reaches eighty per cent fit by week thirty-five. [pause 0.3s] Each step shows its hours and a free search link. And the funding card tells her employer to apply before the training starts.',
  D6: 'And the outcome: a plan that moves with the data. [pause 0.3s] Same job. Same twelve answers. Only the data moves, from April to May. [pause 0.3s] Our hardest risk is thin data, so Kotak never guesses: in April, with one month of AI-use data, every skill read Unknown. In May, six verdicts flip, the ranking reorders, and web site building, now declining, drops from step four to last. [pause 0.3s] [kopi] The trend data drives the plan. Kopi just says why.',
  D7: 'Aina can ask Kopi about her plan. Here it checks the national skill gaps, and says plainly that these rows are sample data.',
  M1: "Kotak doesn't stop at its own screen. [pause 0.3s] Most teams build a chatbot. Kotak is the tool a chatbot calls. [pause 0.3s] Any AI assistant that speaks MCP can ask Kotak, and get the same verdicts, from the same rules."
} as const

export type TakeId = keyof typeof SCRIPT
export const TAKES = Object.keys(SCRIPT) as TakeId[]

/** Slot lengths in seconds from the script's timing table; they sum to 180. */
export const SLOTS: Record<TakeId, number> = { D1: 14, D2: 18, D3: 34, D4: 16, D5: 28, D6: 40, D7: 12, M1: 18 }

/** The spoken words of a take, punctuation kept, directions dropped. */
export const scriptWords = (id: TakeId) =>
  SCRIPT[id]
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

/** Never on screen, in the narration or in the captions (director script, "Claim guardrails"). */
export const BANNED = [
  'ai check-up',
  '12-week',
  'twelve-week',
  'chance of',
  'guarantee',
  'ai decides',
  'will replace you',
  'certified',
  'real user',
  'hrd corp-claimable',
  'only one in the world'
]
