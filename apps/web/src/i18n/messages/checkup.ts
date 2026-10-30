import { defineText } from '../text'

const enInterests: Record<string, string> = {
  'build-with-hands': 'Fix or build things with my hands',
  'work-with-machines': 'Work outdoors or with machines and tools',
  'set-up-equipment': 'Set up computers, networks or equipment',
  'solve-puzzles': 'Solve puzzles and work out how things work',
  'analyse-data': 'Analyse data to find patterns',
  'research-deeply': 'Research a question in depth',
  'design-looks': 'Design how something looks or feels',
  'make-media': 'Write, draw, film or make music',
  'original-ideas': 'Come up with original ideas',
  'teach-explain': 'Teach or explain things to people',
  'help-problems': 'Help people with their problems',
  'care-wellbeing': 'Look after people’s health or wellbeing',
  'lead-team': 'Lead a team or a project',
  'persuade-sell': 'Persuade people or sell to them',
  'run-business': 'Start or run a business',
  'organise-records': 'Organise records, files or schedules',
  'check-details': 'Check details and catch mistakes',
  'work-numbers': 'Work with numbers, budgets or accounts'
}

const msInterests: Record<string, string> = {
  'build-with-hands': 'Membaiki atau membina sesuatu dengan tangan',
  'work-with-machines': 'Bekerja di luar atau menggunakan mesin dan alatan',
  'set-up-equipment': 'Memasang komputer, rangkaian atau peralatan',
  'solve-puzzles': 'Menyelesaikan teka-teki dan memahami cara sesuatu berfungsi',
  'analyse-data': 'Menganalisis data untuk mencari corak',
  'research-deeply': 'Mengkaji sesuatu persoalan secara mendalam',
  'design-looks': 'Mereka bentuk rupa atau rasa sesuatu',
  'make-media': 'Menulis, melukis, merakam video atau mencipta muzik',
  'original-ideas': 'Mencetuskan idea yang asli',
  'teach-explain': 'Mengajar atau menerangkan sesuatu kepada orang lain',
  'help-problems': 'Membantu orang menyelesaikan masalah',
  'care-wellbeing': 'Menjaga kesihatan atau kesejahteraan orang lain',
  'lead-team': 'Memimpin pasukan atau projek',
  'persuade-sell': 'Memujuk orang atau menjual kepada mereka',
  'run-business': 'Memulakan atau mengurus perniagaan',
  'organise-records': 'Menyusun rekod, fail atau jadual',
  'check-details': 'Menyemak butiran dan mengesan kesilapan',
  'work-numbers': 'Mengendalikan nombor, belanjawan atau akaun'
}

const zhInterests: Record<string, string> = {
  'build-with-hands': '亲手修理或制作东西',
  'work-with-machines': '在户外工作，或操作机器和工具',
  'set-up-equipment': '安装电脑、网络或设备',
  'solve-puzzles': '解谜并弄清事物的运作方式',
  'analyse-data': '分析数据，找出规律',
  'research-deeply': '深入研究一个问题',
  'design-looks': '设计事物的外观或体验',
  'make-media': '写作、绘画、拍摄或创作音乐',
  'original-ideas': '提出新颖的想法',
  'teach-explain': '教别人或向别人解释事情',
  'help-problems': '帮助别人解决问题',
  'care-wellbeing': '照顾别人的健康或身心状况',
  'lead-team': '带领团队或项目',
  'persuade-sell': '说服别人或向他们销售',
  'run-business': '创办或经营企业',
  'organise-records': '整理记录、文件或日程',
  'check-details': '检查细节并找出错误',
  'work-numbers': '处理数字、预算或账目'
}

const enStudyFields: Record<string, string> = {
  'computer-science': 'Computer Science and IT',
  'software-engineering': 'Software Engineering',
  cybersecurity: 'Cybersecurity',
  'data-science': 'Data Science and Analytics',
  'electrical-engineering': 'Electrical and Electronic Engineering',
  'mechanical-engineering': 'Mechanical Engineering',
  'mechatronics-engineering': 'Mechatronics Engineering',
  'civil-engineering': 'Civil Engineering',
  'chemical-engineering': 'Chemical Engineering',
  'petroleum-engineering': 'Petroleum Engineering',
  'manufacturing-engineering': 'Manufacturing Engineering',
  architecture: 'Architecture',
  'quantity-surveying': 'Quantity Surveying',
  'estate-management': 'Estate Management',
  medicine: 'Medicine',
  dentistry: 'Dentistry',
  pharmacy: 'Pharmacy',
  nursing: 'Nursing',
  'biomedical-science': 'Biomedical Science',
  physiotherapy: 'Physiotherapy and Rehabilitation',
  'occupational-therapy': 'Occupational Therapy',
  'occupational-safety-health': 'Occupational Safety and Health',
  accounting: 'Accounting',
  finance: 'Finance and Banking',
  'business-administration': 'Business Administration',
  marketing: 'Marketing',
  'actuarial-science': 'Actuarial Science',
  'human-resource-management': 'Human Resource Management',
  logistics: 'Logistics and Supply Chain',
  law: 'Law',
  'linguistics-languages': 'Linguistics and Languages',
  'english-language-literature': 'English Language and Literature',
  'islamic-studies': 'Islamic Studies',
  'mass-communication': 'Mass Communication',
  psychology: 'Psychology',
  economics: 'Economics',
  'political-science': 'Politics and International Relations',
  'social-work': 'Social Work and Sociology',
  'public-administration': 'Public Administration',
  counselling: 'Counselling',
  mathematics: 'Mathematics and Statistics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  biotechnology: 'Biotechnology',
  education: 'Education and Teaching',
  tesl: 'TESL and English Teaching',
  'early-childhood-education': 'Early Childhood Education',
  'graphic-design': 'Graphic Design',
  'creative-multimedia': 'Creative Multimedia',
  'fashion-design': 'Fashion Design',
  'hospitality-tourism': 'Hospitality and Tourism',
  'culinary-arts': 'Culinary Arts',
  agriculture: 'Agriculture and Plantation',
  'food-science': 'Food Science and Technology',
  'environmental-science': 'Environmental Science',
  other: 'Other'
}

