import { z } from 'zod'
import { RatingSchema } from '../session'
import { OnetSocCodeSchema, OnetTaskIdSchema } from './onet'
import { RoleQualitySchema } from './role-corners'

// "What would you do" questions (#352, #253) in `data/generated/scenarios.json`, written by the #353 generator. A
// scenario replaces the corner's `basic` or `advanced` can-do statement in the check-up: the user picks one of four
// options, shown shuffled, and the option's hidden score is stored as that slot's rating, with no reversal. Checking
// that `task_ids` are the corner's own tasks needs the corner data, so the generator's validator and build:data do it.

export const ScenarioOptionIdSchema = z.enum(['a', 'b', 'c', 'd'])

/** One answer to a scenario. `score` is the rating it stands for (1 to 4); never show it. */
export const ScenarioOptionSchema = z
  .object({ id: ScenarioOptionIdSchema, text: z.string().min(1), score: RatingSchema })
  .strict()

/** A work situation and four options scored 1, 2, 3 and 4, once each; the O*NET tasks it draws on. */
export const ScenarioQuestionSchema = z
  .object({
    situation: z.string().min(1),
    options: z.array(ScenarioOptionSchema).length(4),
    task_ids: z.array(OnetTaskIdSchema).min(1)
  })
  .strict()
  .superRefine((scenario, ctx) => {
    const issue = (message: string, path: PropertyKey[]) => ctx.addIssue({ code: 'custom', message, path })
    const { options, task_ids } = scenario
    if (
      options
        .map((o) => o.score)
        .sort()
        .join() !== '1,2,3,4'
    )
      issue('the four scores must be 1, 2, 3 and 4, each once', ['options'])
    if (new Set(options.map((o) => o.id)).size !== options.length) issue('option ids must differ', ['options'])
    if (new Set(options.map((o) => o.text)).size !== options.length) issue('option texts must differ', ['options'])
    if (new Set(task_ids).size !== task_ids.length) issue('duplicate task id', ['task_ids'])
  })

/** A corner's scenarios, keyed by the statement each replaces. */
export const CornerScenariosSchema = z
  .object({ basic: ScenarioQuestionSchema.optional(), advanced: ScenarioQuestionSchema.optional() })
  .strict()

/** `data/generated/scenarios.json`: `{ meta, roles: { [onet_code]: { [corner_id]: { basic?, advanced? } } } }`. */
export const ScenariosFileSchema = z
  .object({
    meta: z
      .object({
        model: z.string().min(1),
        reviewers: z.array(z.string().min(1)),
        generated_at: z.iso.date(),
        quality: RoleQualitySchema
      })
      .strict(),
    roles: z.record(OnetSocCodeSchema, z.record(z.string(), CornerScenariosSchema))
  })
  .strict()

export type ScenarioOptionId = z.infer<typeof ScenarioOptionIdSchema>
export type ScenarioOption = z.infer<typeof ScenarioOptionSchema>
export type ScenarioQuestion = z.infer<typeof ScenarioQuestionSchema>
export type CornerScenarios = z.infer<typeof CornerScenariosSchema>
export type ScenariosFile = z.infer<typeof ScenariosFileSchema>
