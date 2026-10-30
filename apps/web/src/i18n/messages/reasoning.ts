import { cornerReasoning as sdkCornerReasoning } from '@kotak/sdk'
import type { CornerVerdict, Scenario } from '@kotak/shared'
import { commonText } from '../common'
import { getLocale } from '../locale'
import { defineText, textNow } from '../text'

// The SDK words each verdict's reason in English for the app and the agents alike (packages/sdk/src/view.ts). The app
// rebuilds it in Malay and Chinese from the same verdict fields; in English it returns the SDK's own sentence.
const reasonText = defineText(
  {
    aiTrend: { rising: 'is rising', not_rising: 'is not rising', unknown: 'has no trend yet' },
    mode: { augmentation: 'mostly helps people do it', automation: 'mostly does it alone', unknown: '' },
    demand: { up: 'rising', flat: 'flat', down: 'falling', unknown: 'not measured yet' },
    table: (trend: string, mode: string, demand: string) =>
      `AI use for this work ${trend}${mode ? ` and AI ${mode}` : ''}. Job-ad demand is ${demand}.`,
    scenariosDisagree: 'The two AI futures disagree',
    sourcesDisagree: 'The job-ad sources disagree',
    disagree: (cause: string, slow: string, fast: string) =>
      `${cause}: ${slow} at Malaysia’s pace, ${fast} if AI uptake speeds up.`,
    tooFewPoints: 'There are too few dated data points to call a trend yet.',
    noSplit: 'There is no data yet on whether AI helps with this work or does it alone.',
    noDemand: 'There is no job-ad demand data for this skill yet.'
  },
  {
    aiTrend: { rising: 'sedang meningkat', not_rising: 'tidak meningkat', unknown: 'belum ada trend' },
    mode: {
      augmentation: 'kebanyakannya membantu orang melakukannya',
      automation: 'kebanyakannya melakukannya sendiri',
      unknown: ''
    },
    demand: { up: 'meningkat', flat: 'mendatar', down: 'menurun', unknown: 'belum diukur' },
    table: (trend, mode, demand) =>
      `Penggunaan AI untuk kerja ini ${trend}${mode ? ` dan AI ${mode}` : ''}. Permintaan iklan kerja ${demand}.`,
    scenariosDisagree: 'Dua masa depan AI tidak sepakat',
    sourcesDisagree: 'Sumber iklan kerja tidak sepakat',
    disagree: (cause, slow, fast) => `${cause}: ${slow} pada kadar Malaysia, ${fast} jika penggunaan AI dipercepat.`,
    tooFewPoints: 'Belum cukup titik data bertarikh untuk menentukan trend.',
    noSplit: 'Belum ada data sama ada AI membantu kerja ini atau melakukannya sendiri.',
    noDemand: 'Belum ada data permintaan iklan kerja untuk kemahiran ini.'
  },
  {
    aiTrend: { rising: '正在上升', not_rising: '没有上升', unknown: '尚无趋势' },
    mode: { augmentation: '主要是协助人完成', automation: '主要是独立完成', unknown: '' },
    demand: { up: '上升', flat: '持平', down: '下降', unknown: '尚未衡量' },
    table: (trend, mode, demand) =>
      `这项工作的 AI 使用${trend}${mode ? `，且 AI ${mode}` : ''}。招聘广告需求${demand}。`,
    scenariosDisagree: '两种 AI 前景结论不一',
    sourcesDisagree: '招聘广告来源结论不一',
    disagree: (cause, slow, fast) => `${cause}：按马来西亚的步伐为「${slow}」，若 AI 采用加快则为「${fast}」。`,
    tooFewPoints: '有日期的数据点太少，暂时无法判断趋势。',
    noSplit: '目前还没有数据显示 AI 是协助这项工作还是独立完成。',
    noDemand: '这项技能还没有招聘广告需求数据。'
  }
)

/** Why the verdict is what it is, in the current language. */
export function cornerReasoning(verdict: CornerVerdict, scenario: Scenario): string {
  if (getLocale() === 'en') return sdkCornerReasoning(verdict, scenario)
  const t = textNow(reasonText)
  const verdicts = textNow(commonText).verdicts
  switch (verdict.reason) {
    case 'scenarios_disagree':
    case 'sources_disagree': {
      const [slow, fast] = (['slow', 'fast'] as const).map(
        (s) => verdicts[verdict.futures.find((f) => f.scenario === s)?.status ?? 'Unknown']
      )
      return t.disagree(verdict.reason === 'scenarios_disagree' ? t.scenariosDisagree : t.sourcesDisagree, slow, fast)
    }
    case 'too_few_points':
      return t.tooFewPoints
    case 'no_collaboration_split':
      return t.noSplit
    case 'no_demand':
      return t.noDemand
    case 'table': {
      const outcome = verdict.scenarios[scenario]
      return t.table(t.aiTrend[outcome.ai_trend], t.mode[outcome.collaboration_mode], t.demand[outcome.demand])
    }
  }
}
