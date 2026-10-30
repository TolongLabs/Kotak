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
    languageLabel: 'Language: English. Change Language'
  },
  {
    verdicts: {
      Rising: 'Meningkat',
      Steady: 'Stabil',
      Declining: 'Menurun',
      Split: 'Berbelah Bahagi',
      Unknown: 'Belum Diketahui'
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
    languageLabel: 'Bahasa: Bahasa Melayu. Tukar Bahasa'
  },
  {
    verdicts: {
      Rising: '上升',
      Steady: '稳定',
      Declining: '下降',
      Split: '分歧',
      Unknown: '未知'
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
    languageLabel: '语言：中文。切换语言'
  }
)