const msStudyFields: Record<string, string> = {
  'computer-science': 'Sains Komputer dan Teknologi Maklumat',
  'software-engineering': 'Kejuruteraan Perisian',
  cybersecurity: 'Keselamatan Siber',
  'data-science': 'Sains Data dan Analitik',
  'electrical-engineering': 'Kejuruteraan Elektrik dan Elektronik',
  'mechanical-engineering': 'Kejuruteraan Mekanikal',
  'mechatronics-engineering': 'Kejuruteraan Mekatronik',
  'civil-engineering': 'Kejuruteraan Awam',
  'chemical-engineering': 'Kejuruteraan Kimia',
  'petroleum-engineering': 'Kejuruteraan Petroleum',
  'manufacturing-engineering': 'Kejuruteraan Pembuatan',
  architecture: 'Seni Bina',
  'quantity-surveying': 'Ukur Bahan',
  'estate-management': 'Pengurusan Harta Tanah',
  medicine: 'Perubatan',
  dentistry: 'Pergigian',
  pharmacy: 'Farmasi',
  nursing: 'Kejururawatan',
  'biomedical-science': 'Sains Bioperubatan',
  physiotherapy: 'Fisioterapi dan Pemulihan',
  'occupational-therapy': 'Terapi Cara Kerja',
  'occupational-safety-health': 'Keselamatan dan Kesihatan Pekerjaan',
  accounting: 'Perakaunan',
  finance: 'Kewangan dan Perbankan',
  'business-administration': 'Pentadbiran Perniagaan',
  marketing: 'Pemasaran',
  'actuarial-science': 'Sains Aktuari',
  'human-resource-management': 'Pengurusan Sumber Manusia',
  logistics: 'Logistik dan Rantaian Bekalan',
  law: 'Undang-undang',
  'linguistics-languages': 'Linguistik dan Bahasa',
  'english-language-literature': 'Bahasa dan Kesusasteraan Inggeris',
  'islamic-studies': 'Pengajian Islam',
  'mass-communication': 'Komunikasi Massa',
  psychology: 'Psikologi',
  economics: 'Ekonomi',
  'political-science': 'Sains Politik dan Hubungan Antarabangsa',
  'social-work': 'Kerja Sosial dan Sosiologi',
  'public-administration': 'Pentadbiran Awam',
  counselling: 'Kaunseling',
  mathematics: 'Matematik dan Statistik',
  chemistry: 'Kimia',
  biology: 'Biologi',
  biotechnology: 'Bioteknologi',
  education: 'Pendidikan dan Pengajaran',
  tesl: 'TESL dan Pengajaran Bahasa Inggeris',
  'early-childhood-education': 'Pendidikan Awal Kanak-kanak',
  'graphic-design': 'Reka Bentuk Grafik',
  'creative-multimedia': 'Multimedia Kreatif',
  'fashion-design': 'Reka Bentuk Fesyen',
  'hospitality-tourism': 'Hospitaliti dan Pelancongan',
  'culinary-arts': 'Seni Kulinari',
  agriculture: 'Pertanian dan Perladangan',
  'food-science': 'Sains dan Teknologi Makanan',
  'environmental-science': 'Sains Alam Sekitar',
  other: 'Lain-lain'
}

const zhStudyFields: Record<string, string> = {
  'computer-science': '计算机科学与信息技术',
  'software-engineering': '软件工程',
  cybersecurity: '网络安全',
  'data-science': '数据科学与分析',
  'electrical-engineering': '电气与电子工程',
  'mechanical-engineering': '机械工程',
  'mechatronics-engineering': '机电工程',
  'civil-engineering': '土木工程',
  'chemical-engineering': '化学工程',
  'petroleum-engineering': '石油工程',
  'manufacturing-engineering': '制造工程',
  architecture: '建筑学',
  'quantity-surveying': '工程造价',
  'estate-management': '房地产管理',
  medicine: '医学',
  dentistry: '牙科',
  pharmacy: '药学',
  nursing: '护理学',
  'biomedical-science': '生物医学',
  physiotherapy: '物理治疗与康复',
  'occupational-therapy': '职业治疗',
  'occupational-safety-health': '职业安全与健康',
  accounting: '会计学',
  finance: '金融与银行',
  'business-administration': '工商管理',
  marketing: '市场营销',
  'actuarial-science': '精算学',
  'human-resource-management': '人力资源管理',
  logistics: '物流与供应链',
  law: '法律',
  'linguistics-languages': '语言学与语言',
  'english-language-literature': '英语语言与文学',
  'islamic-studies': '伊斯兰研究',
  'mass-communication': '大众传播',
  psychology: '心理学',
  economics: '经济学',
  'political-science': '政治学与国际关系',
  'social-work': '社会工作与社会学',
  'public-administration': '公共行政',
  counselling: '辅导学',
  mathematics: '数学与统计学',
  chemistry: '化学',
  biology: '生物学',
  biotechnology: '生物技术',
  education: '教育与教学',
  tesl: 'TESL 与英语教学',
  'early-childhood-education': '幼儿教育',
  'graphic-design': '平面设计',
  'creative-multimedia': '创意多媒体',
  'fashion-design': '时装设计',
  'hospitality-tourism': '酒店与旅游',
  'culinary-arts': '烹饪艺术',
  agriculture: '农业与种植业',
  'food-science': '食品科学与技术',
  'environmental-science': '环境科学',
  other: '其他'
}

type PathwayAreaText = { label: string; description: string }

