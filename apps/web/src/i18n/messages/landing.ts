import { defineText } from '../text'

export const landingText = defineText(
  {
    nav: {
      mainNav: 'Main Navigation',
      kotakHome: 'Kotak Home',
      howItWorks: 'How It Works',
      dataSources: 'Data Sources',
      signIn: 'Sign In',
      openNav: 'Open Navigation',
      closeNav: 'Close Navigation'
    },
    hero: {
      idleSpeech: 'Choose a job to open your check-up.',
      chooseAJob: 'Choose A Job',
      loadingSpeech: 'Kopi is opening the Web Developers example…',
      exampleErrorTitle: 'Example Not Available',
      exampleErrorBody: 'Kopi could not open the Web Developers check-up. Try again.',
      noCornersBody: 'This Web Developers bundle has no skill corners to display.',
      speech: (name: string, verdict: string) => `${name} is ${verdict}. Want to see why?`,
      speechFallback: 'Kopi will open the example check-up soon.',
      verdictSpeech: {
        rising: 'rising',
        steady: 'steady',
        declining: 'declining',
        split: 'split',
        unknown: 'unknown'
      },
      title: 'Open the Box on Your Job.',
      subtitle:
        'Kotak tracks how AI is changing Malaysian work, shows which of your skills are rising or fading, and builds a step-by-step plan to 80% fit. Every verdict cites its source.',
      start: 'Start',
      seeHowItWorks: 'See How It Works',
      neededBy2027: 'Needed by 2027',
      neededByMay2027: 'Needed by May 2027',
      radarScenario: {
        slow: 'slow',
        fast: 'fast'
      },
      radarAriaLabel: (scenario: string) => `Example radar values for the ${scenario} scenario`,
      cornerSummary: (name: string, you: number, needed: number, citations: string) =>
        `${name}: Example answer ${you}; estimated need about ${needed}. Sources ${citations}.`,
      scrollCue: 'Keep scrolling. Kopi is opening the box.'
    },
    exampleCard: {
      sourcesFor: (name: string) => `Sources for ${name}`,
      moreSources: (count: number) => `+${count} More Sources`,
      neededBy2027: 'Needed by 2027'
    },
    boxSection: {
      title: 'Every Skill Is in a Box.',
      note: 'Sample verdicts for three jobs, from Q2 2026 data.',
      lede: 'Kotak is Malay for box. Like Schrödinger’s cat, a skill is both rising and fading until someone checks the evidence. Kotak opens the box with dated public data.',
      movesTo: 'moves to',
      questions: [
        {
          role: 'Front-End Developer',
          title: 'Will Hand-Coded Layouts Still Pay?',
          body: 'Ads asking for them are falling, and AI now drafts most layouts.'
        },
        {
          role: 'Legal Executive',
          title: 'Is Contract Drafting Still Worth My Hours?',
          body: 'The sources disagree, so Kotak shows two plans instead of a guess.'
        },
        {
          role: 'Graphic Designer',
          title: 'Should I Learn to Direct AI Image Tools?',
          body: 'More design work now runs through AI tools, and clients still need a human eye.'
        }
      ]
    },
    howItWorks: {
      title: 'Three Minutes to Open Yours.',
      lede: 'No CV and no sign-up. Kopi asks, fixed rules decide, and you leave with a plan you can start this week.',
      stepPrefix: 'Step ',
      step1: {
        title: 'Answer 12 Questions',
        body: 'Kopi asks yes or no can-do questions about your job, out loud if you like.',
        dialogue: 'Have you reviewed AI-written code before merging it?'
      },
      step2: {
        title: 'See Where You Stand',
        body: 'Your skills against what your job needs by 2027, sorted into a Skills SWOT.',
        strengths: 'Strengths',
        weaknesses: 'Weaknesses',
        opportunities: 'Opportunities',
        threats: 'Threats',
        skillsCount: (n: number) => `${n} ${n === 1 ? 'Skill' : 'Skills'}`,
        rolesCount: (n: number) => `${n} ${n === 1 ? 'Role' : 'Roles'}`
      },
      step3: {
        title: 'Follow Your 12 Weeks',
        body: 'Free resources in order, sized to your hours, each tied to an SDG.',
        stepExample: {
          when: 'Weeks 1–4 · 2–29 Nov',
          skill: 'Reviewing AI-Written Code',
          title: 'Review AI-Written Pull Requests',
          description: 'Review three AI-written pull requests and fix what they get wrong.',
          gain: '+2 Levels · Reviewing AI-Written Code',
          resourceLabel: 'GitHub Skills: Review Pull Requests'
        }
      }
    },
    liveData: {
      title: 'When the Data Moves, Your Plan Moves.',
      lede: 'Every quarter brings new DOSM job-ad counts and AI use data. Kotak reruns the rules, then shows what changed and why. You see the radar shift and the roadmap reorder.',
      changes: [
        {
          source: 'New data · DOSM Q3 2026',
          skill: 'Testing',
          why: 'Job ads asking for testing rose 9% in Q3, and AI use in testing kept climbing.',
          effect: 'Your roadmap: “Write Tests for AI-Written Code” joined weeks 9–12.'
        },
        {
          source: 'New data · Economic Index, Aug 2026',
          skill: 'Design Systems',
          why: 'More design-system work now runs through AI tools, and demand held up.',
          effect: 'Design Systems Developer is now your top match at 74%.'
        }
      ]
    },
    sources: {
      title: 'Rules Decide. The AI Explains.',
      lede: 'Kotak reads dated public data, applies fixed rules, and only then asks Claude to put the result into two plain sentences with citations.',
      items: [
        {
          title: 'O*NET 30.1',
          description: 'What each job does, task by task',
          note: 'CC BY 4.0 · 2026'
        },
        {
          title: 'Anthropic Economic Index',
          description: 'How people use AI, by task and country',
          note: 'Apr and May 2026'
        },
        {
          title: 'DOSM Job Market Insights',
          description: 'Online job ads by occupation, every quarter',
          note: 'Q3 2019 to Q2 2026'
        },
        {
          title: 'MyCOL',
          description: 'Skills Malaysia is short of',
          note: 'Context only'
        },
        {
          title: 'Epoch AI',
          description: 'What AI systems can now do',
          note: 'Context only'
        }
      ],
      citedAriaLabel: 'Cited evidence figures',
      sourcePrefix: 'Source: ',
      stats: [
        {
          title: 'Skill-Related Underemployment',
          description:
            'of employed tertiary-educated 15–24-year-olds worked in semi-skilled or low-skilled jobs in Q2 2026.',
          source: 'OpenDOSM SRU By Age',
          date: 'Q2 2026 · Updated 11 August 2026'
        },
        {
          title: 'ICT Graduate Employment',
          description: 'of ICT graduates in the labour force were employed: 15,767 of 17,043 in the 2025 tracer study.',
          source: 'MOHE Graduate Tracer Study',
          date: '2025 Cohort · Published 14 May 2026'
        },
        {
          title: 'Employers Assess AI Knowledge',
          description: 'of Malaysian businesses evaluate candidates’ AI knowledge, according to the report.',
          source: 'JobStreet Hiring Report',
          date: 'Published 23 April 2025'
        }
      ]
    },
    startAndFaq: {
      title: 'Open the Box in Three Minutes.',
      lede: 'No account needed for the pilot. Your check-up stays on your device.',
      signInGuest: 'Sign In as Guest',
      faq: {
        verdicts: {
          question: 'Where Do the Verdicts Come From?',
          answer:
            'From fixed rules over dated public data: O*NET tasks, the Anthropic Economic Index and DOSM job-ad counts. The AI only explains the result.'
        },
        ai: {
          question: 'Is the AI Making Things Up?',
          answer:
            'Fixed rules set each verdict from dated source data. The AI only explains the result in plain language with citations.'
        },
        privacy: {
          question: 'What Do You Store About Me?',
          answer: 'Your check-up stays on your device. No account or personal details are needed for the pilot.'
        },
        cat: {
          question: 'Why a Cat?',
          answer: 'Kopi opens the box with you, one question and one verdict at a time.'
        },
        free: {
          question: 'Is It Free?',
          answer: 'The pilot check-up and your plan are free.'
        }
      }
    },
    footer: {
      greeting: 'Selamat petang from Kuala Lumpur.',
      productNav: 'Product',
      productHeading: 'Product',
      howItWorks: 'How It Works',
      dataSources: 'Data Sources',
      signIn: 'Sign In',
      projectHeading: 'Project',
      opensInNewTab: '(opens in a new tab)',
      creditsHeading: 'Credits',
      creditsLive2d:
        'Kopi: Live2D sample model Hijiki. This content uses sample data owned and copyrighted by Live2D Inc. The sample data are utilized in accordance with terms and conditions set by Live2D Inc. This content itself is created at the author’s sole discretion.',
      creditsIcons: 'Icons: Lucide (ISC)',
      creditsData: 'Data: O*NET, OpenDOSM (CC BY 4.0)',
      backToTop: 'Back to Top'
    }
  },
  {
    nav: {
      mainNav: 'Navigasi Utama',
      kotakHome: 'Laman Utama Kotak',
      howItWorks: 'Cara Ia Berfungsi',
      dataSources: 'Sumber Data',
      signIn: 'Log Masuk',
      openNav: 'Buka Navigasi',
      closeNav: 'Tutup Navigasi'
    },
    hero: {
      idleSpeech: 'Pilih pekerjaan untuk membuka semakan anda.',
      chooseAJob: 'Pilih Satu Pekerjaan',
      loadingSpeech: 'Kopi sedang membuka contoh Web Developers…',
      exampleErrorTitle: 'Contoh Tidak Tersedia',
      exampleErrorBody: 'Kopi tidak dapat membuka semakan Web Developers. Cuba lagi.',
      noCornersBody: 'Pakej Web Developers ini tidak mempunyai sudut kemahiran untuk dipaparkan.',
      speech: (name, verdict) => `${name} berstatus ${verdict}. Ingin tahu sebabnya?`,
      speechFallback: 'Kopi akan membuka semakan contoh tidak lama lagi.',
      verdictSpeech: {
        rising: 'meningkat',
        steady: 'stabil',
        declining: 'menurun',
        split: 'berbelah bahagi',
        unknown: 'belum diketahui'
      },
      title: 'Buka Kotak bagi Pekerjaan Anda.',
      subtitle:
        'Kotak menjejaki bagaimana AI mengubah pekerjaan di Malaysia, menunjukkan kemahiran anda yang meningkat atau menurun, dan membina pelan langkah demi langkah ke arah padanan 80%. Setiap keputusan memetik sumbernya.',
      start: 'Mula',
      seeHowItWorks: 'Lihat Cara Ia Berfungsi',
      neededBy2027: 'Diperlukan menjelang 2027',
      neededByMay2027: 'Diperlukan menjelang Mei 2027',
      radarScenario: {
        slow: 'perlahan',
        fast: 'pantas'
      },
      radarAriaLabel: (scenario) => `Nilai radar contoh untuk senario ${scenario}`,
      cornerSummary: (name, you, needed, citations) =>
        `${name}: Jawapan contoh ${you}; anggaran keperluan sekitar ${needed}. Sumber ${citations}.`,
      scrollCue: 'Teruskan menatal. Kopi sedang membuka kotak.'
    },
    exampleCard: {
      sourcesFor: (name) => `Sumber untuk ${name}`,
      moreSources: (count) => `+${count} Sumber Lagi`,
      neededBy2027: 'Diperlukan menjelang 2027'
    },
    boxSection: {
      title: 'Setiap Kemahiran Berada di dalam Kotak.',
      note: 'Contoh keputusan untuk tiga pekerjaan, daripada data Q2 2026.',
      lede: 'Kotak bermaksud bekas atau peti. Seperti kucing Schrödinger, kemahiran serentak meningkat dan menurun sehinggalah bukti disemak. Kotak membukanya dengan data awam bertarikh.',
      movesTo: 'beralih kepada',
      questions: [
        {
          role: 'Front-End Developer',
          title: 'Adakah Susun Atur Pengekodan Tangan Masih Berbaloi?',
          body: 'Iklan kerja yang memintanya semakin berkurangan, dan AI kini merangka kebanyakan susun atur.'
        },
        {
          role: 'Legal Executive',
          title: 'Adakah Penggubalan Kontrak Masih Berbaloi dengan Masa Saya?',
          body: 'Sumber-sumber tidak sepakat, jadi Kotak menunjukkan dua pelan dan bukannya tekaan.'
        },
        {
          role: 'Graphic Designer',
          title: 'Patutkah Saya Belajar Mengarah Alatan Imej AI?',
          body: 'Lebih banyak kerja reka bentuk kini menggunakan alatan AI, dan pelanggan masih memerlukan sentuhan manusia.'
        }
      ]
    },
    howItWorks: {
      title: 'Tiga Minit untuk Membuka Milik Anda.',
      lede: 'Tanpa CV dan tanpa pendaftaran. Kopi bertanya, peraturan tetap menentukan, dan anda mendapat pelan yang boleh dimulakan minggu ini.',
      stepPrefix: 'Langkah ',
      step1: {
        title: 'Jawab 12 Soalan',
        body: 'Kopi bertanya soalan ya atau tidak tentang keupayaan kerja anda, secara bersuara jika anda mahu.',
        dialogue: 'Pernahkah anda menyemak kod tulisan AI sebelum menggabungkannya?'
      },
      step2: {
        title: 'Lihat Kedudukan Anda',
        body: 'Kemahiran anda berbanding keperluan pekerjaan anda menjelang 2027, disusun dalam SWOT Kemahiran.',
        strengths: 'Kekuatan',
        weaknesses: 'Kelemahan',
        opportunities: 'Peluang',
        threats: 'Ancaman',
        skillsCount: (n) => `${n} Kemahiran`,
        rolesCount: (n) => `${n} Peranan`
      },
      step3: {
        title: 'Ikuti 12 Minggu Anda',
        body: 'Sumber percuma mengikut urutan, disesuaikan dengan masa anda, setiap satunya terikat dengan SDG.',
        stepExample: {
          when: 'Minggu 1–4 · 2–29 Nov',
          skill: 'Menyemak Kod Tulisan AI',
          title: 'Semak Pull Request Tulisan AI',
          description: 'Semak tiga pull request tulisan AI dan betulkan kesilapannya.',
          gain: '+2 Tahap · Menyemak Kod Tulisan AI',
          resourceLabel: 'GitHub Skills: Review Pull Requests'
        }
      }
    },
    liveData: {
      title: 'Apabila Data Berubah, Pelan Anda Turut Bergerak.',
      lede: 'Setiap suku tahun membawa data baharu iklan kerja DOSM dan penggunaan AI. Kotak menjalankan semula peraturannya, kemudian memaparkan apa yang berubah dan sebabnya. Anda dapat melihat peralihan radar dan susunan semula peta jalan.',
      changes: [
        {
          source: 'Data baharu · DOSM Q3 2026',
          skill: 'Pengujian',
          why: 'Iklan kerja yang meminta kemahiran pengujian meningkat 9% pada Q3, dan penggunaan AI dalam pengujian terus meningkat.',
          effect: 'Peta jalan anda: “Tulis Ujian untuk Kod Tulisan AI” ditambah pada minggu 9–12.'
        },
        {
          source: 'Data baharu · Economic Index, Ogos 2026',
          skill: 'Sistem Reka Bentuk',
          why: 'Lebih banyak kerja sistem reka bentuk kini menggunakan alatan AI, dan permintaan kekal kukuh.',
          effect: 'Design Systems Developer kini merupakan padanan teratas anda pada 74%.'
        }
      ]
    },
    sources: {
      title: 'Peraturan Menentukan. AI Menjelaskan.',
      lede: 'Kotak membaca data awam bertarikh, menggunakan peraturan tetap, dan hanya selepas itu meminta Claude menyatakan hasilnya dalam dua ayat mudah berserta petikan sumber.',
      items: [
        {
          title: 'O*NET 30.1',
          description: 'Tugasan bagi setiap pekerjaan, langkah demi langkah',
          note: 'CC BY 4.0 · 2026'
        },
        {
          title: 'Anthropic Economic Index',
          description: 'Bagaimana orang ramai menggunakan AI, mengikut tugasan dan negara',
          note: 'Apr dan Mei 2026'
        },
        {
          title: 'DOSM Job Market Insights',
          description: 'Iklan kerja dalam talian mengikut pekerjaan, setiap suku tahun',
          note: 'Q3 2019 hingga Q2 2026'
        },
        {
          title: 'MyCOL',
          description: 'Kemahiran yang berkurangan di Malaysia',
          note: 'Konteks sahaja'
        },
        {
          title: 'Epoch AI',
          description: 'Keupayaan sistem AI pada masa kini',
          note: 'Konteks sahaja'
        }
      ],
      citedAriaLabel: 'Angka bukti yang dipetik',
      sourcePrefix: 'Sumber: ',
      stats: [
        {
          title: 'Guna Tenaga Tidak Penuh Berkaitan Kemahiran',
          description:
            'daripada golongan berpendidikan tinggi berusia 15–24 tahun yang bekerja berada dalam pekerjaan separa mahir atau berkemahiran rendah pada Q2 2026.',
          source: 'OpenDOSM SRU By Age',
          date: 'Q2 2026 · Dikemas kini 11 Ogos 2026'
        },
        {
          title: 'Kebolehpasaran Graduan ICT',
          description:
            'daripada graduan ICT dalam tenaga buruh telah bekerja: 15,767 daripada 17,043 dalam kajian pengesanan graduan 2025.',
          source: 'MOHE Graduate Tracer Study',
          date: 'Kohort 2025 · Diterbitkan 14 Mei 2026'
        },
        {
          title: 'Majikan Menilai Pengetahuan AI',
          description: 'perniagaan di Malaysia menilai pengetahuan AI calon, menurut laporan tersebut.',
          source: 'JobStreet Hiring Report',
          date: 'Diterbitkan 23 April 2025'
        }
      ]
    },
    startAndFaq: {
      title: 'Buka Kotak dalam Tiga Minit.',
      lede: 'Tiada akaun diperlukan untuk projek rintis. Semakan anda kekal pada peranti anda.',
      signInGuest: 'Log Masuk sebagai Tetamu',
      faq: {
        verdicts: {
          question: 'Dari Mana Datangnya Keputusan Ini?',
          answer:
            'Daripada peraturan tetap berasaskan data awam bertarikh: tugasan O*NET, Anthropic Economic Index dan bilangan iklan kerja DOSM. AI hanya menjelaskan hasilnya.'
        },
        ai: {
          question: 'Adakah AI Mereka-reka Maklumat?',
          answer:
            'Peraturan tetap menentukan setiap keputusan berdasarkan data sumber bertarikh. AI hanya menerangkan keputusan dalam bahasa mudah berserta petikan.'
        },
        privacy: {
          question: 'Apakah Maklumat Saya yang Anda Simpan?',
          answer:
            'Semakan anda kekal pada peranti anda. Tiada akaun atau butiran peribadi diperlukan untuk projek rintis ini.'
        },
        cat: {
          question: 'Mengapa Kucing?',
          answer: 'Kopi membuka kotak bersama anda, satu soalan dan satu keputusan pada satu-satu masa.'
        },
        free: {
          question: 'Adakah Ia Percuma?',
          answer: 'Semakan projek rintis dan pelan anda adalah percuma.'
        }
      }
    },
    footer: {
      greeting: 'Selamat petang dari Kuala Lumpur.',
      productNav: 'Produk',
      productHeading: 'Produk',
      howItWorks: 'Cara Ia Berfungsi',
      dataSources: 'Sumber Data',
      signIn: 'Log Masuk',
      projectHeading: 'Projek',
      opensInNewTab: '(dibuka dalam tab baharu)',
      creditsHeading: 'Kredit',
      creditsLive2d:
        'Kopi: Model sampel Live2D Hijiki. Kandungan ini menggunakan data sampel yang dimiliki dan berhak cipta Live2D Inc. Data sampel ini digunakan mengikut terma dan syarat yang ditetapkan oleh Live2D Inc. Kandungan ini dicipta atas budi bicara penulis sepenuhnya.',
      creditsIcons: 'Ikon: Lucide (ISC)',
      creditsData: 'Data: O*NET, OpenDOSM (CC BY 4.0)',
      backToTop: 'Kembali ke Atas'
    }
  },
  {
    nav: {
      mainNav: '主导航',
      kotakHome: 'Kotak 首页',
      howItWorks: '运作方式',
      dataSources: '数据来源',
      signIn: '登录',
      openNav: '打开导航',
      closeNav: '关闭导航'
    },
    hero: {
      idleSpeech: '选择一份工作以开启你的检测。',
      chooseAJob: '选择一份工作',
      loadingSpeech: 'Kopi 正在打开 Web Developers 示例…',
      exampleErrorTitle: '示例不可用',
      exampleErrorBody: 'Kopi 无法打开 Web Developers 检测。请重试。',
      noCornersBody: '此 Web Developers 数据包没有可显示的技能维度。',
      speech: (name, verdict) => `${name} 处于${verdict}状态。想看看原因吗？`,
      speechFallback: 'Kopi 很快就会打开示例检测。',
      verdictSpeech: {
        rising: '上升',
        steady: '稳定',
        declining: '下降',
        split: '分歧',
        unknown: '未知'
      },
      title: '开启你工作的盒子。',
      subtitle:
        'Kotak 追踪 AI 如何改变马来西亚的工作格局，揭示你哪些技能正在上升或下降，并为你制定达到 80% 匹配度的分步计划。每个结论均注明来源。',
      start: '开始',
      seeHowItWorks: '了解运作方式',
      neededBy2027: '2027 年所需',
      neededByMay2027: '2027 年 5 月所需',
      radarScenario: {
        slow: '较慢',
        fast: '较快'
      },
      radarAriaLabel: (scenario) => `${scenario} 场景的示例雷达数值`,
      cornerSummary: (name, you, needed, citations) =>
        `${name}：示例回答 ${you}；预计需求约 ${needed}。来源 ${citations}。`,
      scrollCue: '继续向下滚动。Kopi 正在打开盒子。'
    },
    exampleCard: {
      sourcesFor: (name) => `${name} 的来源`,
      moreSources: (count) => `+${count} 个更多来源`,
      neededBy2027: '2027 年所需'
    },
    boxSection: {
      title: '每项技能都在盒子里。',
      note: '三份工作的示例结论，基于 Q2 2026 数据。',
      lede: 'Kotak 在马来语中是“盒子”的意思。就像薛定谔的猫一样，在有人核实证据之前，一项技能既在上升也在下降。Kotak 用带日期的公开数据打开这个盒子。',
      movesTo: '转为',
      questions: [
        {
          role: 'Front-End Developer',
          title: '手写布局代码还能带来合理回报吗？',
          body: '相关招聘广告正在减少，且 AI 现已能起草大多数布局。'
        },
        {
          role: 'Legal Executive',
          title: '起草合同还值得投入时间吗？',
          body: '各方来源存在分歧，因此 Kotak 提供两套计划而非盲目猜测。'
        },
        {
          role: 'Graphic Designer',
          title: '我应该学习指导 AI 图像工具吗？',
          body: '更多设计工作现通过 AI 工具进行，而客户仍然需要专业的人工审美把关。'
        }
      ]
    },
    howItWorks: {
      title: '三分钟开启你的专属盒子。',
      lede: '无需简历，无需注册。Kopi 提问，固定规则裁定，你将带着本周即可启动的计划离开。',
      stepPrefix: '步骤 ',
      step1: {
        title: '回答 12 个问题',
        body: 'Kopi 会就你的工作能力提出“是”或“否”的问题，如果你愿意，它还可以读出声音。',
        dialogue: '在合并之前，你是否审核过 AI 编写的代码？'
      },
      step2: {
        title: '了解你所处的位置',
        body: '对照 2027 年你工作所需，评估你的技能，并整理为技能 SWOT 分析。',
        strengths: '优势',
        weaknesses: '劣势',
        opportunities: '机会',
        threats: '威胁',
        skillsCount: (n) => `${n} 项技能`,
        rolesCount: (n) => `${n} 个职位`
      },
      step3: {
        title: '开启你的 12 周进阶',
        body: '按序推荐免费资源，根据你的可用时间量身定制，每一项均与 SDG 挂钩。',
        stepExample: {
          when: '第 1–4 周 · 11月2日至29日',
          skill: '审核 AI 编写的代码',
          title: '审核 AI 编写的 Pull Request',
          description: '审核三个由 AI 编写的 pull request 并修复其中的错误。',
          gain: '+2 水平 · 审核 AI 编写的代码',
          resourceLabel: 'GitHub Skills: Review Pull Requests'
        }
      }
    },
    liveData: {
      title: '数据更新，计划随之而变。',
      lede: '每个季度都会引入新的 DOSM 招聘广告统计与 AI 使用数据。Kotak 会重新运行规则，向你展示变动内容与原因。你将直观看到雷达图的变动与路线图的重新排序。',
      changes: [
        {
          source: '新数据 · DOSM Q3 2026',
          skill: '测试',
          why: '要求测试技能的招聘广告在第 3 季度增加了 9%，且测试中的 AI 使用率持续攀升。',
          effect: '你的路线图：“为 AI 编写的代码编写测试”已加入第 9–12 周。'
        },
        {
          source: '新数据 · Economic Index，2026年8月',
          skill: '设计系统',
          why: '更多设计系统工作现通过 AI 工具进行，且需求保持坚挺。',
          effect: 'Design Systems Developer 现为你的最佳匹配职位，匹配度为 74%。'
        }
      ]
    },
    sources: {
      title: '规则裁定，AI 阐释。',
      lede: 'Kotak 读取带日期的公开数据，应用固定规则，在此之后才让 Claude 将结论浓缩为带有引用的两句通俗解释。',
      items: [
        {
          title: 'O*NET 30.1',
          description: '详述每项工作的具体任务',
          note: 'CC BY 4.0 · 2026'
        },
        {
          title: 'Anthropic Economic Index',
          description: '按任务和国家统计的 AI 使用方式',
          note: '2026年4月和5月'
        },
        {
          title: 'DOSM Job Market Insights',
          description: '按职业划分的每季度在线招聘广告',
          note: 'Q3 2019 至 Q2 2026'
        },
        {
          title: 'MyCOL',
          description: '马来西亚紧缺的技能',
          note: '仅供参考'
        },
        {
          title: 'Epoch AI',
          description: '当前 AI 系统的能力',
          note: '仅供参考'
        }
      ],
      citedAriaLabel: '引用的证据数据',
      sourcePrefix: '来源：',
      stats: [
        {
          title: '技能相关就业不足',
          description: '在已就业且受过高等教育的 15–24 岁年轻人中，有此比例在 2026 年第 2 季度从事半熟练或低技能工作。',
          source: 'OpenDOSM SRU By Age',
          date: 'Q2 2026 · 2026年8月11日更新'
        },
        {
          title: 'ICT 毕业生就业率',
          description: '处于劳动力大军中的 ICT 毕业生实现就业：在 2025 年毕业生追踪调查中达 15,767 / 17,043 人。',
          source: 'MOHE Graduate Tracer Study',
          date: '2025 届 · 2026年5月14日发布'
        },
        {
          title: '雇主评估 AI 知识',
          description: '的马来西亚企业会评估应聘者的 AI 知识（据该报告所述）。',
          source: 'JobStreet Hiring Report',
          date: '2025年4月23日发布'
        }
      ]
    },
    startAndFaq: {
      title: '三分钟开启盒子。',
      lede: '体验试点版无需账号。你的检测数据将保留在你的本地设备上。',
      signInGuest: '以访客身份登录',
      faq: {
        verdicts: {
          question: '这些结论从何而来？',
          answer:
            '源自基于带日期公开数据的固定规则：O*NET 任务、Anthropic Economic Index 以及 DOSM 招聘广告统计。AI 仅负责解释结果。'
        },
        ai: {
          question: 'AI 会胡编乱造吗？',
          answer: '固定规则根据带日期的源数据判定每项结论。AI 仅以通俗语言解释结果并附带引用。'
        },
        privacy: {
          question: '你们会存储关于我的什么信息？',
          answer: '你的检测数据仅保留在你的设备上。此试点项目无需账户或个人详细信息。'
        },
        cat: {
          question: '为什么是一只猫？',
          answer: 'Kopi 会陪伴你一同打开盒子，每次回答一个问题，揭晓一个结论。'
        },
        free: {
          question: '这是免费的吗？',
          answer: '试点检测与你的成长计划完全免费。'
        }
      }
    },
    footer: {
      greeting: '来自吉隆坡的问候。',
      productNav: '产品',
      productHeading: '产品',
      howItWorks: '运作方式',
      dataSources: '数据来源',
      signIn: '登录',
      projectHeading: '项目',
      opensInNewTab: '(在新标签页中打开)',
      creditsHeading: '鸣谢',
      creditsLive2d:
        'Kopi：Live2D 示例模型 Hijiki。本内容使用了 Live2D Inc. 拥有并享有著作权的示例数据。示例数据的使用遵循 Live2D Inc. 制定的条款和条件。本内容本身由作者全权自行制作。',
      creditsIcons: '图标：Lucide (ISC)',
      creditsData: '数据：O*NET, OpenDOSM (CC BY 4.0)',
      backToTop: '返回顶部'
    }
  }
)
