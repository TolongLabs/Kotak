import { z } from 'zod'
import { OnetAttributionSchema, OnetSocCodeSchema, onetCredit } from './onet'

const VariantStatementsSchema = z
  .object({
    basic: z.string().min(1).optional(),
    working: z.string().min(1).optional(),
    advanced: z.string().min(1).optional()
  })
  .strict()

const VariantReversedStatementsSchema = z
  .object({ basic: z.string().min(1).optional(), advanced: z.string().min(1).optional() })
  .strict()

/** Experienced wording for the statements in one corner; slots absent here keep the source wording. */
export const StatementVariantSchema = z
  .object({
    statements: VariantStatementsSchema.optional(),
    reversed_statements: VariantReversedStatementsSchema.optional()
  })
  .strict()
  .refine(
    (variant) =>
      Object.values(variant.statements ?? {}).some((text) => text !== undefined) ||
      Object.values(variant.reversed_statements ?? {}).some((text) => text !== undefined),
    'a statement variant must contain at least one wording'
  )

const StatementVariantsMetaSchema = z
  .object({
    ...OnetAttributionSchema.shape,
    onet_version: z.string().regex(/^\d+\.\d+$/),
    method: z
      .string()
      .min(1)
      .refine((method) => !/[\r\n]/.test(method), 'method must be one line')
  })
  .strict()
  .refine((meta) => meta.credit === onetCredit(meta.onet_version), {
    message: 'credit must be the O*NET credit line naming onet_version',
    path: ['credit']
  })

/** `data/generated/statement-variants.json`: experienced wording keyed by O*NET code and corner ID. */
export const StatementVariantsFileSchema = z
  .object({
    meta: StatementVariantsMetaSchema,
    roles: z.record(OnetSocCodeSchema, z.record(z.string(), StatementVariantSchema))
  })
  .strict()

export type StatementVariant = z.infer<typeof StatementVariantSchema>
export type StatementVariantsFile = z.infer<typeof StatementVariantsFileSchema>