const enAreas: Record<string, PathwayAreaText> = {
  'ai-and-data': {
    label: 'AI and Data',
    description: 'Building AI models, analysing data and running the databases behind them.'
  },
  cybersecurity: {
    label: 'Cybersecurity',
    description: 'Protecting systems and data, testing defences and investigating attacks.'
  },
  'cloud-and-infrastructure': {
    label: 'Cloud and Infrastructure',
    description: 'Running servers, networks, cloud platforms and data centres.'
  },
  'software-and-web': {
    label: 'Software and Web',
    description: 'Writing, testing and running software, apps and websites.'
  },
  'design-and-ux': {
    label: 'Design and UX',
    description: 'Designing screens, products, graphics and animation.'
  },
  'business-and-finance': {
    label: 'Business and Finance',
    description: 'Accounting, finance, human resources, operations and analysis.'
  },
  management: {
    label: 'Management',
    description: 'Leading teams, departments and organisations.'
  },
  'engineering-and-architecture': {
    label: 'Engineering and Architecture',
    description: 'Designing buildings, machines, circuits and plants.'
  },
  'science-and-research': {
    label: 'Science and Research',
    description: 'Research in the life, physical and social sciences.'
  },
  'health-and-care': {
    label: 'Health and Care',
    description: 'Treating, nursing and supporting patients.'
  },
  'law-and-justice': {
    label: 'Law and Justice',
    description: 'Legal practice, courts and legal support.'
  },
  'education-and-training': {
    label: 'Education and Training',
    description: 'Teaching, training and running libraries.'
  },
  'arts-media-and-communication': {
    label: 'Arts, Media and Communication',
    description: 'Writing, broadcasting, performing, translating and the arts.'
  },
  'community-and-social-services': {
    label: 'Community and Social Services',
    description: 'Counselling, social work and community support.'
  },
  'sales-and-marketing': {
    label: 'Sales and Marketing',
    description: 'Selling, advertising, marketing and buying.'
  },
  'office-and-administration': {
    label: 'Office and Administration',
    description: 'Office, records, customer service and clerical work.'
  },
  'hospitality-and-personal-services': {
    label: 'Hospitality and Personal Services',
    description: 'Food, hotels, tourism, recreation and personal care.'
  },
  'building-repair-and-trades': {
    label: 'Building, Repair and Trades',
    description: 'Construction, installation, maintenance and repair.'
  },
  'manufacturing-and-production': {
    label: 'Manufacturing and Production',
    description: 'Operating plants and machines, assembly and quality control.'
  },
  'transport-and-logistics': {
    label: 'Transport and Logistics',
    description: 'Driving, flying, shipping and moving goods.'
  },
  'public-safety-and-security': {
    label: 'Public Safety and Security',
    description: 'Police, firefighting, security and emergency services.'
  },
  'agriculture-and-environment': {
    label: 'Agriculture and Environment',
    description: 'Farming, fishing, forestry and the environment.'
  }
}

const msAreas: Record<string, PathwayAreaText> = {
  'ai-and-data': {
    label: 'AI dan Data',
    description: 'Membangunkan model AI, menganalisis data dan mengurus pangkalan datanya.'
  },
  cybersecurity: {
    label: 'Keselamatan Siber',
    description: 'Melindungi sistem dan data, menguji pertahanan serta menyiasat serangan.'
  },
  'cloud-and-infrastructure': {
    label: 'Awan dan Infrastruktur',
    description: 'Mengurus pelayan, rangkaian, platform awan dan pusat data.'
  },
  'software-and-web': {
    label: 'Perisian dan Web',
    description: 'Menulis, menguji dan menjalankan perisian, aplikasi serta laman web.'
  },
  'design-and-ux': {
    label: 'Reka Bentuk dan UX',
    description: 'Mereka bentuk skrin, produk, grafik dan animasi.'
  },
  'business-and-finance': {
    label: 'Perniagaan dan Kewangan',
    description: 'Perakaunan, kewangan, sumber manusia, operasi dan analisis.'
  },
  management: {
    label: 'Pengurusan',
    description: 'Memimpin pasukan, jabatan dan organisasi.'
  },
  'engineering-and-architecture': {
    label: 'Kejuruteraan dan Seni Bina',
    description: 'Mereka bentuk bangunan, mesin, litar dan loji.'
  },
  'science-and-research': {
    label: 'Sains dan Penyelidikan',
    description: 'Penyelidikan dalam sains hayat, sains fizikal dan sains sosial.'
  },
  'health-and-care': {
    label: 'Kesihatan dan Penjagaan',
    description: 'Merawat, menjaga dan menyokong pesakit.'
  },
  'law-and-justice': {
    label: 'Undang-undang dan Keadilan',
    description: 'Amalan undang-undang, mahkamah dan sokongan guaman.'
  },
  'education-and-training': {
    label: 'Pendidikan dan Latihan',
    description: 'Mengajar, melatih dan mengurus perpustakaan.'
  },
  'arts-media-and-communication': {
    label: 'Seni, Media dan Komunikasi',
    description: 'Penulisan, penyiaran, persembahan, terjemahan dan seni.'
  },
  'community-and-social-services': {
    label: 'Khidmat Masyarakat dan Sosial',
    description: 'Kaunseling, kerja sosial dan sokongan komuniti.'
  },
  'sales-and-marketing': {
    label: 'Jualan dan Pemasaran',
    description: 'Jualan, pengiklanan, pemasaran dan pembelian.'
  },
  'office-and-administration': {
    label: 'Pejabat dan Pentadbiran',
    description: 'Kerja pejabat, rekod, khidmat pelanggan dan perkeranian.'
  },
  'hospitality-and-personal-services': {
    label: 'Hospitaliti dan Perkhidmatan Peribadi',
    description: 'Makanan, hotel, pelancongan, rekreasi dan penjagaan diri.'
  },
  'building-repair-and-trades': {
    label: 'Pembinaan, Pembaikan dan Kemahiran Teknikal',
    description: 'Pembinaan, pemasangan, penyelenggaraan dan pembaikan.'
  },
  'manufacturing-and-production': {
    label: 'Pembuatan dan Pengeluaran',
    description: 'Mengendalikan loji dan mesin, pemasangan serta kawalan mutu.'
  },
  'transport-and-logistics': {
    label: 'Pengangkutan dan Logistik',
    description: 'Memandu, menerbangkan pesawat, penghantaran dan pemindahan barang.'
  },
  'public-safety-and-security': {
    label: 'Keselamatan Awam dan Sekuriti',
    description: 'Polis, bomba, keselamatan dan perkhidmatan kecemasan.'
  },
  'agriculture-and-environment': {
    label: 'Pertanian dan Alam Sekitar',
    description: 'Pertanian, perikanan, perhutanan dan alam sekitar.'
  }
}

