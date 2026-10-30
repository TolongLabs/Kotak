import { defineText } from '../text'

export const shellText = defineText(
  {
    app: { skipToContent: 'Skip to Content' },
    navigation: {
      main: 'Main',
      menu: 'Menu',
      openMenu: 'Open Menu',
      closeMenu: 'Close Menu',
      appearance: 'Appearance',
      brandHome: 'Kotak Home',
      expandSidebar: 'Expand Sidebar',
      collapseSidebar: 'Collapse Sidebar',
      guestNote: 'Your check-up stays on this device.',
      guestTooltip: (note: string) => `Guest: ${note}`,
      signOut: 'Sign Out'
    },
    askKopi: {
      close: 'Close Ask Kopi',
      yourCheckup: 'Your check-up',
      noCheckupYet: 'No check-up yet',
      introWithCheckup:
        'Ask me about your check-up, or try a what-if. I run Kotak’s own tools, so the data decides, not me.',
      introWithoutCheckup:
        'You haven’t done a check-up yet. It takes about 3 minutes, then I can answer about your own job. I can still answer general questions about Kotak’s data.',
      startCheckup: 'Start Your Check-Up',
      tryAsking: 'Try Asking',
      thinking: 'Kopi is thinking…',
      unavailableTitle: 'Kopi Can’t Chat Right Now',
      unavailableWithCheckup: 'Your Radar and Roadmap still work, with every verdict and date.',
      unavailableWithoutCheckup: 'The check-up still works, and it takes about 3 minutes.',
      openRadar: 'Open Radar',
      openRoadmap: 'Open Roadmap',
      errorTitle: 'Kopi Couldn’t Answer',
      errorBody: 'Something went wrong on the way. Try again.',
      questionLabel: 'Your Question',
      placeholderWithCheckup: 'Ask about your check-up',
      placeholderWithoutCheckup: 'Ask about Kotak’s data',
      inputHint: 'Enter sends. Shift and Enter start a new line.',
      send: 'Send',
      youAsked: 'You asked: ',
      toolsRan: 'Tools Kopi Ran',
      noTools: 'Kopi ran no Kotak tools for this reply.',
      aiDrafted:
        'AI-drafted: Kopi wrote this with Claude from the tools above. Fixed rules set every verdict and number.',
      thinkingAnnouncement: 'Kopi is thinking.',
      unavailableAnnouncement: 'Kopi can’t chat right now.',
      errorAnnouncement: 'Kopi couldn’t answer. Try again.',
      replyAnnouncement: (reply: string) => `Kopi says: ${reply}`,
      suggestions: {
        risingSkills: 'Which rising skills do Malaysian workers lack most?',
        dataSource: 'Where does Kotak’s data come from?',
        studyHours: 'What if I study 6 hours a week?',
        decliningSkills: 'Which of my skills are Declining, and why?',
        targetRole: 'How far am I from my target role?',
        dataChange: 'What changed between the April and May data?'
      }
    },
    topbar: {
      data: (snapshot: string) => `Data ${snapshot}`,
      aiDraftedSkills: ', AI-drafted skills',
      aboutThisData: 'About This Data',
      snapshot: 'Snapshot',
      skills: 'Skills',
      skillsUnavailable: 'Kotak couldn’t load how this job’s skills were made.',
      draftedSkills: (titles: string, multiple: boolean) =>
        `${titles}: Kopi drafted these skills from ${multiple ? 'each job’s' : 'the job’s'} O*NET tasks. The team has not checked them by hand yet.`,
      checkedSkills: (titles: string) => `${titles}: checked by hand by the Kotak team.`,
      searchJobs: 'Search Jobs',
      searchJobsPlaceholder: 'Search 900 Jobs',
      jobSuggestions: 'Job Suggestions',
      noMatchYet: 'No match yet'
    },
    settings: {
      description: 'Manage your saved guest data and preferences on this device.',
      resetTitle: 'Reset All Data',
      resetDescription: 'Clear your guest session and every Kotak preference saved in this browser.',
      confirmResetLabel: 'Confirm Reset All',
      confirmReset: 'Reset all Kotak data on this device? This action cannot be undone.',
      resetAll: 'Reset All',
      language: 'Language',
      languageButtons: { english: 'English', malay: 'Bahasa Malaysia', chinese: '中文' }
    },
    signIn: {
      benefits: [
        'Verdicts from public data, with every source shown',
        'A roadmap to 80% fit you can follow after work',
        'No account needed for the pilot'
      ],
      footer: 'SDC Hackathon 2026 · Domain 1 · Built in Malaysia',
      slogan: 'Open the Box on Your Job.',
      title: 'Sign In to Kotak',
      description: 'Accounts open after the pilot. For now, guest mode keeps your check-up on this device.',
      email: 'Email',
      emailHelper: 'Email sign-in opens after the pilot.',
      password: 'Password',
      signIn: 'Sign In',
      or: 'or',
      signInAsGuest: 'Sign In as Guest',
      guestNote: 'Your check-up stays on this device.',
      adminPrompt: 'Managing scraper data?',
      adminSignIn: 'Admin Sign In'
    },
    notFound: {
      title: 'Page Not Found',
      body: "This page isn't in the box.",
      goHome: 'Go to Home'
    },
    placeholder: { body: (issue: number) => `This screen is being built in issue #${issue}.` }
  },
  {
    app: { skipToContent: 'Langkau ke Kandungan' },
    navigation: {
      main: 'Utama',
      menu: 'Menu',
      openMenu: 'Buka Menu',
      closeMenu: 'Tutup Menu',
      appearance: 'Penampilan',
      brandHome: 'Laman Utama Kotak',
      expandSidebar: 'Kembangkan Bar Sisi',
      collapseSidebar: 'Runtuhkan Bar Sisi',
      guestNote: 'Semakan anda kekal pada peranti ini.',
      guestTooltip: (note) => `Tetamu: ${note}`,
      signOut: 'Log Keluar'
    },
    askKopi: {
      close: 'Tutup Tanya Kopi',
      yourCheckup: 'Semakan anda',
      noCheckupYet: 'Belum ada semakan',
      introWithCheckup:
        'Tanya saya tentang semakan anda atau cuba senario andaian. Saya gunakan alat Kotak sendiri; data menentukan jawapan, bukan saya.',
      introWithoutCheckup:
        'Anda belum membuat semakan. Prosesnya kira-kira 3 minit. Selepas itu, saya boleh menjawab tentang pekerjaan anda dan soalan umum tentang data Kotak.',
      startCheckup: 'Mulakan Semakan Anda',
      tryAsking: 'Cuba Tanya',
      thinking: 'Kopi sedang berfikir…',
      unavailableTitle: 'Kopi Tidak Dapat Berbual Sekarang',
      unavailableWithCheckup: 'Radar dan Peta Jalan anda masih berfungsi, termasuk semua verdict dan tarikh.',
      unavailableWithoutCheckup: 'Semakan masih berfungsi dan mengambil kira-kira 3 minit.',
      openRadar: 'Buka Radar',
      openRoadmap: 'Buka Peta Jalan',
      errorTitle: 'Kopi Tidak Dapat Menjawab',
      errorBody: 'Sesuatu telah berlaku. Cuba lagi.',
      questionLabel: 'Soalan Anda',
      placeholderWithCheckup: 'Tanya tentang semakan anda',
      placeholderWithoutCheckup: 'Tanya tentang data Kotak',
      inputHint: 'Enter untuk menghantar. Shift dan Enter untuk baris baharu.',
      send: 'Hantar',
      youAsked: 'Anda bertanya: ',
      toolsRan: 'Alat yang Digunakan Kopi',
      noTools: 'Kopi tidak menggunakan alat Kotak untuk jawapan ini.',
      aiDrafted:
        'Draf AI: Kopi menulis jawapan ini dengan Claude menggunakan alat di atas. Peraturan tetap menentukan setiap keputusan dan nombor.',
      thinkingAnnouncement: 'Kopi sedang berfikir.',
      unavailableAnnouncement: 'Kopi tidak dapat berbual sekarang.',
      errorAnnouncement: 'Kopi tidak dapat menjawab. Cuba lagi.',
      replyAnnouncement: (reply) => `Kopi berkata: ${reply}`,
      suggestions: {
        risingSkills: 'Kemahiran meningkat yang paling kurang dimiliki pekerja Malaysia?',
        dataSource: 'Dari manakah sumber data Kotak?',
        studyHours: 'Bagaimana jika saya belajar 6 jam seminggu?',
        decliningSkills: 'Kemahiran saya yang manakah Menurun, dan mengapa?',
        targetRole: 'Sejauh manakah saya daripada peranan sasaran?',
        dataChange: 'Apakah perubahan pada data April dan Mei?'
      }
    },
    topbar: {
      data: (snapshot) => `Data ${snapshot}`,
      aiDraftedSkills: ', kemahiran draf AI',
      aboutThisData: 'Tentang Data Ini',
      snapshot: 'Set Data',
      skills: 'Kemahiran',
      skillsUnavailable: 'Kotak tidak dapat memuatkan cara kemahiran pekerjaan ini disediakan.',
      draftedSkills: (titles, multiple) =>
        `${titles}: Kopi menyediakan draf kemahiran ini daripada tugas O*NET bagi ${multiple ? 'setiap pekerjaan' : 'pekerjaan ini'}. Pasukan belum menyemaknya secara manual.`,
      checkedSkills: (titles) => `${titles}: disemak secara manual oleh pasukan Kotak.`,
      searchJobs: 'Cari Pekerjaan',
      searchJobsPlaceholder: 'Cari 900 Pekerjaan',
      jobSuggestions: 'Cadangan Pekerjaan',
      noMatchYet: 'Belum ada padanan'
    },
    settings: {
      description: 'Urus data tetamu dan pilihan anda yang disimpan pada peranti ini.',
      resetTitle: 'Set Semula Semua Data',
      resetDescription: 'Kosongkan sesi tetamu dan semua pilihan Kotak yang disimpan dalam pelayar ini.',
      confirmResetLabel: 'Sahkan Set Semula Semua',
      confirmReset: 'Set semula semua data Kotak pada peranti ini? Tindakan ini tidak boleh dibuat asal.',
      resetAll: 'Set Semula Semua',
      language: 'Bahasa',
      languageButtons: { english: 'English', malay: 'Bahasa Malaysia', chinese: '中文' }
    },
    signIn: {
      benefits: [
        'Keputusan berdasarkan data awam, dengan setiap sumber dipaparkan',
        'Peta Jalan menuju Padanan 80% yang boleh anda ikuti selepas bekerja',
        'Tiada akaun diperlukan untuk program rintis'
      ],
      footer: 'SDC Hackathon 2026 · Domain 1 · Dibina di Malaysia',
      slogan: 'Buka Kotak Pekerjaan Anda.',
      title: 'Log Masuk ke Kotak',
      description:
        'Akaun dibuka selepas program rintis. Buat masa ini, mod tetamu menyimpan semakan anda pada peranti ini.',
      email: 'E-mel',
      emailHelper: 'Log masuk melalui e-mel dibuka selepas program rintis.',
      password: 'Kata Laluan',
      signIn: 'Log Masuk',
      or: 'atau',
      signInAsGuest: 'Log Masuk sebagai Tetamu',
      guestNote: 'Semakan anda kekal pada peranti ini.',
      adminPrompt: 'Mengurus data pengikisan?',
      adminSignIn: 'Log Masuk Pentadbir'
    },
    notFound: {
      title: 'Halaman Tidak Ditemui',
      body: 'Halaman ini tiada dalam Kotak.',
      goHome: 'Pergi ke Laman Utama'
    },
    placeholder: { body: (issue) => `Skrin ini sedang dibina dalam isu #${issue}.` }
  },
  {
    app: { skipToContent: '跳到正文' },
    navigation: {
      main: '主导航',
      menu: '菜单',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
      appearance: '外观',
      brandHome: 'Kotak 首页',
      expandSidebar: '展开侧边栏',
      collapseSidebar: '收起侧边栏',
      guestNote: '你的检测保存在这台设备上。',
      guestTooltip: (note) => `访客：${note}`,
      signOut: '退出登录'
    },
    askKopi: {
      close: '关闭问 Kopi',
      yourCheckup: '你的检测',
      noCheckupYet: '尚未进行检测',
      introWithCheckup: '可以问我关于检测的问题，也可以试试假设情境。我会使用 Kotak 自己的工具，由数据来决定答案。',
      introWithoutCheckup:
        '你还没有做检测。整个过程大约需要 3 分钟，之后我就能回答关于你工作的具体问题。我也可以回答有关 Kotak 数据的一般问题。',
      startCheckup: '开始你的检测',
      tryAsking: '试着问问',
      thinking: 'Kopi 正在思考…',
      unavailableTitle: 'Kopi 暂时无法聊天',
      unavailableWithCheckup: '你的雷达和路线图仍可使用，所有结论和日期也都在。',
      unavailableWithoutCheckup: '检测仍可使用，大约需要 3 分钟。',
      openRadar: '打开雷达',
      openRoadmap: '打开路线图',
      errorTitle: 'Kopi 无法回答',
      errorBody: '过程中出了点问题。请重试。',
      questionLabel: '你的问题',
      placeholderWithCheckup: '询问关于检测的问题',
      placeholderWithoutCheckup: '询问关于 Kotak 数据的问题',
      inputHint: '按 Enter 发送。按 Shift 和 Enter 换行。',
      send: '发送',
      youAsked: '你问了：',
      toolsRan: 'Kopi 使用的工具',
      noTools: 'Kopi 这次回答没有使用 Kotak 工具。',
      aiDrafted: 'AI 草拟：Kopi 根据上面的工具结果与 Claude 一起写下这段回答。每个结论和数字都由固定规则决定。',
      thinkingAnnouncement: 'Kopi 正在思考。',
      unavailableAnnouncement: 'Kopi 暂时无法聊天。',
      errorAnnouncement: 'Kopi 无法回答。请重试。',
      replyAnnouncement: (reply) => `Kopi 说：${reply}`,
      suggestions: {
        risingSkills: '马来西亚员工最缺乏哪些上升技能？',
        dataSource: 'Kotak 的数据来自哪里？',
        studyHours: '如果我每周学习 6 小时，会怎样？',
        decliningSkills: '我的哪些技能正在下降？为什么？',
        targetRole: '我离目标职位还有多远？',
        dataChange: '4 月和 5 月的数据有哪些变化？'
      }
    },
    topbar: {
      data: (snapshot) => `数据 ${snapshot}`,
      aiDraftedSkills: '，AI 草拟的技能',
      aboutThisData: '关于这些数据',
      snapshot: '数据快照',
      skills: '技能',
      skillsUnavailable: 'Kotak 无法加载这份工作的技能生成方式。',
      draftedSkills: (titles, multiple) =>
        `${titles}：Kopi 根据${multiple ? '每个职位' : '该职位'}的 O*NET 工作任务草拟了这些技能。Kotak 团队尚未逐项核实。`,
      checkedSkills: (titles) => `${titles}：由 Kotak 团队人工核实。`,
      searchJobs: '搜索工作',
      searchJobsPlaceholder: '搜索 900 份工作',
      jobSuggestions: '工作建议',
      noMatchYet: '暂时没有匹配项'
    },
    settings: {
      description: '管理保存在这台设备上的访客数据和偏好设置。',
      resetTitle: '重置所有数据',
      resetDescription: '清除访客会话和此浏览器中保存的所有 Kotak 偏好设置。',
      confirmResetLabel: '确认全部重置',
      confirmReset: '要清除这台设备上的所有 Kotak 数据吗？此操作无法撤销。',
      resetAll: '全部重置',
      language: '语言',
      languageButtons: { english: 'English', malay: 'Bahasa Malaysia', chinese: '中文' }
    },
    signIn: {
      benefits: ['结论来自公开数据，并列出所有来源', '下班后也能跟进的 80% 匹配度路线图', '试点期间无需账户'],
      footer: 'SDC Hackathon 2026 · Domain 1 · 于马来西亚开发',
      slogan: '打开你的工作之盒。',
      title: '登录 Kotak',
      description: '试点结束后开放账户。目前，访客模式会将你的检测保存在这台设备上。',
      email: '电子邮件',
      emailHelper: '试点结束后开放电子邮件登录。',
      password: '密码',
      signIn: '登录',
      or: '或',
      signInAsGuest: '以访客身份登录',
      guestNote: '你的检测保存在这台设备上。',
      adminPrompt: '要管理抓取器数据吗？',
      adminSignIn: '管理员登录'
    },
    notFound: {
      title: '找不到页面',
      body: '这个页面不在盒子里。',
      goHome: '返回首页'
    },
    placeholder: { body: (issue) => `此页面正在问题 #${issue} 中开发。` }
  }
)
