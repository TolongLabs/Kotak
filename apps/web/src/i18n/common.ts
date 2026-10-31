import { defineText } from './text'

// Words every area shares, so one term reads the same on every screen. An area keeps its own text in
// i18n/messages/<area>.ts; add a word here only when several areas show it.
export const commonText = defineText(
  {
    verdicts: {
      Rising: 'Rising',
      Steady: 'Steady',
      Declining: 'Declining',
      Split: 'Split',
      Unknown: 'Unknown'
    },
    // What each verdict means, on hover over its chip.
    verdictMeanings: {
      Rising: 'Worth building: AI use on this work is rising and mostly helps people, or job-ad demand is up.',
      Steady: "No big change expected: AI use isn't rising fast and job-ad demand is flat.",
      Declining: 'Losing value: AI is starting to do this work, or job-ad demand is falling.',
      Split: 'The two AI futures disagree: slow and fast AI uptake give different verdicts.',
      Unknown: 'Not enough dated data to call it yet.'
    },
    scenarios: { slow: 'Slow AI Uptake', fast: 'Fast AI Uptake' },
    nav: {
      home: 'Home',
      checkUp: 'Check-Up',
      radar: 'Radar',
      roles: 'Roles',
      roadmap: 'Roadmap',
      space: 'Space',
      connect: 'Connect Your AI',
      settings: 'Settings'
    },
    steps: { start: 'Start', questions: 'Questions', radar: 'Radar', roles: 'Roles', plan: 'Plan' },
    askKopi: 'Ask Kopi',
    untranslated: 'Not fully translated',
    untranslatedNote: "Some of this job's text is still in English.",
    guest: 'Guest',
    back: 'Back',
    next: 'Next',
    continue: 'Continue',
    cancel: 'Cancel',
    close: 'Close',
    tryAgain: 'Try Again',
    loading: 'Loading…',
    estimate: 'Estimate',
    sources: 'Sources',
    hours: (n: number) => `${n} ${n === 1 ? 'hour' : 'hours'}`,
    weeks: (n: number) => `${n} ${n === 1 ? 'week' : 'weeks'}`,
    languageShort: 'EN',
    languageLabel: 'Language: English. Change Language',
    sgf: {
      name: 'SkillsFuture Singapore',
      equivalent: 'Singapore Equivalent',
      more: (n: number) => `+${n} more`,
      level: (n: number) => `Level ${n} of 6`,
      emerging: 'Emerging in Singapore',
      matched: "Matched by AI from Singapore's Skills Framework; not yet checked by a person."
    }
  },
  {
    verdicts: {
      Rising: 'Meningkat',
      Steady: 'Stabil',
      Declining: 'Menurun',
      Split: 'Berbelah Bahagi',
      Unknown: 'Belum Diketahui'
    },
    verdictMeanings: {
      Rising:
        'Berbaloi dibina: penggunaan AI untuk kerja ini meningkat dan kebanyakannya membantu manusia, atau permintaan iklan kerja naik.',
      Steady:
        'Tiada perubahan besar dijangka: penggunaan AI tidak naik dengan pantas dan permintaan iklan kerja mendatar.',
      Declining: 'Nilainya menurun: AI mula melakukan kerja ini, atau permintaan iklan kerja jatuh.',
      Split: 'Dua masa depan AI tidak sepakat: penggunaan AI perlahan dan pantas memberi keputusan berbeza.',
      Unknown: 'Data bertarikh belum cukup untuk membuat keputusan.'
    },
    scenarios: { slow: 'Guna AI Perlahan', fast: 'Guna AI Pantas' },
    nav: {
      home: 'Utama',
      checkUp: 'Semakan',
      radar: 'Radar',
      roles: 'Peranan',
      roadmap: 'Peta Jalan',
      space: 'Ruang',
      connect: 'Sambungkan AI Anda',
      settings: 'Tetapan'
    },
    steps: { start: 'Mula', questions: 'Soalan', radar: 'Radar', roles: 'Peranan', plan: 'Pelan' },
    askKopi: 'Tanya Kopi',
    untranslated: 'Belum diterjemahkan sepenuhnya',
    untranslatedNote: 'Sebahagian teks kerja ini masih dalam bahasa Inggeris.',
    guest: 'Tetamu',
    back: 'Kembali',
    next: 'Seterusnya',
    continue: 'Teruskan',
    cancel: 'Batal',
    close: 'Tutup',
    tryAgain: 'Cuba Lagi',
    loading: 'Memuatkan…',
    estimate: 'Anggaran',
    sources: 'Sumber',
    hours: (n) => `${n} jam`,
    weeks: (n) => `${n} minggu`,
    languageShort: 'BM',
    languageLabel: 'Bahasa: Bahasa Melayu. Tukar Bahasa',
    sgf: {
      name: 'SkillsFuture Singapura',
      equivalent: 'Setara di Singapura',
      more: (n) => `+${n} lagi`,
      level: (n) => `Tahap ${n} daripada 6`,
      emerging: 'Baharu Muncul di Singapura',
      matched: 'Dipadankan oleh AI daripada Rangka Kerja Kemahiran Singapura; belum disemak oleh manusia.'
    }
  },
  {
    verdicts: {
      Rising: '上升',
      Steady: '稳定',
      Declining: '下降',
      Split: '分歧',
      Unknown: '未知'
    },
    verdictMeanings: {
      Rising: '值得培养：这项工作的 AI 使用正在上升且主要是辅助人，或招聘广告需求在增长。',
      Steady: '预计变化不大：AI 使用没有快速上升，招聘广告需求持平。',
      Declining: '价值在下降：AI 开始承担这项工作，或招聘广告需求在减少。',
      Split: '两种 AI 未来结论不同：AI 采用较慢与较快会给出不同判断。',
      Unknown: '带日期的数据还不够，暂时无法判断。'
    },
    scenarios: { slow: 'AI 采用较慢', fast: 'AI 采用较快' },
    nav: {
      home: '首页',
      checkUp: '检测',
      radar: '雷达',
      roles: '职位',
      roadmap: '路线图',
      space: '空间',
      connect: '连接你的 AI',
      settings: '设置'
    },
    steps: { start: '开始', questions: '问题', radar: '雷达', roles: '职位', plan: '计划' },
    askKopi: '问 Kopi',
    untranslated: '尚未完全翻译',
    untranslatedNote: '这份工作的部分内容仍是英文。',
    guest: '访客',
    back: '返回',
    next: '下一步',
    continue: '继续',
    cancel: '取消',
    close: '关闭',
    tryAgain: '重试',
    loading: '加载中…',
    estimate: '估算',
    sources: '来源',
    hours: (n) => `${n} 小时`,
    weeks: (n) => `${n} 周`,
    languageShort: '中文',
    languageLabel: '语言：中文。切换语言',
    sgf: {
      name: '新加坡 SkillsFuture',
      equivalent: '新加坡对应职位',
      more: (n) => `另 ${n} 个`,
      level: (n) => `第 ${n} 级（共 6 级）`,
      emerging: '新加坡新兴技能',
      matched: '由 AI 根据新加坡技能框架匹配，尚未经人工核对。'
    }
  }
)