const zhAreas: Record<string, PathwayAreaText> = {
  'ai-and-data': {
    label: 'AI 与数据',
    description: '开发 AI 模型、分析数据并管理相关数据库。'
  },
  cybersecurity: {
    label: '网络安全',
    description: '保护系统和数据、测试防御措施并调查攻击。'
  },
  'cloud-and-infrastructure': {
    label: '云与基础设施',
    description: '管理服务器、网络、云平台和数据中心。'
  },
  'software-and-web': {
    label: '软件与网页',
    description: '编写、测试和运行软件、应用及网站。'
  },
  'design-and-ux': {
    label: '设计与 UX',
    description: '设计屏幕、产品、图像和动画。'
  },
  'business-and-finance': {
    label: '商业与金融',
    description: '会计、金融、人力资源、运营和分析。'
  },
  management: {
    label: '管理',
    description: '带领团队、部门和机构。'
  },
  'engineering-and-architecture': {
    label: '工程与建筑',
    description: '设计建筑、机器、电路和工厂。'
  },
  'science-and-research': {
    label: '科学与研究',
    description: '研究生命科学、物理科学和社会科学。'
  },
  'health-and-care': {
    label: '医疗与护理',
    description: '治疗、护理和支援病人。'
  },
  'law-and-justice': {
    label: '法律与司法',
    description: '法律实务、法庭和法律支援。'
  },
  'education-and-training': {
    label: '教育与培训',
    description: '教学、培训和图书馆管理。'
  },
  'arts-media-and-communication': {
    label: '艺术、媒体与传播',
    description: '写作、广播、表演、翻译和艺术创作。'
  },
  'community-and-social-services': {
    label: '社区与社会服务',
    description: '辅导、社会工作和社区支援。'
  },
  'sales-and-marketing': {
    label: '销售与营销',
    description: '销售、广告、营销和采购。'
  },
  'office-and-administration': {
    label: '办公室与行政',
    description: '办公室事务、记录、客户服务和文书工作。'
  },
  'hospitality-and-personal-services': {
    label: '酒店与个人服务',
    description: '餐饮、酒店、旅游、休闲和个人护理。'
  },
  'building-repair-and-trades': {
    label: '建筑、维修与技工',
    description: '建筑、安装、维护和维修。'
  },
  'manufacturing-and-production': {
    label: '制造与生产',
    description: '操作工厂和机器、组装产品并进行质量检查。'
  },
  'transport-and-logistics': {
    label: '运输与物流',
    description: '驾驶、飞行、运输和搬运货物。'
  },
  'public-safety-and-security': {
    label: '公共安全与安保',
    description: '警务、消防、安保和紧急服务。'
  },
  'agriculture-and-environment': {
    label: '农业与环境',
    description: '农业、渔业、林业和环境保护。'
  }
}

export const checkupText = defineText(
  {
    situations: {
      working: { title: 'Working', description: 'I have a job now.' },
      studying: { title: 'Studying', description: 'I’m at school, college or university.' },
      graduated: { title: 'Graduated, Looking for Work', description: 'I’ve finished studying.' },
      between_jobs: { title: 'Between Jobs', description: 'I’ve worked, and I’m looking again.' },
      returning: { title: 'Returning to Work', description: 'After a break, such as caring for family.' }
    },
    goals: {
      stay: { title: 'Stay Strong in My Job', description: 'Keep your current role safe as AI changes it.' },
      target: {
        title: 'Move to a Role I Have in Mind',
        description: (n: number) => `Name up to ${n} roles; the questions test you on the first.`
      },
      explore: {
        title: 'Show Me Where I Could Go',
        description: 'Pick the areas that interest you, or let your job and study lead.'
      },
      unsure: {
        title: 'I’m Not Sure Yet',
        description: 'Tell Kopi what you enjoy, and it suggests roles to try.'
      },
      backToLastJob: {
        title: 'Get Back Into My Last Job',
        description: 'Test yourself on your last job as AI changes it.'
      }
    },
    study: {
      preferNot: 'Prefer Not to Say',
      qualifications: {
        secondary: 'SPM or Equivalent',
        certificate: 'Certificate',
        diploma: 'Diploma',
        bachelor: 'Bachelor’s Degree',
        master: 'Master’s Degree',
        doctorate: 'Doctorate'
      },
      fields: enStudyFields,
      years: {
        noneYet: 'None Yet',
        underTwo: () => 'Under 2 Years',
        range: (from: number, to: number) => `${from} to ${to} Years`,
        orMore: (n: number) => `${n} Years or More`
      }
    },
    jobLabels: {
      current: { label: 'Your Job Title', placeholder: 'Type Your Job Title' },
      last: { label: 'Your Last Job (Optional)', placeholder: 'Type Your Last Job Title' },
      earlier: { label: 'A Job You’ve Had (Optional)', placeholder: 'Part-Time, Internship or Earlier Job' }
    },
    interestActivities: enInterests,
    interestAreas: {
      R: 'hands-on',
      I: 'investigating',
      A: 'creative',
      S: 'helping',
      E: 'leading',
      C: 'organising'
    },
    pathwayAreas: enAreas,
    areaGroups: { digital: 'Digital and Tech', other: 'Other Fields' },
    areaCount: (picked: number, total: number) => `${picked} of ${total} picked.`,
    interestPrompt: (n: number) =>
      `Pick everything that sounds good, at least ${n}. It’s a pointer, not a test: Kopi matches your picks to the interests O*NET records for each job.`,
    interestCount: (n: number) => `${n} picked`,
    interestMore: (n: number) => `; pick ${n} more.`,
    interestEven: '. They’re spread evenly, so they don’t point anywhere yet: leave out the ones you like least.',
    interestEnough: '.',
    roleLabels: {
      interestMatch: 'interest match',
      outlook: 'Outlook',
      youPicked: 'You picked this role.',
      pickedForYou: 'Picked for you: Kopi’s top suggestion for your answers.'
    },
    roleSearch: {
      match: (title: string) => `Kopi thinks you mean ${title}`,
      matchedByClaude: ' · Matched by Claude',
      matchedByTitleSearch: ' · Matched by Title Search',
      matching: 'Kopi is matching your title…',
      noMatch: 'No match yet. Try a simpler title, or pick one:',
      footnote: 'Can’t find it? Type any title and Kopi will match it.',
      suggestions: (label: string) => `${label} Suggestions`,
      situationHint:
        'That sounds like where you are as well as a job. Pick it under Right Now, I’m, and choose the closest job below if you’ve had one.'
    },
    target: {
      listLabel: 'Roles You Picked',
      firstRoleNote: ' (the questions test you on this)',
      remove: (title: string) => `Remove ${title}`,
      label: 'Target Role',
      addOptional: 'Add Another Role (Optional)',
      typeRole: 'Type the Role You Want',
      suggestions: 'Target Role Suggestions',
      comparison: (title: string) => `The questions test you on ${title}; Roles That Fit compares the others beside it.`
    },
    copy: {
      heading: 'Tell Kopi About You',
      intro:
        'Your study and situation decide which roles Kopi shows, and tell you when a role needs a qualification. It stays in this browser, unless you ask Kopi a question, which sends it with your check-up.',
      situationHeading: 'Right Now, I’m',
      studyHeading: 'Your Study and Experience',
      qualification: 'Highest Qualification',
      field: 'Field of Study',
      yearsExperience: 'Years of Work Experience',
      work: 'Your Work',
      workIfAny: 'Your Work, If Any',
      jobSearchHint: (n: number) => `Type a job title in any language. Kopi matches it to one of ${n} job profiles.`,
      goalHeading: 'What Do You Want?',
      targetHeading: 'Which Roles Do You Want?',
      targetDifferent: 'Pick a role different from your current job.',
      areasHeading: 'Areas That Interest You',
      optional: ' (Optional)',
      missingSituation: 'Pick where you are right now.',
      missingJob: 'Type your job title to test you on it.',
      missingTarget: 'Name the role you want.',
      missingExplore: 'Pick an area, your field of study or a job, so Kopi has something to go on.'
    },
    speech: {
      greeting: 'Hi, I’m Kopi. Tell me where you are, and I’ll find the roles worth checking.',
      noJob: 'No job to test yet? No problem. I’ll suggest roles first, then test you on the one you pick.',
      openWork: 'Let’s open the box on your work.',
      interestPrompt: 'Not sure yet? Tell me what you enjoy, and I’ll suggest roles to try.',
      lookingForRoles: 'Looking for roles that suit you…',
      rolesFromInterests: (areas: string[]) =>
        `Your picks lean to ${areas.join(' and ')} work. Pick a role, and I’ll test you against it.`,
      pickRole: 'Pick a role, and I’ll test you against it.',
      needMore: 'I need a little more to go on.'
    },
    buttons: {
      showRoles: 'Show Roles for Me',
      changeAnswers: 'Change My Answers',
      choose: 'Choose',
      seeRoles: 'See Roles for Me',
      startQuestions: (n: number) => `Start the ${n} Questions`,
      pickRole: 'Pick a Role',
      testMeOn: (title: string) => `Test Me on ${title}`
    },
    suggestions: {
      interestsHeading: 'What Do You Enjoy?',
      openErrorTitle: 'Kopi Could Not Load the Roles',
      reloadOrBack: 'Reload the page, or go back and try again.',
      nothingTitle: 'Nothing to Go On Yet',
      nothingBody:
        'Pick an area that interests you, your field of study, or what you enjoy, and Kopi can suggest roles.',
      heading: 'Roles to Check',
      intro: (n: number) =>
        `From your study, the areas you picked and what you enjoy. A role that needs a qualification says so; pick it anyway if it interests you, and your answers will show how well it suits you. The ${n} questions test the highlighted role; pick any card to switch.`,
      ariaLabel: 'Roles to Check'
    },
    startAgain: {
      answerQuestions: 'Answer the Questions',
      finishQuestions: (n: number) => `Finish your ${n} questions`,
      pickRole: 'Pick a Role to Check',
      pickRoleSpeech: 'Pick a role to check first',
      chooseJob: 'Choose Your Job',
      tellJob: 'Tell me your job first',
      noRoleSuffix: (speech: string) => `${speech}, then I can ask about it.`
    },
    questions: {
      loadingErrorTitle: 'Kopi Could Not Open This Job',
      reloadJob: 'Reload the page, or choose your job again.',
      loading: 'Opening the box on your job…',
      notReadyTitle: 'Questions Not Written Yet',
      notReadyBody: 'Kopi has no questions for this job yet. Choose a related job for now.',
      anotherJob: 'Choose Another Job',
      testing: (title: string) => `Testing You Against ${title}`,
      counter: (current: number, total: number) => `Question ${current} of ${total}`,
      cardLabel: 'Question Card',
      answerHint: (from: number, to: number) =>
        `Answer for real work, not tutorials. Not sure? Choose ${from} or ${to}.`,
      ratings: { 1: 'Not yet', 2: 'A little', 3: 'Mostly', 4: 'Yes, on my own' },
      ratingAria: (value: number, caption: string) => `${value} ${caption}`,
      previous: 'Previous Question',
      pressKeys: (from: number, to: number) => `Press ${from} to ${to}`,
      hiddenHeading: 'Check-Up Questions',
      about: 'About this question',
      skillArea: 'Skill area',
      thisQuestion: 'This question is about',
      realTasks: 'Real job tasks in this area',
      noTasks: 'Kopi has no task list for this skill yet.'
    }
  },
  {
    situations: {
      working: { title: 'Bekerja', description: 'Saya sedang bekerja.' },
      studying: { title: 'Belajar', description: 'Saya di sekolah, kolej atau universiti.' },
      graduated: { title: 'Tamat Pengajian, Mencari Kerja', description: 'Saya sudah tamat belajar.' },
      between_jobs: {
        title: 'Belum Mendapat Pekerjaan',
        description: 'Saya pernah bekerja dan sedang mencari kerja lagi.'
      },
      returning: { title: 'Kembali Bekerja', description: 'Selepas berehat, contohnya untuk menjaga keluarga.' }
    },
    goals: {
      stay: {
        title: 'Kekal Kukuh dalam Pekerjaan',
        description: 'Lindungi peranan semasa anda apabila AI mengubahnya.'
      },
      target: {
        title: 'Beralih kepada Peranan Pilihan',
        description: (n: number) => `Namakan sehingga ${n} peranan; soalan menguji peranan pertama.`
      },
      explore: {
        title: 'Tunjukkan Pilihan Saya',
        description: 'Pilih bidang yang anda minati, atau biar pekerjaan dan pengajian menjadi panduan.'
      },
      unsure: {
        title: 'Saya Belum Pasti',
        description: 'Beritahu Kopi perkara yang anda minati dan Kopi akan mencadangkan peranan.'
      },
      backToLastJob: {
        title: 'Kembali kepada Pekerjaan Dahulu',
        description: 'Uji diri dengan pekerjaan dahulu apabila AI mengubahnya.'
      }
    },
    study: {
      preferNot: 'Tidak Mahu Menyatakan',
      qualifications: {
        secondary: 'SPM atau Setaraf',
        certificate: 'Sijil',
        diploma: 'Diploma',
        bachelor: 'Ijazah Sarjana Muda',
        master: 'Ijazah Sarjana',
        doctorate: 'Ijazah Kedoktoran'
      },
      fields: msStudyFields,
      years: {
        noneYet: 'Belum Ada',
        underTwo: () => 'Kurang daripada 2 Tahun',
        range: (from: number, to: number) => `${from} hingga ${to} Tahun`,
        orMore: (n: number) => `${n} Tahun atau Lebih`
      }
    },
    jobLabels: {
      current: { label: 'Jawatan Anda', placeholder: 'Taip Jawatan Anda' },
      last: { label: 'Pekerjaan Dahulu (Pilihan)', placeholder: 'Taip Pekerjaan Dahulu' },
      earlier: {
        label: 'Pekerjaan Sebelum Ini (Pilihan)',
        placeholder: 'Sambilan, Latihan Industri atau Pekerjaan Dahulu'
      }
    },
    interestActivities: msInterests,
    interestAreas: {
      R: 'praktikal',
      I: 'penyelidikan',
      A: 'kreatif',
      S: 'membantu',
      E: 'kepimpinan',
      C: 'penyusunan'
    },
    pathwayAreas: msAreas,
    areaGroups: { digital: 'Digital dan Teknologi', other: 'Bidang Lain' },
    areaCount: (picked: number, total: number) => `${picked} daripada ${total} dipilih.`,
    interestPrompt: (n: number) =>
      `Pilih perkara yang anda minati, sekurang-kurangnya ${n}. Ini petunjuk, bukan ujian: Kopi padankan pilihan anda dengan minat yang direkodkan O*NET bagi setiap pekerjaan.`,
    interestCount: (n: number) => `${n} dipilih`,
    interestMore: (n: number) => `; pilih ${n} lagi.`,
    interestEven:
      '. Pilihan anda sama rata, jadi belum menunjukkan arah: gugurkan perkara yang paling kurang anda minati.',
    interestEnough: '.',
    roleLabels: {
      interestMatch: 'padanan minat',
      outlook: 'Prospek',
      youPicked: 'Anda memilih peranan ini.',
      pickedForYou: 'Pilihan untuk anda: cadangan utama Kopi berdasarkan jawapan anda.'
    },
    roleSearch: {
      match: (title: string) => `Kopi rasa anda maksudkan ${title}`,
      matchedByClaude: ' · Padanan oleh Claude',
      matchedByTitleSearch: ' · Padanan melalui Carian Tajuk',
      matching: 'Kopi sedang mencari padanan untuk tajuk anda…',
      noMatch: 'Belum jumpa padanan. Cuba tajuk lebih ringkas atau pilih satu:',
      footnote: 'Tidak jumpa? Taip apa-apa tajuk dan Kopi akan cari padanannya.',
      suggestions: (label: string) => `Cadangan ${label}`,
      situationHint:
        'Ini kedengaran seperti keadaan anda, bukan sekadar pekerjaan. Pilih keadaan itu di bahagian Sekarang, kemudian pilih pekerjaan paling hampir jika anda pernah bekerja.'
    },
    target: {
      listLabel: 'Peranan Pilihan Anda',
      firstRoleNote: ' (soalan menguji anda tentang peranan ini)',
      remove: (title: string) => `Alih keluar ${title}`,
      label: 'Peranan Sasaran',
      addOptional: 'Tambah Peranan Lain (Pilihan)',
      typeRole: 'Taip Peranan Yang Anda Mahu',
      suggestions: 'Cadangan Peranan Sasaran',
      comparison: (title: string) =>
        `Soalan menguji anda tentang ${title}; Peranan Yang Sesuai membandingkan peranan lain dengannya.`
    },
    copy: {
      heading: 'Tentang Anda',
      intro:
        'Pengajian dan keadaan anda menentukan peranan yang dicadangkan Kopi serta kelayakan yang diperlukan. Maklumat ini kekal dalam pelayar ini, kecuali jika anda bertanya kepada Kopi. Maklumat itu akan dihantar bersama semakan anda.',
      situationHeading: 'Keadaan Saya Sekarang',
      studyHeading: 'Pengajian dan Pengalaman Anda',
      qualification: 'Kelayakan Tertinggi',
      field: 'Bidang Pengajian',
      yearsExperience: 'Tempoh Pengalaman Bekerja',
      work: 'Pekerjaan Anda',
      workIfAny: 'Pekerjaan Anda, Jika Ada',
      jobSearchHint: (n: number) =>
        `Taip jawatan dalam apa-apa bahasa. Kopi padankan dengan satu daripada ${n} profil pekerjaan.`,
      goalHeading: 'Apa Matlamat Anda?',
      targetHeading: 'Peranan Mana Yang Anda Mahu?',
      targetDifferent: 'Pilih peranan selain pekerjaan semasa anda.',
      areasHeading: 'Bidang Yang Anda Minati',
      optional: ' (Pilihan)',
      missingSituation: 'Pilih keadaan anda sekarang.',
      missingJob: 'Taip jawatan anda untuk diuji.',
      missingTarget: 'Namakan peranan yang anda mahu.',
      missingExplore: 'Pilih bidang, bidang pengajian atau pekerjaan supaya Kopi boleh mencadangkan sesuatu.'
    },
    speech: {
      greeting: 'Hai, saya Kopi. Beritahu keadaan anda supaya saya boleh mencari peranan yang sesuai.',
      noJob: 'Belum ada pekerjaan untuk diuji? Tak mengapa. Saya cadangkan peranan, kemudian kita semak pilihan anda.',
      openWork: 'Mari kita lihat pekerjaan anda.',
      interestPrompt: 'Belum pasti? Ceritakan apa yang anda suka. Saya cadangkan peranan untuk dicuba.',
      lookingForRoles: 'Mencari peranan sesuai…',
      rolesFromInterests: (areas: string[]) =>
        `Pilihan anda cenderung kepada kerja ${areas.join(', ')}. Pilih peranan dan saya akan uji anda.`,
      pickRole: 'Pilih peranan dan saya akan uji anda.',
      needMore: 'Saya perlukan sedikit lagi maklumat.'
    },
    buttons: {
      showRoles: 'Tunjukkan Peranan',
      changeAnswers: 'Ubah Jawapan Saya',
      choose: 'Pilih',
      seeRoles: 'Lihat Peranan',
      startQuestions: (n: number) => `Mulakan ${n} Soalan`,
      pickRole: 'Pilih Peranan',
      testMeOn: (title: string) => `Uji Saya: ${title}`
    },
    suggestions: {
      interestsHeading: 'Perkara Apa Yang Anda Minati?',
      openErrorTitle: 'Kopi Tidak Dapat Memuatkan Peranan',
      reloadOrBack: 'Muat semula halaman atau kembali dan cuba lagi.',
      nothingTitle: 'Belum Ada Maklumat',
      nothingBody:
        'Pilih bidang yang anda minati, bidang pengajian atau perkara yang anda suka supaya Kopi boleh mencadangkan peranan.',
      heading: 'Peranan untuk Disemak',
      intro: (n: number) =>
        `Cadangan ini berdasarkan pengajian, bidang pilihan dan perkara yang anda minati. Peranan yang memerlukan kelayakan akan menyatakannya. Anda masih boleh memilihnya jika berminat; jawapan anda akan menunjukkan kesesuaiannya. ${n} soalan menguji peranan yang diserlahkan. Pilih kad lain untuk menukarnya.`,
      ariaLabel: 'Peranan untuk Disemak'
    },
    startAgain: {
      answerQuestions: 'Jawab Soalan',
      finishQuestions: (n: number) => `Selesaikan ${n} soalan anda`,
      pickRole: 'Pilih Peranan untuk Disemak',
      pickRoleSpeech: 'Pilih peranan dahulu',
      chooseJob: 'Pilih Pekerjaan Anda',
      tellJob: 'Nyatakan pekerjaan dahulu',
      noRoleSuffix: (speech: string) => `${speech}, kemudian saya boleh bertanya.`
    },
    questions: {
      loadingErrorTitle: 'Kopi Tidak Dapat Membuka Pekerjaan Ini',
      reloadJob: 'Muat semula halaman atau pilih pekerjaan anda semula.',
      loading: 'Membuka maklumat kerja…',
      notReadyTitle: 'Soalan Belum Disediakan',
      notReadyBody: 'Kopi belum mempunyai soalan untuk pekerjaan ini. Pilih pekerjaan berkaitan buat sementara waktu.',
      anotherJob: 'Pilih Pekerjaan Lain',
      testing: (title: string) => `Menguji Anda untuk ${title}`,
      counter: (current: number, total: number) => `Soalan ${current} daripada ${total}`,
      cardLabel: 'Kad Soalan',
      answerHint: (from: number, to: number) =>
        `Jawab berdasarkan kerja sebenar, bukan latihan. Tidak pasti? Pilih ${from} atau ${to}.`,
      ratings: { 1: 'Belum', 2: 'Sedikit', 3: 'Kebanyakannya', 4: 'Ya, sendiri' },
      ratingAria: (value: number, caption: string) => `${value} ${caption}`,
      previous: 'Soalan Sebelumnya',
      pressKeys: (from: number, to: number) => `Tekan ${from} hingga ${to}`,
      hiddenHeading: 'Soalan Semakan',
      about: 'Tentang soalan ini',
      skillArea: 'Bidang Kemahiran',
      thisQuestion: 'Soalan ini tentang',
      realTasks: 'Tugas sebenar dalam bidang ini',
      noTasks: 'Kopi belum mempunyai senarai tugas untuk kemahiran ini.'
    }
  },
  {
    situations: {
      working: { title: '在职', description: '我目前有工作。' },
      studying: { title: '在读', description: '我在学校、学院或大学就读。' },
      graduated: { title: '已毕业，正在找工作', description: '我已经完成学业。' },
      between_jobs: { title: '目前待业', description: '我曾经工作，现在正在重新求职。' },
      returning: { title: '重返职场', description: '休息一段时间后，例如照顾家人后。' }
    },
    goals: {
      stay: { title: '稳住目前的工作', description: '在 AI 改变你的职位时，帮助你守住目前的工作。' },
      target: {
        title: '转到心仪的职位',
        description: (n: number) => `最多填写 ${n} 个职位；问题会检测你对第一个职位的能力。`
      },
      explore: {
        title: '看看我还能做什么',
        description: '选择你感兴趣的领域，也可以参考你的工作和学业经历。'
      },
      unsure: {
        title: '我还不确定',
        description: '告诉 Kopi 你喜欢做什么，Kopi 会推荐一些职位。'
      },
      backToLastJob: {
        title: '回到上一份工作',
        description: '看看 AI 改变上一份工作后，你是否仍能胜任。'
      }
    },
    study: {
      preferNot: '不便透露',
      qualifications: {
        secondary: 'SPM 或同等学历',
        certificate: '证书',
        diploma: '文凭',
        bachelor: '学士学位',
        master: '硕士学位',
        doctorate: '博士学位'
      },
      fields: zhStudyFields,
      years: {
        noneYet: '还没有',
        underTwo: () => '少于 2 年',
        range: (from: number, to: number) => `${from} 至 ${to} 年`,
        orMore: (n: number) => `${n} 年或以上`
      }
    },
    jobLabels: {
      current: { label: '你的职位名称', placeholder: '输入你的职位名称' },
      last: { label: '上一份工作（选填）', placeholder: '输入上一份工作名称' },
      earlier: { label: '曾做过的工作（选填）', placeholder: '兼职、实习或更早的工作' }
    },
    interestActivities: zhInterests,
    interestAreas: {
      R: '实操',
      I: '探究',
      A: '创意',
      S: '助人',
      E: '领导',
      C: '组织'
    },
    pathwayAreas: zhAreas,
    areaGroups: { digital: '数码与科技', other: '其他领域' },
    areaCount: (picked: number, total: number) => `已选 ${picked} 项，共 ${total} 项。`,
    interestPrompt: (n: number) =>
      `选择所有你感兴趣的项目，至少选 ${n} 项。这只是参考，不是测验：Kopi 会把你的选择与 O*NET 记录的各项工作兴趣进行匹配。`,
    interestCount: (n: number) => `已选 ${n} 项`,
    interestMore: (n: number) => `；再选 ${n} 项。`,
    interestEven: '。你的选择分布太平均，暂时看不出方向；请去掉最不喜欢的项目。',
    interestEnough: '。',
    roleLabels: {
      interestMatch: '兴趣匹配度',
      outlook: '前景',
      youPicked: '你选了这个职位。',
      pickedForYou: '为你推荐：Kopi 根据你的回答选出的首选职位。'
    },
    roleSearch: {
      match: (title: string) => `Kopi 认为你指的是 ${title}`,
      matchedByClaude: ' · 由 Claude 匹配',
      matchedByTitleSearch: ' · 由职位搜索匹配',
      matching: 'Kopi 正在匹配你的职位名称…',
      noMatch: '暂时没有匹配项。试试更简短的名称，或选择一个：',
      footnote: '找不到？输入任何职位名称，Kopi 都会帮你匹配。',
      suggestions: (label: string) => `${label}建议`,
      situationHint:
        '这听起来像是在说你的情况，而不只是职位。请在“我目前的情况”中选择它；如果你做过工作，也可以在下方选择最接近的职位。'
    },
    target: {
      listLabel: '你选择的职位',
      firstRoleNote: '（问题会检测你是否适合这个职位）',
      remove: (title: string) => `移除 ${title}`,
      label: '目标职位',
      addOptional: '添加另一个职位（选填）',
      typeRole: '输入你想要的职位',
      suggestions: '目标职位建议',
      comparison: (title: string) => `问题会检测你对 ${title} 的能力；“适合的职位”会将其他职位与它比较。`
    },
    copy: {
      heading: '告诉 Kopi 你的情况',
      intro:
        '你的学业和目前的情况会影响 Kopi 推荐的职位，也会显示职位需要哪些资格。资料会保留在此浏览器中；如果你向 Kopi 提问，资料会随检测结果一并发送。',
      situationHeading: '我目前的情况',
      studyHeading: '学业与工作经验',
      qualification: '最高学历',
      field: '学业领域',
      yearsExperience: '工作经验年数',
      work: '你的工作',
      workIfAny: '你的工作（如有）',
      jobSearchHint: (n: number) => `用任何语言输入职位名称。Kopi 会从 ${n} 份工作档案中为你匹配。`,
      goalHeading: '你的目标是什么？',
      targetHeading: '你想从事哪些职位？',
      targetDifferent: '请选择一个不同于你目前工作的职位。',
      areasHeading: '你感兴趣的领域',
      optional: '（选填）',
      missingSituation: '请选择你目前的情况。',
      missingJob: '输入你的职位名称，才能检测你的能力。',
      missingTarget: '填写你想要的职位。',
      missingExplore: '选择一个感兴趣的领域、学业领域或工作，让 Kopi 有更多线索。'
    },
    speech: {
      greeting: '嗨，我是 Kopi。告诉我你目前的情况，我会帮你找出值得检测的职位。',
      noJob: '还没有工作可以检测？没关系。我先推荐一些职位，再检测你选的职位。',
      openWork: '让我们看看你的工作。',
      interestPrompt: '还不确定？告诉我你喜欢做什么，我会推荐一些职位。',
      lookingForRoles: '正在为你寻找合适的职位…',
      rolesFromInterests: (areas: string[]) =>
        `你的选择偏向${areas.join('、')}类工作。选一个职位，我来检测你的匹配度。`,
      pickRole: '选一个职位，我来检测你的匹配度。',
      needMore: '我还需要多一点线索。'
    },
    buttons: {
      showRoles: '为我推荐职位',
      changeAnswers: '更改我的回答',
      choose: '选择',
      seeRoles: '查看适合我的职位',
      startQuestions: (n: number) => `开始回答 ${n} 道题`,
      pickRole: '选择职位',
      testMeOn: (title: string) => `用 ${title} 检测我`
    },
    suggestions: {
      interestsHeading: '你喜欢做什么？',
      openErrorTitle: 'Kopi 无法载入职位',
      reloadOrBack: '重新载入页面，或返回后再试。',
      nothingTitle: '还没有足够线索',
      nothingBody: '选择你感兴趣的领域、学业领域或喜欢做的事，Kopi 就能推荐职位。',
      heading: '可检测的职位',
      intro: (n: number) =>
        `这些建议根据你的学业、所选领域和兴趣而来。需要资格的职位会注明要求；如果你感兴趣，仍可选择它。你的回答会显示它是否适合你。${n} 个问题会检测高亮的职位；选择其他卡片即可切换。`,
      ariaLabel: '可检测的职位'
    },
    startAgain: {
      answerQuestions: '回答问题',
      finishQuestions: (n: number) => `完成这 ${n} 道题`,
      pickRole: '选择一个职位来检测',
      pickRoleSpeech: '先选择一个职位来检测',
      chooseJob: '选择你的工作',
      tellJob: '先告诉我你的工作',
      noRoleSuffix: (speech: string) => `${speech}，然后我就能问你相关问题。`
    },
    questions: {
      loadingErrorTitle: 'Kopi 无法打开这份工作资料',
      reloadJob: '重新载入页面，或重新选择你的工作。',
      loading: '正在打开你的工作资料…',
      notReadyTitle: '问题尚未准备好',
      notReadyBody: 'Kopi 暂时还没有这份工作的检测问题。请先选择相关工作。',
      anotherJob: '选择另一份工作',
      testing: (title: string) => `正在检测你与 ${title} 的匹配度`,
      counter: (current: number, total: number) => `第 ${current} 题，共 ${total} 题`,
      cardLabel: '问题卡片',
      answerHint: (from: number, to: number) =>
        `根据实际工作情况作答，不要以教程为准。不确定？请选择 ${from} 或 ${to}。`,
      ratings: { 1: '还不会', 2: '会一点', 3: '大多会', 4: '能独立完成' },
      ratingAria: (value: number, caption: string) => `${value} ${caption}`,
      previous: '上一题',
      pressKeys: (from: number, to: number) => `按 ${from} 至 ${to} 键`,
      hiddenHeading: '检测问题',
      about: '关于这个问题',
      skillArea: '技能领域',
      thisQuestion: '这个问题涉及',
      realTasks: '该领域的实际工作任务',
      noTasks: 'Kopi 暂时没有这项技能的任务清单。'
    }
  }
)
