import type { CandidateReason, EducationLevel, JobMarketLevel, RoleAccess } from '@kotak/shared'
import { defineText } from '../text'

const msBenefits: Record<string, string> = {
  medical: 'Perlindungan Perubatan',
  dental_optical: 'Pergigian dan Optik',
  insurance: 'Insurans',
  bonus: 'Bonus',
  commission: 'Komisen dan Insentif',
  allowance: 'Elaun',
  flexible_hours: 'Waktu Kerja Fleksibel',
  work_from_home: 'Bekerja dari Rumah atau Hibrid',
  training: 'Latihan dan Kursus',
  career_growth: 'Kemajuan Kerjaya',
  extra_leave: 'Cuti Tambahan',
  five_day_week: 'Minggu Kerja Lima Hari',
  parking_transport: 'Parkir dan Pengangkutan',
  meals: 'Makanan dan Snek',
  wellness: 'Kesihatan dan Kecergasan',
  team_events: 'Acara dan Perjalanan Pasukan',
  housing: 'Tempat Tinggal dan Penempatan Semula',
  shares: 'Saham',
  competitive_pay: 'Gaji Kompetitif',
  pay_rises: 'Kenaikan Gaji',
  overtime_pay: 'Bayaran Kerja Lebih Masa',
  epf: 'KWSP dan PERKESO'
}

const zhBenefits: Record<string, string> = {
  medical: '医疗保障',
  dental_optical: '牙科与视力保障',
  insurance: '保险',
  bonus: '奖金',
  commission: '佣金和奖励',
  allowance: '津贴',
  flexible_hours: '弹性工时',
  work_from_home: '居家或混合办公',
  training: '培训与课程',
  career_growth: '职业发展',
  extra_leave: '额外假期',
  five_day_week: '每周工作五天',
  parking_transport: '停车与交通',
  meals: '餐食与零食',
  wellness: '健康与健身',
  team_events: '团队活动与旅行',
  housing: '住宿与搬迁',
  shares: '股份',
  competitive_pay: '具竞争力的薪酬',
  pay_rises: '加薪',
  overtime_pay: '加班费',
  epf: 'EPF 和 SOCSO'
}

const msAlliedHealthRoute = [
  'Dapatkan kelayakan yang diiktiraf oleh Malaysian Allied Health Professions Council.',
  'Daftar dengan Council (pemohon mestilah warganegara Malaysia).',
  'Miliki sijil amalan yang sah selama dua tahun sebelum mula beramal.'
]

const zhAlliedHealthRoute = [
  '取得 Malaysian Allied Health Professions Council 认可的资格。',
  '向 Council 注册（申请者必须是马来西亚公民）。',
  '开始执业前，须持有有效期为两年的执业证书。'
]

const msTcmRoute = [
  'Dapatkan Ijazah Sarjana Muda dalam Kiropraktik atau kelayakan setara yang diiktiraf oleh T&CM Council.',
  'Daftar sementara dengan Traditional and Complementary Medicine Council (kecuali jika dikecualikan).',
  'Daftar sebagai pengamal dalam bidang amalan yang diiktiraf.',
  'Miliki sijil amalan yang sah sebelum mula beramal.'
]

const zhTcmRoute = [
  '取得 Traditional and Complementary Medicine Council 认可的脊椎治疗学士学位或同等资格。',
  '向 Traditional and Complementary Medicine Council 办理临时注册（获豁免者除外）。',
  '在认可的执业领域注册为从业者。',
  '开始执业前，须持有有效的执业证书。'
]

const msProfessionRoutes: Record<string, string[]> = {
  lawyer: [
    'Menjadi “qualified person”: memperoleh ijazah undang-undang yang dikecualikan atau dipanggil ke English Bar, atau ijazah undang-undang yang diiktiraf LPQB serta CLP.',
    'Lulus atau mendapat pengecualian daripada Bahasa Malaysia Qualifying Examination.',
    'Failkan petisyen kemasukan dan jalani latihan dalam kamar selama sembilan bulan di bawah seliaan seorang peguam penyelia.',
    'Diterima masuk oleh High Court sebagai peguam bela dan peguam cara.',
    'Miliki sijil amalan yang sah sebelum menjalankan amalan.'
  ],
  'judge-magistrate': [
    'Layak sebagai peguam: pegawai undang-undang dalam Judicial and Legal Service ialah “qualified persons” di bawah Legal Profession Act 1976.',
    'Sertai Judicial and Legal Service; hakim Sessions Court dan Majistret Kelas Pertama mestilah anggotanya.',
    'Untuk High Court dan mahkamah lebih tinggi: berkhidmat selama sepuluh tahun sebagai peguam bela atau dalam judicial and legal service.',
    'Dilantik ke badan kehakiman; jawatan kehakiman diberikan melalui pelantikan, bukan lesen.'
  ],
  'medical-doctor': [
    'Dapatkan ijazah perubatan asas yang diiktiraf MMC (Second Schedule), atau ijazah perubatan lain berserta peperiksaan yang ditetapkan.',
    'Dapatkan pendaftaran sementara dengan MMC selepas menerima tawaran latihan siswazah.',
    'Jalani latihan siswazah di hospital yang diluluskan: sekurang-kurangnya setahun menurut undang-undang; program MMC berlangsung selama dua tahun.',
    'Dapatkan pendaftaran penuh selepas MMC mengesahkan latihan siswazah.',
    'Sebelum menjalankan amalan, miliki sijil amalan tahunan dan perlindungan indemniti profesional.',
    'Pakar: lengkapkan latihan dan kelayakan kepakaran yang diiktiraf, kemudian daftar dalam Specialist Register.'
  ],
  dentist: [
    'Dapatkan kelayakan pergigian: ijazah tempatan yang diakreditasi atau latihan luar negara yang memenuhi piawaian Council.',
    'Lulus Professional Qualifying Examination (sesetengah kelayakan lama dikecualikan sehingga 31 Disember 2026).',
    'Daftar dengan Malaysian Dental Council sebagai pakar bedah pergigian.',
    'Sebelum menjalankan amalan, miliki sijil amalan yang sah (mata CPD dan perlindungan indemniti diperlukan).',
    'Pakar: dapatkan kelayakan pascasiswazah yang diluluskan MDC, kemudian daftar sebagai pakar pergigian.'
  ],
  pharmacist: [
    'Dapatkan kelayakan farmasi yang tersenarai dalam First Schedule Akta atau yang diperakui sesuai oleh Menteri.',
    'Daftar sementara dengan Pharmacy Board.',
    'Bekerja sekurang-kurangnya setahun sebagai ahli farmasi berdaftar sementara di premis yang diluluskan (boleh dilanjutkan sehingga setahun).',
    'Dapatkan pendaftaran penuh, kemudian perbaharui sijil tahunan untuk kekal dalam daftar.'
  ],
  'registered-nurse': [
    'Selesaikan latihan jururawat yang ditetapkan di institusi yang diluluskan Nursing Board.',
    'Lulus peperiksaan akhir Nursing Board untuk pendaftaran.',
    'Daftar dengan Nursing Board dalam bahagian Daftar yang berkaitan.'
  ],
  midwife: [
    'Lulus peperiksaan kelayakan Midwives Board atau miliki kelayakan kebidanan yang diterima oleh Board.',
    'Daftar dengan Midwives Board sebelum menjalankan amalan kebidanan.'
  ],
  engineer: [
    'Dapatkan ijazah kejuruteraan yang diiktiraf BEM (contohnya akreditasi EAC atau Washington Accord).',
    'Daftar dengan BEM sebagai Graduate Engineer sebelum mengambil kerja yang melibatkan khidmat kejuruteraan profesional.',
    'Dapatkan pengalaman praktikal; BEM meminta pengalaman tiga tahun sebagai Graduate Engineer berdaftar.',
    'Lulus Professional Assessment Examination BEM atau menjadi ahli Korporat IEM.',
    'Daftar dengan BEM sebagai Professional Engineer (Ir.); lulus Professional Competency Examination untuk Sijil Amalan.'
  ],
  architect: [
    'Dapatkan kelayakan seni bina Part I dan Part II yang diiktiraf LAM atau lulus peperiksaan Part I dan II LAM.',
    'Daftar dengan LAM sebagai Graduate Architect.',
    'Jalani pengalaman praktikal sekurang-kurangnya dua tahun (104 minggu) selepas pendaftaran.',
    'Lulus LAM Part III Professional Examination.',
    'Daftar dengan LAM sebagai Architect (Ar.); anda mesti telah tinggal di Malaysia selama enam bulan sebelum memohon.'
  ],
  'interior-designer': [
    'Dapatkan ijazah reka bentuk dalaman yang diakreditasi LAM (atau seni bina LAM Part I atau II), atau lulus Qualifying Assessment LAM.',
    'Daftar dengan LAM sebagai Graduate Interior Designer.',
    'Dapatkan pengalaman praktikal dan lulus peperiksaan yang ditetapkan LAM.',
    'Daftar sebagai Interior Designer; ahli Korporat MIID boleh mendaftar terus.'
  ],
  'quantity-surveyor': [
    'Dapatkan ijazah ukur bahan yang diakreditasi BQSM.',
    'Daftar sebagai Provisional Quantity Surveyor dan sertai Royal Institution of Surveyors Malaysia (RISM).',
    'Jalani pengalaman diselia selama dua tahun di bawah PQS atau CQS (tiga tahun jika penyelia dari luar organisasi).',
    'Lulus BQSM Assessment of Professional Competence: buku log, laporan analisis kritikal dan temu duga.',
    'Daftar sebagai Professional Quantity Surveyor.'
  ],
  'land-surveyor': [
    'Dapatkan ijazah ukur tanah atau geomatik yang diiktiraf Land Surveyors Board.',
    'Jalani latihan articled selama dua tahun di bawah juruukur tanah berlesen yang telah berdaftar sekurang-kurangnya lima tahun.',
    'Lulus peperiksaan Part I Cadastral Practice Board, tugasan praktikal, peperiksaan lisan dan praktikal serta viva voce.',
    'Daftar, kemudian miliki lesen tahunan untuk menjalankan amalan.'
  ],
  accountant: [
    'Dapatkan kelayakan perakaunan yang diiktiraf (First Schedule Part I), lulus MIA Qualifying Examination atau menjadi ahli badan yang diiktiraf (Part II).',
    'Dapatkan pengalaman kerja berkaitan sekurang-kurangnya tiga tahun (laluan CARE MIA bagi laluan Part I dan QE).',
    'Daftar dengan MIA sebagai Chartered Accountant, C.A.(M).',
    'Untuk mengaudit syarikat: miliki sijil amalan MIA dan kelulusan sebagai juruaudit syarikat daripada Menteri Kewangan.'
  ],
  'tax-agent': [
    'Jadilah akauntan profesional atau individu yang boleh diluluskan oleh Menteri Kewangan.',
    'Mohon kelulusan Menteri Kewangan sebagai ejen cukai; kelulusan sah sekurang-kurangnya 24 bulan dan perlu diperbaharui.'
  ],
  veterinarian: [
    'Dapatkan ijazah veterinar yang tersenarai dalam Second Schedule Akta.',
    'Daftar dengan Malaysian Veterinary Council.',
    'Sebelum menjalankan amalan di premis yang diluluskan, miliki sijil amalan tahunan.'
  ],
  optometrist: [
    'Dapatkan kelayakan optometri yang tersenarai dalam Second Schedule Akta (ijazah sarjana muda atau doktor optometri).',
    'Daftar dengan Malaysian Optical Council sebagai optometris.',
    'Sebelum menjalankan amalan, miliki sijil amalan tahunan.'
  ],
  optician: [
    'Dapatkan kelayakan optik atau optometri yang tersenarai dalam First Schedule Akta (kebanyakannya diploma).',
    'Daftar dengan Malaysian Optical Council sebagai optician.',
    'Sebelum menjalankan amalan, miliki sijil amalan tahunan.'
  ],
  physiotherapist: msAlliedHealthRoute,
  'occupational-therapist': msAlliedHealthRoute,
  'speech-language-therapist': msAlliedHealthRoute,
  audiologist: msAlliedHealthRoute,
  'dietitian-nutritionist': msAlliedHealthRoute,
  'clinical-psychologist': msAlliedHealthRoute,
  'diagnostic-radiographer': msAlliedHealthRoute,
  'radiation-therapist': msAlliedHealthRoute,
  'medical-laboratory-scientist': msAlliedHealthRoute,
  'medical-laboratory-technologist': msAlliedHealthRoute,
  'dental-technologist': msAlliedHealthRoute,
  'health-education-officer': msAlliedHealthRoute,
  counsellor: [
    'Dapatkan kelayakan kaunseling yang tersenarai dalam Second Schedule Akta atau yang diterima setara oleh Board.',
    'Daftar dengan Board of Counsellors (warganegara Malaysia atau pemastautin tetap berumur sekurang-kurangnya 21 tahun).',
    'Miliki sijil amalan yang sah dan perbaharuinya setiap dua tahun.'
  ],
  'medical-assistant': [
    'Selesaikan kursus latihan yang ditetapkan dan lulus peperiksaan di institusi atau pusat latihan yang diluluskan Board.',
    'Daftar dengan Medical Assistants (Registration) Board sebelum bekerja sebagai pembantu perubatan.'
  ],
  teacher: [
    'Miliki kelayakan perguruan yang dianggap mencukupi oleh Registrar General.',
    'Daftar sebagai guru dengan Registrar General atau miliki permit mengajar sementara menunggu permohonan.',
    'Guru sekolah kerajaan menyertai Education Service, yang dikecualikan daripada pendaftaran.'
  ],
  valuer: [
    'Dapatkan ijazah penilaian yang diiktiraf Board atau lulus peperiksaan Board.',
    'Daftar sebagai Probationary Valuer dan untuk Test of Professional Competence.',
    'Jalani latihan praktikal di Malaysia selama dua tahun di bawah penilai berdaftar.',
    'Lulus ujian lisan Test of Professional Competence, daftar sebagai valuer dan dapatkan kebenaran untuk menjalankan amalan.'
  ],
  'estate-agent': [
    'Lulus Board Estate Agent’s Examination Part I dan II atau miliki ijazah hartanah yang memberikan pengecualian.',
    'Daftar sebagai Probationary Estate Agent dan untuk Test of Professional Competence.',
    'Jalani latihan praktikal di Malaysia selama dua tahun di bawah ejen hartanah berdaftar.',
    'Lulus ujian lisan Test of Professional Competence, daftar sebagai ejen hartanah dan dapatkan kebenaran untuk menjalankan amalan.'
  ],
  'property-manager': [
    'Dapatkan ijazah yang diiktiraf Board atau lulus Professional Qualifying Examination for Property Managers Board.',
    'Daftar sebagai Probationary Property Manager dan simpan buku log sekurang-kurangnya dua tahun.',
    'Serahkan buku log dan tugasan praktikal, kemudian lulus temu duga Test of Professional Competence.',
    'Daftar sebagai property manager dan dapatkan kebenaran untuk menjalankan amalan.'
  ],
  electrician: [
    'Tamatkan Tingkatan Lima dan dapatkan pengalaman pendawaian selama dua tahun dengan kontraktor elektrik berdaftar atau unit pendawaian swasta.',
    'Lulus peperiksaan kompetensi wireman Suruhanjaya Tenaga (pemegang SKM Tahap 2 boleh dikecualikan bagi PW1).',
    'Dapatkan Certificate of Competency (gred PW1 hingga PW4) daripada Suruhanjaya Tenaga.'
  ],
  pilot: [
    'Berumur sekurang-kurangnya 18 tahun, boleh berbahasa Inggeris, memperoleh kredit SPM dalam lima mata pelajaran (atau ijazah diiktiraf MQA) dan lulus pemeriksaan perubatan Kelas 1.',
    'Jalani latihan di organisasi latihan penerbangan yang diluluskan CAAM.',
    'Lulus peperiksaan pengetahuan teori dan ujian kemahiran.',
    'Dapatkan Commercial Pilot Licence daripada CAAM; kapten syarikat penerbangan kemudian memerlukan Airline Transport Pilot Licence (umur 21 tahun ke atas).'
  ],
  'air-traffic-controller': [
    'Selesaikan kursus latihan yang diluluskan oleh Director General CAAM.',
    'Lulus peperiksaan dan ujian yang ditetapkan Director General.',
    'Miliki lesen pengawal trafik udara dengan rating yang betul; pelatih hanya boleh bekerja di bawah penyeliaan langsung.'
  ],
  'financial-planner': [
    'Dapatkan ijazah atau kelayakan profesional yang diiktiraf kerajaan Malaysia, atau pengalaman berkaitan selama lima tahun.',
    'Dapatkan kelayakan perancangan yang diterima SC: CFP atau IFP (FPAM), RFP atau Shariah RFP (MFPC), atau ChFC (MFPAA), berserta keahlian.',
    'Bekerja sebagai wakil firma yang mempunyai lesen perancangan kewangan.',
    'Miliki Capital Markets Services Representative’s Licence untuk perancangan kewangan daripada SC.'
  ],
  chiropractor: msTcmRoute,
  'tcm-practitioner': [
    'Dapatkan Ijazah Sarjana Muda perubatan tradisional Cina atau akupunktur, moksibusi dan tuina yang diiktiraf Council.',
    'Daftar sementara dengan Traditional and Complementary Medicine Council (kecuali jika dikecualikan).',
    'Daftar sebagai pengamal dalam bidang amalan yang diiktiraf.',
    'Miliki sijil amalan yang sah sebelum mula beramal.'
  ],
  naturopath: [
    'Dapatkan Ijazah Sarjana Muda Naturopathy and Yogic Sciences atau kelayakan setara yang diiktiraf Council.',
    'Daftar sementara dengan Traditional and Complementary Medicine Council (kecuali jika dikecualikan).',
    'Daftar sebagai pengamal dalam bidang amalan yang diiktiraf.',
    'Miliki sijil amalan yang sah sebelum mula beramal.'
  ]
}

const zhProfessionRoutes: Record<string, string[]> = {
  lawyer: [
    '成为“qualified person”：取得可获豁免的法律学位或获 English Bar 接纳，或取得 LPQB 认可的法律学位并完成 CLP。',
    '通过 Bahasa Malaysia Qualifying Examination，或获准免考。',
    '提交入行申请，并在导师指导下完成九个月的律师实习。',
    '获 High Court 接纳为 advocate and solicitor。',
    '开始执业前，须持有有效的执业证书。'
  ],
  'judge-magistrate': [
    '先取得律师资格：Judicial and Legal Service 的法律官员依据 Legal Profession Act 1976 属于“qualified persons”。',
    '加入 Judicial and Legal Service；Sessions Court 法官和一级推事必须是该服务的成员。',
    '申请 High Court 或更高法院职位：须有十年律师或司法法律服务经验。',
    '获任命进入司法机构；司法职务由任命产生，不靠执照取得。'
  ],
  'medical-doctor': [
    '取得 MMC 认可的基础医学学位（Second Schedule），或取得其他医学学位并通过指定考试。',
    '获得住院实习职位后，向 MMC 办理临时注册。',
    '在获批医院完成住院实习：法律规定至少一年；MMC 课程为两年。',
    '住院实习获 MMC 认证后，办理正式注册。',
    '开始执业前，须持有年度执业证书和专业赔偿保障。',
    '专科医生：完成获认可的专科培训和资格，再登记于 Specialist Register。'
  ],
  dentist: [
    '取得牙科资格：获认可的本地学位，或符合 Council 标准的海外培训。',
    '通过 Professional Qualifying Examination（部分旧资格可豁免至 2026 年 12 月 31 日）。',
    '向 Malaysian Dental Council 注册为牙科医生。',
    '开始执业前，须持有有效的执业证书（需具备 CPD 积分和专业赔偿保障）。',
    '专科医生：取得 MDC 认可的研究生资格，再注册为牙科专科医生。'
  ],
  pharmacist: [
    '取得 Act 的 First Schedule 所列药学资格，或取得部长认定合适的资格。',
    '向 Pharmacy Board 办理临时注册。',
    '在获批场所担任临时注册药剂师至少一年（可延长最多一年）。',
    '办理正式注册，之后每年续证以保留注册资格。'
  ],
  'registered-nurse': [
    '在 Nursing Board 批准的机构完成规定的护士培训。',
    '通过 Nursing Board 的注册最终考试。',
    '在相关名册类别向 Nursing Board 注册。'
  ],
  midwife: [
    '通过 Midwives Board 资格考试，或取得 Board 接受的助产资格。',
    '开始助产工作前，先向 Midwives Board 注册。'
  ],
  engineer: [
    '取得 BEM 认可的工程学位（例如获 EAC 认证或符合 Washington Accord）。',
    '从事专业工程服务之前，先向 BEM 注册为 Graduate Engineer。',
    '累积实际经验；BEM 要求注册 Graduate Engineer 具备三年经验。',
    '通过 BEM Professional Assessment Examination，或成为 IEM Corporate Member。',
    '向 BEM 注册为 Professional Engineer (Ir.)，并通过 Professional Competency Examination 以申请执业证书。'
  ],
  architect: [
    '取得 LAM 认可的 Part I 和 Part II 建筑资格，或通过 LAM 的 Part I 和 II 考试。',
    '向 LAM 注册为 Graduate Architect。',
    '注册后完成至少两年（104 周）的实务经验。',
    '通过 LAM Part III Professional Examination。',
    '向 LAM 注册为 Architect (Ar.)；申请前须在马来西亚居住六个月。'
  ],
  'interior-designer': [
    '取得 LAM 认证的室内设计学位（或 LAM Part I 或 II 建筑资格），或通过 LAM Qualifying Assessment。',
    '向 LAM 注册为 Graduate Interior Designer。',
    '累积实务经验并通过 LAM 指定的考试。',
    '注册为 Interior Designer；MIID Corporate Member 可直接注册。'
  ],
  'quantity-surveyor': [
    '取得 BQSM 认证的工料测量学位。',
    '注册为 Provisional Quantity Surveyor，并加入 Royal Institution of Surveyors Malaysia (RISM)。',
    '在 PQS 或 CQS 指导下完成两年经验（外部导师则须三年）。',
    '通过 BQSM Assessment of Professional Competence：提交日志、批判分析报告并参加面试。',
    '注册为 Professional Quantity Surveyor。'
  ],
  'land-surveyor': [
    '取得 Land Surveyors Board 认可的土地测量或地理信息学位。',
    '在注册满五年的持牌土地测量师指导下完成两年见习。',
    '通过 Board Part I Cadastral Practice 考试、实务任务、口试和实操考试，以及 viva voce。',
    '完成注册后，每年续领执业执照。'
  ],
  accountant: [
    '取得认可的会计资格（First Schedule Part I）、通过 MIA Qualifying Examination，或成为认可机构的会员（Part II）。',
    '累积至少三年相关工作经验（Part I 和 QE 路径可参加 MIA CARE 计划）。',
    '向 MIA 注册为 Chartered Accountant, C.A.(M)。',
    '若要审计公司：取得 MIA 执业证书，并获财政部长批准为公司审计师。'
  ],
  'tax-agent': [
    '成为专业会计师，或成为财政部长愿意批准的人选。',
    '向财政部长申请税务代理人资格；批准期限至少 24 个月，之后须续期。'
  ],
  veterinarian: [
    '取得 Act 的 Second Schedule 所列兽医学位。',
    '向 Malaysian Veterinary Council 注册。',
    '在获批场所执业前，须持有年度执业证书。'
  ],
  optometrist: [
    '取得 Act 的 Second Schedule 所列验光资格（学士或验光博士学位）。',
    '向 Malaysian Optical Council 注册为 optometrist。',
    '开始执业前，须持有年度执业证书。'
  ],
  optician: [
    '取得 Act 的 First Schedule 所列配镜或验光资格（多数为文凭）。',
    '向 Malaysian Optical Council 注册为 optician。',
    '开始执业前，须持有年度执业证书。'
  ],
  physiotherapist: zhAlliedHealthRoute,
  'occupational-therapist': zhAlliedHealthRoute,
  'speech-language-therapist': zhAlliedHealthRoute,
  audiologist: zhAlliedHealthRoute,
  'dietitian-nutritionist': zhAlliedHealthRoute,
  'clinical-psychologist': zhAlliedHealthRoute,
  'diagnostic-radiographer': zhAlliedHealthRoute,
  'radiation-therapist': zhAlliedHealthRoute,
  'medical-laboratory-scientist': zhAlliedHealthRoute,
  'medical-laboratory-technologist': zhAlliedHealthRoute,
  'dental-technologist': zhAlliedHealthRoute,
  'health-education-officer': zhAlliedHealthRoute,
  counsellor: [
    '取得 Act 的 Second Schedule 所列辅导资格，或取得 Board 接受的同等资格。',
    '向 Board of Counsellors 注册（须为年满 21 岁的马来西亚公民或永久居民）。',
    '持有有效的执业证书，并每两年续期。'
  ],
  'medical-assistant': [
    '在 Board 批准的机构或培训中心完成指定课程并通过指定考试。',
    '受聘为医疗助理之前，先向 Medical Assistants (Registration) Board 注册。'
  ],
  teacher: [
    '取得 Registrar General 认定足够的教学资格。',
    '向 Registrar General 注册为教师，或在申请处理中持有临时教学许可。',
    '政府学校教师改为加入 Education Service，因此可免注册。'
  ],
  valuer: [
    '取得 Board 认可的估值学位，或通过 Board 考试。',
    '注册为 Probationary Valuer，并参加 Test of Professional Competence。',
    '在马来西亚注册估值师指导下完成两年实务培训。',
    '通过 Test of Professional Competence 口试，注册为 valuer 并取得执业授权。'
  ],
  'estate-agent': [
    '通过 Board Estate Agent’s Examination Part I 和 II，或取得可豁免考试的房地产学位。',
    '注册为 Probationary Estate Agent，并参加 Test of Professional Competence。',
    '在马来西亚注册房地产代理指导下完成两年实务培训。',
    '通过 Test of Professional Competence 口试，注册为房地产代理并取得执业授权。'
  ],
  'property-manager': [
    '取得 Board 认可的学位，或通过 Board Professional Qualifying Examination for Property Managers。',
    '注册为 Probationary Property Manager，并至少填写两年日志。',
    '提交日志和实务任务，再通过 Test of Professional Competence 面试。',
    '注册为 property manager 并取得执业授权。'
  ],
  electrician: [
    '完成中五课程，并在注册电气承包商或私人布线单位累积两年布线经验。',
    '通过 Energy Commission 的 wireman 能力考试（SKM Level 2 持有人可获豁免 PW1）。',
    '取得 Energy Commission 颁发的 Certificate of Competency（PW1 至 PW4 级）。'
  ],
  pilot: [
    '年满 18 岁、具备工作英语能力、SPM 五科优等（或 MQA 认可学位），并通过 Class 1 体检。',
    '在 CAAM 批准的飞行训练机构接受培训。',
    '通过理论知识考试和技能测试。',
    '取得 CAAM Commercial Pilot Licence；之后担任航空公司机长还须取得 Airline Transport Pilot Licence（年满 21 岁）。'
  ],
  'air-traffic-controller': [
    '完成 CAAM Director General 批准的培训课程。',
    '通过 Director General 指定的考试和测试。',
    '持有相应评级的空中交通管制员执照；实习人员只能在直接监督下工作。'
  ],
  'financial-planner': [
    '取得马来西亚政府认可的学位或专业资格，或累积五年相关经验。',
    '取得 SC 接受的理财规划资格：CFP 或 IFP (FPAM)、RFP 或 Shariah RFP (MFPC)，或 ChFC (MFPAA)，并成为会员。',
    '受聘为持牌理财规划公司的代表。',
    '取得 SC 颁发的理财规划 Capital Markets Services Representative’s Licence。'
  ],
  chiropractor: zhTcmRoute,
  'tcm-practitioner': [
    '取得 Traditional and Complementary Medicine Council 认可的中医学或针灸、艾灸和推拿学士学位。',
    '向 Traditional and Complementary Medicine Council 办理临时注册（获豁免者除外）。',
    '在认可的执业领域注册为从业者。',
    '开始执业前，须持有有效的执业证书。'
  ],
  naturopath: [
    '取得 Traditional and Complementary Medicine Council 认可的自然疗法与瑜伽科学学士学位或同等资格。',
    '向 Traditional and Complementary Medicine Council 办理临时注册（获豁免者除外）。',
    '在认可的执业领域注册为从业者。',
    '开始执业前，须持有有效的执业证书。'
  ]
}

export const rolesText = defineText(
  {
    card: {
      yourJob: 'Your Job',
      estimatedFitShort: 'est. fit',
      estimatedFit: 'estimated fit',
      fit: 'fit',
      outlook: 'Outlook',
      missing: (skills: string) => `Missing: ${skills}`,
      noGaps: 'No gaps to close'
    },
    rolesView: {
      matched: 'Matched Roles',
      restart: {
        questions: {
          label: 'Answer the Questions',
          speech: 'Finish your 12 questions, then I can find roles that fit.'
        },
        role: { label: 'Pick a Role to Check', speech: 'Pick a role to check first, then I can find roles that fit.' },
        job: { label: 'Choose Your Job', speech: 'Tell me your job first, then I can find roles that fit.' }
      },
      errorTitle: 'Kopi Could Not Open This Job',
      errorBody: 'Reload the page, or choose your job again.',
      loading: 'Finding roles that fit your work…',
      heading: {
        stay: "Your Job's Future",
        target: 'Your Target Role',
        explore: 'Roles You Could Move To',
        default: 'Roles That Fit You'
      },
      intro: {
        fitAndOutlook:
          'Fit is the share of each role’s needed levels you already meet. Outlook comes from DOSM job ads and AI use for that role.',
        widened: ' Roles from your own choices come first.',
        cardSelection: 'The details below and your roadmap follow the highlighted card; pick any card to switch.',
        marketSource: 'Active ads, JobStreet estimates and median pay come from JobStreet ads Kotak’s admins approved'
      },
      chartLabel: (title: string) => `${title}: your level against the level needed, per skill`,
      estimatedSkill: (skill: string) => `${skill} (est.)`,
      chartYou: 'You',
      chartNeeded: 'Needed',
      chartRow: (skill: string, you: string, needed: string) => `${skill}: you ${you}, needed ${needed}`,
      fitBySkill: 'Fit by skill',
      fitTableCaption: 'Your level, needed level and counted level per skill',
      skills: 'Skill',
      counts: 'Counts',
      estimated: 'Estimated',
      fitMaths: 'How Fit Is Worked Out',
      fitDetail: (numerator: string, denominator: string, title: string, percent: string) =>
        `You meet ${numerator} of ${denominator} needed levels for ${title}, so fit is ${percent}.`,
      fitNotReady: (title: string) => `Fit for ${title} is not ready yet.`,
      fitFormula: (numerator: string, denominator: string, percent: string) =>
        `Fit = sum of min(your level, needed level) ÷ sum of needed levels; here ${numerator} / ${denominator} gives ${percent}.`,
      estimatedFrom: (title: string) => `Your levels here are estimated from your ${title} answers.`,
      seeMaths: 'See the Maths',
      whyRole: 'Why This Role',
      linkedSdgTargets: 'Linked SDG Targets',
      buildRoadmap: 'Build My Roadmap',
      notePicked: 'You picked this role.',
      notePlan: 'Your roadmap is for this role.',
      noteTarget: 'Picked for you: the role you said you want.',
      noteRising: (count: number, beside: boolean, rising: string) => {
        const besideJob = beside ? ' besides your job' : ''
        return count === 1
          ? `Picked for you: the only ${rising} role${besideJob}.`
          : `Picked for you: your best fit of the ${count} ${rising} roles${besideJob}.`
      },
      noteFit: (rising: string) => `Picked for you: your best fit, as none is ${rising}.`
    },
    kopi: {
      qualifiedFocus: (title: string, estimated: boolean, fit: number, needsQualification: boolean) =>
        `${title} fits you at ${estimated ? 'an estimated ' : ''}${fit}%. ${
          needsQualification
            ? 'It also needs a set qualification in Malaysia, so weigh the fit before you commit to the degree.'
            : 'It is regulated in Malaysia, so check the steps below as well.'
        }`,
      focus: (title: string, estimated: boolean, fit: number, gap: string | undefined) =>
        `${title} fits you at ${estimated ? 'an estimated ' : ''}${fit}%. ${
          gap ? `Close ${gap} next.` : 'You already meet every needed level.'
        }`,
      rising: (
        title: string,
        estimated: boolean,
        fit: number,
        rising: string,
        bestTitle: string,
        bestFit: number,
        outlook: string
      ) =>
        `${title} fits you best of the ${rising} roles, at ${estimated ? 'an estimated ' : ''}${fit}%. ${bestTitle} fits best overall, at ${bestFit}%, with a ${outlook} outlook.`,
      best: (title: string, fit: number, estimated: boolean) =>
        `${title} is your best fit at ${estimated ? 'an estimated ' : ''}${fit}%.`,
      noRole: 'No role fit is available yet.',
      noRead: 'No read is available for this role yet.',
      noSkillRead: 'No skill read is available for this role yet.',
      outlookAndGap: (outlook: string, gap: string, hasGap: boolean) =>
        hasGap
          ? `Outlook for this role is ${outlook}, and your biggest gap is ${gap}.`
          : `Outlook for this role is ${outlook}, and you meet every needed level.`,
      strength: (name: string) => `A strength to lean on is ${name}.`
    },
    jobView: {
      opening: 'Opening this job…',
      neededBy: (date: string) => `Needed by ${date}`,
      jobs: 'Jobs',
      checkFit: 'Check My Fit',
      needsTitle: 'What This Job Needs',
      needsCount: (count: number) => `${count} skills and the level each needs, out of 3.`,
      skill: 'Skill',
      trend: 'Trend',
      neededLevel: 'Needed level',
      ofThree: (level: string) => `${level} of 3`,
      radarTitle: 'Radar, Needed Levels',
      radarDescription: 'What the job asks for. No personal data on this chart.',
      mapTitle: 'Where This Job Sits',
      mapWithFit: 'Across: how ready you are for it, from your saved check-up. Up: the job is growing.',
      mapWithoutFit: 'Up: the job is growing. We cannot place it across until you do the check-up.',
      checkupPrompt: 'Do the check-up to see how ready you are.',
      startCheckup: 'Start The Check-Up',
      relatedTitle: 'Related Roles',
      relatedDescription: 'From O*NET, in its order. Fewer than five is fine.',
      noRelated: 'O*NET lists no related roles with data for this job.',
      yourFit: (fit: number) => `Your fit ${fit}%`,
      openJob: 'Open job page'
    },
    access: {
      labels: (status: RoleAccess['status'], education: EducationLevel | null) => {
        if (status === 'degree' && education === 'diploma') return 'Diploma Usually Needed'
        return {
          open: 'Open to You',
          qualify: 'Qualification Needed',
          register: 'Registration Steps Left',
          check_licence: 'Licence Required',
          experience: 'Needs Experience',
          degree: 'Degree Usually Needed'
        }[status]
      },
      summary: {
        experience: (years: number | null) =>
          `Roles that lead others need years in the field first${
            years ? `: US workers in this job say over ${years} years of related experience (O*NET)` : ''
          }.`,
        degree: (education: EducationLevel) => {
          const labels: Record<EducationLevel, string> = {
            secondary: 'SPM or equivalent',
            certificate: 'certificate',
            diploma: 'diploma',
            bachelor: 'bachelor’s degree',
            master: 'master’s degree',
            doctorate: 'doctorate'
          }
          return `US workers in this job say it usually needs a ${labels[education]} (O*NET).`
        }
      },
      fitExplanation: (percent: number, estimated: boolean, title: string, qualification: boolean) =>
        `Your answers meet ${estimated ? 'an estimated ' : ''}${percent}% of the levels ${title} needs. ${
          qualification
            ? 'A high fit says the work suits you and the qualification may be worth it; a low one is worth knowing before you enrol.'
            : 'Weigh that against what the role asks for.'
        }`,
      routeHeading: 'The Route In',
      regulator: 'Who regulates it:',
      checkedAgainst: 'Checked against ',
      sourceSeparator: ', ',
      changingRequirements: '. Requirements change: confirm with the regulator before you enrol.',
      fromOnet:
        'From what US workers report to O*NET. Malaysian employers may ask for less or more; job ads show what they ask for now.'
    },
    market: {
      title: 'Job Ads in Malaysia',
      intro: (reviewed: number, title: string, date: string) =>
        `From ${reviewed.toLocaleString('en-MY')} ${reviewed === 1 ? 'JobStreet ad' : 'JobStreet ads'} Kotak’s admins approved for ${title}, last seen ${date}. This is context: it sets no verdict.`,
      popularityTitle: 'Ads on JobStreet',
      about: (count: number) => `About ${count.toLocaleString('en-MY')}`,
      popularityHeadline: (count: number, rank: string | null) =>
        `About ${count.toLocaleString('en-MY')}${rank ? `, ${rank}` : ''}`,
      popularitySample: (count: number, title: string, approved: string, reviewed: number) =>
        `Estimated from JobStreet’s ${count.toLocaleString('en-MY')} ${count === 1 ? 'ad' : 'ads'} for “${title}”: Kotak’s admins approved ${approved} of the ${reviewed.toLocaleString('en-MY')} they reviewed.`,
      activeAds: 'Active Ads',
      activeAdsCount: (count: number) => `${count.toLocaleString('en-MY')} active ${count === 1 ? 'ad' : 'ads'}`,
      employersSeen: (count: number) =>
        `${count.toLocaleString('en-MY')} ${count === 1 ? 'employer' : 'employers'}, seen in the last 2 weeks of scraping`,
      medianPayLevel: (name: string) => `Median Pay, ${name} Roles`,
      monthly: (amount: string) => `${amount} a month`,
      middleHalf: (p25: string, p75: string) => `Middle half ${p25} to ${p75}, from `,
      payRangeByLevel: (p25: string, p75: string, ads: number, overallMedian: string | null) =>
        `Middle half ${p25} to ${p75}, from ${ads.toLocaleString('en-MY')} ${ads === 1 ? 'ad' : 'ads'} asking for your level that state pay${overallMedian ? `; ${overallMedian} across all levels` : ''}`,
      payRangeAll: (p25: string, p75: string, ads: number) =>
        `Middle half ${p25} to ${p75}, from ${ads.toLocaleString('en-MY')} ${ads === 1 ? 'ad' : 'ads'} that state pay`,
      askingYourLevel: ' asking for your level that state pay',
      allLevelsMedian: 'Median Advertised Pay, All Levels',
      statingPay: ' that state pay',
      tooFewPay: 'Too few ads state pay in ringgit to give a figure.',
      tooFewLevelPay: (level: string) => `Too few ${level} state pay for a figure of their own`,
      levelRoles: (level: JobMarketLevel) => `${level === 'mid' ? 'mid-level' : level} roles`,
      adsCount: (count: number) => `${count.toLocaleString('en-MY')} ${count === 1 ? 'ad' : 'ads'}`,
      payByLevel: 'Pay by Level',
      yourLevel: ' (your level)',
      asks: (text: string) => ` · asks ${text}`,
      tooFewAds: (count: number) =>
        `too few state pay · ${count.toLocaleString('en-MY')} ${count === 1 ? 'ad' : 'ads'}`,
      payLevelNote: (stated: number, unstated: number) =>
        `Each figure is the median monthly pay of the ads that ask for that level. The level is the experience an ad asks for, or its job title when it asks none: ${stated.toLocaleString('en-MY')} ${stated === 1 ? 'active ad says' : 'active ads say'} one, and ${unstated.toLocaleString('en-MY')} ${unstated === 1 ? 'ad doesn’t' : 'ads don’t'}.`,
      whereJobs: 'Where the Jobs Are',
      distribution: (otherStates: number, withoutState: number, remote: number, hybrid: number) =>
        [
          otherStates > 0 &&
            `${otherStates.toLocaleString('en-MY')} ${otherStates === 1 ? 'ad is' : 'ads are'} in other states`,
          withoutState > 0 &&
            `${withoutState.toLocaleString('en-MY')} ${withoutState === 1 ? 'ad names' : 'ads name'} no state`,
          remote > 0 && `${remote.toLocaleString('en-MY')} ${remote === 1 ? 'ad is' : 'ads are'} remote`,
          hybrid > 0 && `${hybrid.toLocaleString('en-MY')} ${hybrid === 1 ? 'ad is' : 'ads are'} hybrid`
        ]
          .filter(Boolean)
          .join('; ') + '.',
      toolsNamed: 'Tools the Ads Name',
      languagesAsked: 'Languages the Ads Ask For',
      aiInAds: 'AI in the Ads',
      skillSeparator: ', ',
      aiShare: (share: string, skills: string) =>
        `${share} of ads mention AI${skills ? `, most often ${skills}` : ''}.`,
      noAi: 'None of the ads Kotak read mention AI.',
      sharesOfAds: (count: number) =>
        `Shares are of the ${count.toLocaleString('en-MY')} ${count === 1 ? 'active ad' : 'active ads'} Kotak read.`,
      skillCaveat: 'Most ads show only a summary, so a tool can be needed without being named.',
      notEnoughRead: 'Kotak hasn’t read enough of these ads yet to say which tools and languages they ask for.',
      tooFewAdsSkills: 'Too few active ads to say which tools and languages they ask for.',
      benefitsNamed: 'Benefits the Ads Name',
      benefitShare: (count: number) =>
        `Shares are of the ${count.toLocaleString('en-MY')} ${count === 1 ? 'active ad' : 'active ads'} whose JobStreet card lists the employer’s selling points.`,
      benefitCaveat: 'Most cards list none, so a benefit can be offered without being named.',
      noBenefits: (count: number) =>
        `None of the selling points on ${count.toLocaleString('en-MY')} ${count === 1 ? 'active ad' : 'active ads'} name a benefit.`,
      rank: (rank: number, total: number, ordinal: string) =>
        total < 2 ? null : `the ${rank === 1 ? '' : `${ordinal} `}most of the ${total} roles with a JobStreet estimate`,
      rankPopularity: (count: number, rank: string | null) =>
        `about ${count.toLocaleString('en-MY')} on JobStreet${rank ? `, ${rank}` : ''}`,
      payLabel: (amount: string, level: JobMarketLevel | null) =>
        level
          ? `median pay ${amount} a month for ${level === 'mid' ? 'mid-level' : level} roles, by your years of work`
          : `median advertised pay ${amount} a month`,
      levelName: (level: JobMarketLevel) => ({ junior: 'Junior', mid: 'Mid-Level', senior: 'Senior' })[level],
      levelAsk: (level: JobMarketLevel) =>
        ({
          junior: 'under 2 years, or new graduates',
          mid: '2 to 4 years',
          senior: '5 years or more'
        })[level],
      ordinal: (number: number) => rankOrdinal(number)
    },
    quadrant: {
      title: 'Where You Stand',
      description: 'Each dot is a job. Across: how ready you are for it. Up: it is growing.',
      thisJobAria: 'Where this job sits',
      boxes: {
        plan: { name: 'Plan', line: 'Growing, not ready yet. Train for it.' },
        best: { name: 'Best', line: 'Ready and growing. Go for it.' },
        rethink: { name: 'Rethink', line: 'Not ready, shrinking. Avoid.' },
        push: { name: 'Push', line: 'Ready, shrinking. Move soon.' }
      },
      markers: { you: 'Your job', target: 'Your target', suggested: 'Kotak suggests' },
      shortMarkers: { you: 'Your job', target: 'Target', suggested: 'Suggests' },
      thisJob: 'This job',
      noTrend: 'No trend data',
      fitUnknownLower: 'fit unknown',
      fitUnknown: 'Fit unknown',
      fitLower: (fit: number) => `fit ${fit}%`,
      fit: (fit: number) => `Fit ${fit}%`,
      box: ' box',
      neededFirst: (gap: string) => `Needed first: ${gap}`,
      middleLine: 'Middle line',
      notPlaced: 'Not placed',
      higherIsBetter: 'Higher is better',
      thisJobTrend: (trend: string) => `This job: ${trend}`,
      openJobPage: 'Open Job Page',
      openJobTitle: (title: string) => `: ${title}`,
      fitAxis: '0% fit',
      readinessAxis: 'How ready you are',
      targetLegend: 'Your targets',
      textVersion: 'Text version (See the Maths table)',
      textDescription: (rising: string, declining: string, steady: string) =>
        `Across is your fit % (50 or more counts as ready). Up is the job's trend: ${rising} above the middle line, ${declining} below, ${steady} on it, in no box.`,
      role: 'Role',
      marker: 'Marker',
      fitColumn: 'Fit',
      place: 'Place',
      points: (label: string, marker: string, fit: string, trend: string, place: string, box: boolean, gap?: string) =>
        `${label}, ${marker}, ${fit}, ${trend}, ${place}${box ? ' box' : ''}${gap ? `, Needed first: ${gap}` : ''}`,
      gapLabel: (name: string, you: string, needed: string) => `${name} (you ${you}, needed ${needed})`
    },
    reason: (code: CandidateReason, original: string) => {
      const dynamic = (prefix: string, suffix = '') =>
        original.startsWith(prefix) && (!suffix || original.endsWith(suffix))
          ? original.slice(prefix.length, suffix ? -suffix.length : undefined)
          : null
      switch (code) {
        case 'target':
          return 'You chose this role'
        case 'area': {
          const area = dynamic('In ')
          return area === null ? original : `In ${area}`
        }
        case 'field': {
          const field = dynamic('Your ', ' study leads here')
          return field === null ? original : `Your ${field} study leads here`
        }
        case 'interests':
          return 'Matches what you enjoy'
        case 'activity_area': {
          const areas = dynamic('Your picks point to ')
          return areas === null ? original : `Your picks point to ${areas}`
        }
        case 'job_related':
          return 'Related to your job'
        case 'related': {
          const title = dynamic('Related to ')
          return title === null ? original : `Related to ${title}`
        }
        case 'current':
          return original
      }
    },
    benefits: {} as Record<string, string>,
    professionRoutes: {} as Record<string, string[]>
  },
  {
    card: {
      yourJob: 'Pekerjaan Anda',
      estimatedFitShort: 'anggaran',
      estimatedFit: 'padanan anggaran',
      fit: 'padanan',
      outlook: 'Prospek',
      missing: (skills) => `Kurang: ${skills}`,
      noGaps: 'Tiada jurang untuk diatasi'
    },
    rolesView: {
      matched: 'Peranan yang Sepadan',
      restart: {
        questions: {
          label: 'Jawab Soalan',
          speech: 'Jawab 12 soalan anda dahulu supaya saya boleh mencari peranan yang sesuai.'
        },
        role: {
          label: 'Pilih Peranan untuk Disemak',
          speech: 'Pilih peranan untuk disemak dahulu supaya saya boleh mencari yang sesuai.'
        },
        job: {
          label: 'Pilih Pekerjaan Anda',
          speech: 'Beritahu saya pekerjaan anda dahulu supaya saya boleh mencari peranan yang sesuai.'
        }
      },
      errorTitle: 'Kopi Tidak Dapat Membuka Pekerjaan Ini',
      errorBody: 'Muat semula laman atau pilih pekerjaan anda sekali lagi.',
      loading: 'Mencari peranan yang sesuai dengan pekerjaan anda…',
      heading: {
        stay: 'Masa Depan Pekerjaan Anda',
        target: 'Peranan Sasaran Anda',
        explore: 'Peranan yang Boleh Anda Terokai',
        default: 'Peranan yang Sesuai untuk Anda'
      },
      intro: {
        fitAndOutlook:
          'Padanan menunjukkan bahagian tahap yang diperlukan bagi setiap peranan yang sudah anda capai. Prospek berdasarkan iklan kerja DOSM dan penggunaan AI untuk peranan itu.',
        widened: ' Peranan daripada pilihan anda sendiri dipaparkan dahulu.',
        cardSelection:
          'Butiran di bawah dan peta jalan anda mengikut kad yang diserlahkan; pilih mana-mana kad untuk menukarnya.',
        marketSource:
          'Iklan aktif, anggaran JobStreet dan gaji median berdasarkan iklan JobStreet yang diluluskan oleh pentadbir Kotak'
      },
      chartLabel: (title) => `${title}: tahap anda berbanding tahap yang diperlukan bagi setiap kemahiran`,
      estimatedSkill: (skill) => `${skill} (anggaran)`,
      chartYou: 'Anda',
      chartNeeded: 'Diperlukan',
      chartRow: (skill, you, needed) => `${skill}: anda ${you}, diperlukan ${needed}`,
      fitBySkill: 'Padanan mengikut kemahiran',
      fitTableCaption: 'Tahap anda, tahap yang diperlukan dan tahap yang dikira bagi setiap kemahiran',
      skills: 'Kemahiran',
      counts: 'Dikira',
      estimated: 'Anggaran',
      fitMaths: 'Cara Padanan Dikira',
      fitDetail: (numerator, denominator, title, percent) =>
        `Anda memenuhi ${numerator} daripada ${denominator} tahap yang diperlukan untuk ${title}, jadi padanannya ialah ${percent}.`,
      fitNotReady: (title) => `Padanan untuk ${title} belum tersedia.`,
      fitFormula: (numerator, denominator, percent) =>
        `Padanan = jumlah tahap anda yang dikira ÷ jumlah tahap diperlukan; di sini ${numerator} / ${denominator} menghasilkan ${percent}.`,
      estimatedFrom: (title) => `Tahap anda di sini dianggarkan daripada jawapan anda tentang pekerjaan ${title}.`,
      seeMaths: 'Lihat Kiraan',
      whyRole: 'Mengapa Peranan Ini',
      linkedSdgTargets: 'Sasaran SDG Berkaitan',
      buildRoadmap: 'Bina Peta Jalan Saya',
      notePicked: 'Anda memilih peranan ini.',
      notePlan: 'Peta jalan anda adalah untuk peranan ini.',
      noteTarget: 'Dipilih untuk anda: peranan yang anda mahukan.',
      noteRising: (count, beside, rising) => {
        const besideJob = beside ? ' selain pekerjaan anda' : ''
        return count === 1
          ? `Dipilih untuk anda: satu-satunya peranan yang ${rising}${besideJob}.`
          : `Dipilih untuk anda: padanan terbaik daripada ${count} peranan yang ${rising}${besideJob}.`
      },
      noteFit: (rising) => `Dipilih untuk anda: padanan terbaik kerana tiada yang ${rising}.`
    },
    kopi: {
      qualifiedFocus: (title, estimated, fit, needsQualification) =>
        `${title} sepadan dengan anda pada ${estimated ? 'anggaran ' : ''}${fit}%. ${
          needsQualification
            ? 'Peranan ini juga memerlukan kelayakan tertentu di Malaysia. Pertimbangkan padanan ini sebelum anda mengambil ijazah.'
            : 'Peranan ini dikawal selia di Malaysia. Semak juga langkah di bawah.'
        }`,
      focus: (title, estimated, fit, gap) =>
        `${title} sepadan dengan anda pada ${estimated ? 'anggaran ' : ''}${fit}%. ${
          gap ? `Tutup jurang ${gap} seterusnya.` : 'Anda sudah memenuhi semua tahap yang diperlukan.'
        }`,
      rising: (title, estimated, fit, rising, bestTitle, bestFit, outlook) =>
        `${title} paling sesuai antara peranan yang ${rising}, dengan padanan ${estimated ? 'anggaran ' : ''}${fit}%. ${bestTitle} pula padanan terbaik keseluruhan, pada ${bestFit}%, dengan prospek ${outlook}.`,
      best: (title, fit, estimated) =>
        `${title} paling sesuai untuk anda dengan padanan ${estimated ? 'anggaran ' : ''}${fit}%.`,
      noRole: 'Padanan peranan belum tersedia.',
      noRead: 'Maklumat untuk peranan ini belum tersedia.',
      noSkillRead: 'Maklumat kemahiran untuk peranan ini belum tersedia.',
      outlookAndGap: (outlook, gap, hasGap) =>
        hasGap
          ? `Prospek peranan ini ${outlook}, dan jurang terbesar anda ialah ${gap}.`
          : `Prospek peranan ini ${outlook}, dan anda memenuhi semua tahap yang diperlukan.`,
      strength: (name) => `Kekuatan yang boleh anda gunakan ialah ${name}.`
    },
    jobView: {
      opening: 'Membuka pekerjaan ini…',
      neededBy: (date) => `Diperlukan menjelang ${date}`,
      jobs: 'Pekerjaan',
      checkFit: 'Semak Padanan Saya',
      needsTitle: 'Keperluan Pekerjaan Ini',
      needsCount: (count) => `${count} kemahiran dan tahap yang diperlukan bagi setiap satu, daripada 3.`,
      skill: 'Kemahiran',
      trend: 'Trend',
      neededLevel: 'Tahap diperlukan',
      ofThree: (level) => `${level} daripada 3`,
      radarTitle: 'Radar, Tahap Diperlukan',
      radarDescription: 'Keperluan pekerjaan ini. Carta ini tidak menggunakan data peribadi.',
      mapTitle: 'Kedudukan Pekerjaan Ini',
      mapWithFit:
        'Melintang: tahap kesediaan anda berdasarkan semakan yang disimpan. Ke atas: pekerjaan ini sedang berkembang.',
      mapWithoutFit:
        'Ke atas: pekerjaan ini sedang berkembang. Kedudukannya secara melintang belum dapat ditentukan sehingga anda membuat semakan.',
      checkupPrompt: 'Buat semakan untuk melihat tahap kesediaan anda.',
      startCheckup: 'Mulakan Semakan',
      relatedTitle: 'Peranan Berkaitan',
      relatedDescription: 'Mengikut susunan O*NET. Tiada masalah jika kurang daripada lima.',
      noRelated: 'O*NET tiada data untuk peranan berkaitan dengan pekerjaan ini.',
      yourFit: (fit) => `Padanan anda ${fit}%`,
      openJob: 'Buka laman pekerjaan'
    },
    access: {
      labels: (status, education) => {
        if (status === 'degree' && education === 'diploma') return 'Diploma Biasanya Diperlukan'
        return {
          open: 'Terbuka untuk Anda',
          qualify: 'Kelayakan Diperlukan',
          register: 'Langkah Pendaftaran Belum Selesai',
          check_licence: 'Lesen Diperlukan',
          experience: 'Pengalaman Diperlukan',
          degree: 'Ijazah Biasanya Diperlukan'
        }[status]
      },
      summary: {
        experience: (years) =>
          `Peranan yang menyelia orang lain memerlukan pengalaman kerja dahulu${
            years
              ? `: pekerja di AS dalam pekerjaan ini menyatakan lebih daripada ${years} tahun pengalaman berkaitan (O*NET)`
              : ''
          }.`,
        degree: (education) => {
          const labels: Record<EducationLevel, string> = {
            secondary: 'SPM atau setara',
            certificate: 'sijil',
            diploma: 'diploma',
            bachelor: 'ijazah sarjana muda',
            master: 'ijazah sarjana',
            doctorate: 'ijazah kedoktoran'
          }
          return `Pekerja di AS dalam pekerjaan ini menyatakan bahawa biasanya ia memerlukan ${labels[education]} (O*NET).`
        }
      },
      fitExplanation: (percent, estimated, title, qualification) =>
        `Jawapan anda memenuhi ${estimated ? 'anggaran ' : ''}${percent}% tahap yang diperlukan untuk ${title}. ${
          qualification
            ? 'Padanan tinggi menunjukkan pekerjaan ini sesuai untuk anda dan kelayakan itu mungkin berbaloi; padanan rendah pula perlu dipertimbangkan sebelum anda mendaftar.'
            : 'Pertimbangkan hal ini bersama keperluan peranan tersebut.'
        }`,
      routeHeading: 'Laluan Kemasukan',
      regulator: 'Pihak yang mengawal selia:',
      checkedAgainst: 'Disemak berdasarkan ',
      sourceSeparator: ', ',
      changingRequirements: '. Syarat boleh berubah: sahkan dengan pihak pengawal selia sebelum mendaftar.',
      fromOnet:
        'Berdasarkan laporan pekerja AS kepada O*NET. Majikan Malaysia mungkin meminta kurang atau lebih; iklan kerja menunjukkan keperluan semasa.'
    },
    market: {
      title: 'Iklan Kerja di Malaysia',
      intro: (reviewed, title, date) =>
        `Daripada ${reviewed.toLocaleString('en-MY')} iklan JobStreet yang diluluskan oleh pentadbir Kotak untuk ${title}, terakhir dilihat pada ${date}. Ini sebagai konteks sahaja; bukan penilaian.`,
      popularityTitle: 'Iklan di JobStreet',
      about: (count) => `Kira-kira ${count.toLocaleString('en-MY')}`,
      popularityHeadline: (count, rank) => `Kira-kira ${count.toLocaleString('en-MY')}${rank ? `, ${rank}` : ''}`,
      popularitySample: (count, title, approved, reviewed) =>
        `Dianggarkan daripada ${count.toLocaleString('en-MY')} iklan JobStreet untuk “${title}”: pentadbir Kotak meluluskan ${approved} daripada ${reviewed.toLocaleString('en-MY')} iklan yang disemak.`,
      activeAds: 'Iklan Aktif',
      activeAdsCount: (count) => `${count.toLocaleString('en-MY')} iklan aktif`,
      employersSeen: (count) =>
        `${count.toLocaleString('en-MY')} majikan, dilihat dalam 2 minggu pengumpulan data yang lalu`,
      medianPayLevel: (name) => `Gaji Median, Peranan ${name}`,
      monthly: (amount) => `${amount} sebulan`,
      middleHalf: (p25, p75) => `Separuh julat tengah ${p25} hingga ${p75}, daripada `,
      payRangeByLevel: (p25, p75, ads, overallMedian) =>
        `Separuh julat tengah ${p25} hingga ${p75}, daripada ${ads.toLocaleString('en-MY')} iklan yang meminta tahap anda dan menyatakan gaji${overallMedian ? `; ${overallMedian} merentas semua tahap` : ''}`,
      payRangeAll: (p25, p75, ads) =>
        `Separuh julat tengah ${p25} hingga ${p75}, daripada ${ads.toLocaleString('en-MY')} iklan yang menyatakan gaji`,
      askingYourLevel: ' yang meminta tahap anda dan menyatakan gaji',
      allLevelsMedian: 'Gaji Median yang Diiklankan, Semua Tahap',
      statingPay: ' yang menyatakan gaji',
      tooFewPay: 'Terlalu sedikit iklan menyatakan gaji dalam ringgit untuk memberikan anggaran.',
      tooFewLevelPay: (level) => `Terlalu sedikit peranan ${level} menyatakan gaji untuk anggaran tersendiri`,
      levelRoles: (level) => `peranan ${level === 'mid' ? 'pertengahan' : level === 'junior' ? 'junior' : 'senior'}`,
      adsCount: (count) => `${count.toLocaleString('en-MY')} iklan`,
      payByLevel: 'Gaji Mengikut Tahap',
      yourLevel: ' (tahap anda)',
      asks: (text) => ` · meminta ${text}`,
      tooFewAds: (count) => `terlalu sedikit iklan menyatakan gaji · ${count.toLocaleString('en-MY')} iklan`,
      payLevelNote: (stated, unstated) =>
        `Setiap angka ialah gaji bulanan median daripada iklan yang meminta tahap itu. Tahap merujuk kepada pengalaman yang diminta atau, jika tiada, jawatan dalam iklan: ${stated.toLocaleString('en-MY')} iklan aktif menyatakannya dan ${unstated.toLocaleString('en-MY')} tidak.`,
      whereJobs: 'Lokasi Pekerjaan',
      distribution: (otherStates, withoutState, remote, hybrid) =>
        [
          otherStates > 0 && `${otherStates.toLocaleString('en-MY')} iklan di negeri lain`,
          withoutState > 0 && `${withoutState.toLocaleString('en-MY')} iklan tidak menyatakan negeri`,
          remote > 0 && `${remote.toLocaleString('en-MY')} iklan membenarkan kerja jarak jauh`,
          hybrid > 0 && `${hybrid.toLocaleString('en-MY')} iklan menawarkan kerja hibrid`
        ]
          .filter(Boolean)
          .join('; ') + '.',
      toolsNamed: 'Alat yang Disebut dalam Iklan',
      languagesAsked: 'Bahasa yang Diminta dalam Iklan',
      aiInAds: 'AI dalam Iklan',
      skillSeparator: ', ',
      aiShare: (share, skills) => `${share} iklan menyebut AI${skills ? `, paling kerap ${skills}` : ''}.`,
      noAi: 'Tiada iklan yang dibaca oleh Kotak menyebut AI.',
      sharesOfAds: (count) =>
        `Peratusan berdasarkan ${count.toLocaleString('en-MY')} iklan aktif yang dibaca oleh Kotak.`,
      skillCaveat: 'Kebanyakan iklan hanya memaparkan ringkasan, jadi alat mungkin diperlukan walaupun tidak disebut.',
      notEnoughRead: 'Kotak belum membaca iklan ini secukupnya untuk menyatakan alat dan bahasa yang diperlukan.',
      tooFewAdsSkills: 'Terlalu sedikit iklan aktif untuk menyatakan alat dan bahasa yang diperlukan.',
      benefitsNamed: 'Faedah yang Disebut dalam Iklan',
      benefitShare: (count) =>
        `Peratusan berdasarkan ${count.toLocaleString('en-MY')} iklan aktif yang menyenaraikan faedah majikan pada kad JobStreet.`,
      benefitCaveat: 'Kebanyakan kad tidak menyenaraikannya, jadi faedah mungkin ditawarkan tanpa disebut.',
      noBenefits: (count) =>
        `Tiada iklan aktif dalam ${count.toLocaleString('en-MY')} iklan yang menyebut faedah dalam butiran majikan.`,
      rank: (_rank, total, ordinal) =>
        total < 2 ? null : `kedudukan ${ordinal} daripada ${total} peranan dengan anggaran JobStreet`,
      rankPopularity: (count, rank) =>
        `kira-kira ${count.toLocaleString('en-MY')} di JobStreet${rank ? `, ${rank}` : ''}`,
      payLabel: (amount, level) =>
        level
          ? `gaji median ${amount} sebulan untuk ${level === 'mid' ? 'peranan pertengahan' : `peranan ${level}`}, mengikut tahun pengalaman kerja anda`
          : `gaji median yang diiklankan ${amount} sebulan`,
      levelName: (level) => ({ junior: 'Junior', mid: 'Pertengahan', senior: 'Senior' })[level],
      levelAsk: (level) =>
        ({
          junior: 'kurang daripada 2 tahun atau graduan baharu',
          mid: '2 hingga 4 tahun',
          senior: '5 tahun atau lebih'
        })[level],
      ordinal: (number) => `ke-${number.toLocaleString('en-MY')}`
    },
    quadrant: {
      title: 'Kedudukan Anda',
      description:
        'Setiap titik mewakili pekerjaan. Melintang: tahap kesediaan anda. Ke atas: pekerjaan itu berkembang.',
      thisJobAria: 'Kedudukan pekerjaan ini',
      boxes: {
        plan: { name: 'Rancang', line: 'Sedang berkembang, belum bersedia. Tingkatkan kemahiran.' },
        best: { name: 'Terbaik', line: 'Bersedia dan berkembang. Teruskan.' },
        rethink: { name: 'Nilai Semula', line: 'Belum bersedia dan merosot. Elakkan.' },
        push: { name: 'Bertindak', line: 'Bersedia tetapi merosot. Bertindak segera.' }
      },
      markers: { you: 'Pekerjaan anda', target: 'Sasaran anda', suggested: 'Cadangan Kotak' },
      shortMarkers: { you: 'Pekerjaan anda', target: 'Sasaran', suggested: 'Cadangan' },
      thisJob: 'Pekerjaan ini',
      noTrend: 'Tiada data trend',
      fitUnknownLower: 'padanan tidak diketahui',
      fitUnknown: 'Padanan tidak diketahui',
      fitLower: (fit) => `padanan ${fit}%`,
      fit: (fit) => `Padanan ${fit}%`,
      box: ' petak',
      neededFirst: (gap) => `Utamakan: ${gap}`,
      middleLine: 'Garis tengah',
      notPlaced: 'Tidak diletakkan',
      higherIsBetter: 'Lebih tinggi lebih baik',
      thisJobTrend: (trend) => `Pekerjaan ini: ${trend}`,
      openJobPage: 'Buka Laman Pekerjaan',
      openJobTitle: (title) => `: ${title}`,
      fitAxis: 'Padanan 0%',
      readinessAxis: 'Tahap kesediaan anda',
      targetLegend: 'Sasaran anda',
      textVersion: 'Versi teks (Lihat jadual Kiraan)',
      textDescription: (rising, declining, steady) =>
        `Melintang menunjukkan padanan anda (50% atau lebih dikira bersedia). Ke atas menunjukkan trend pekerjaan: ${rising} di atas garis tengah, ${declining} di bawah dan ${steady} pada garis itu, tanpa petak.`,
      role: 'Peranan',
      marker: 'Penanda',
      fitColumn: 'Padanan',
      place: 'Kedudukan',
      points: (label, marker, fit, trend, place, box, gap) =>
        `${label}, ${marker}, ${fit}, ${trend}, ${place}${box ? ' petak' : ''}${gap ? `, Utamakan: ${gap}` : ''}`,
      gapLabel: (name, you, needed) => `${name} (anda ${you}, diperlukan ${needed})`
    },
    reason: (code, original) => {
      const dynamic = (prefix: string, suffix = '') =>
        original.startsWith(prefix) && (!suffix || original.endsWith(suffix))
          ? original.slice(prefix.length, suffix ? -suffix.length : undefined)
          : null
      switch (code) {
        case 'target':
          return 'Anda memilih peranan ini'
        case 'area': {
          const area = dynamic('In ')
          return area === null ? original : `Dalam ${area}`
        }
        case 'field': {
          const field = dynamic('Your ', ' study leads here')
          return field === null ? original : `Pengajian ${field} anda membawa ke sini`
        }
        case 'interests':
          return 'Sesuai dengan minat anda'
        case 'activity_area': {
          const areas = dynamic('Your picks point to ')
          return areas === null ? original : `Pilihan anda menunjukkan ${areas}`
        }
        case 'job_related':
          return 'Berkaitan dengan pekerjaan anda'
        case 'related': {
          const title = dynamic('Related to ')
          return title === null ? original : `Berkaitan dengan ${title}`
        }
        case 'current':
          return 'Pekerjaan semasa anda'
      }
    },
    benefits: msBenefits,
    professionRoutes: msProfessionRoutes
  },
  {
    card: {
      yourJob: '你目前的工作',
      estimatedFitShort: '估算匹配度',
      estimatedFit: '估算匹配度',
      fit: '匹配度',
      outlook: '前景',
      missing: (skills) => `待提升：${skills}`,
      noGaps: '没有需要弥补的差距'
    },
    rolesView: {
      matched: '匹配的职位',
      restart: {
        questions: { label: '回答问题', speech: '完成 12 个问题，我就能为你找出合适的职位。' },
        role: { label: '选择要检测的职位', speech: '先选择一个要检测的职位，我就能为你找出合适的职位。' },
        job: { label: '选择你的工作', speech: '先告诉我你目前的工作，我就能为你找出合适的职位。' }
      },
      errorTitle: 'Kopi 无法打开这份工作',
      errorBody: '请重新加载页面，或重新选择你的工作。',
      loading: '正在寻找适合你工作的职位…',
      heading: {
        stay: '你目前工作的未来',
        target: '你的目标职位',
        explore: '你可以转向的职位',
        default: '适合你的职位'
      },
      intro: {
        fitAndOutlook: '匹配度表示你已达到每个职位所需水平的比例。前景依据 DOSM 招聘广告和该职位的 AI 使用情况。',
        widened: ' 你自己选择的职位会优先显示。',
        cardSelection: '下方详情和路线图会跟随突出显示的卡片；选择其他卡片即可切换。',
        marketSource: '活跃招聘广告、JobStreet 估算数据和薪资中位数，来自 Kotak 管理员审核过的 JobStreet 广告'
      },
      chartLabel: (title) => `${title}：你目前的水平与每项技能所需水平的对比`,
      estimatedSkill: (skill) => `${skill}（估算）`,
      chartYou: '你',
      chartNeeded: '所需水平',
      chartRow: (skill, you, needed) => `${skill}：你是 ${you}，所需水平是 ${needed}`,
      fitBySkill: '按技能查看匹配度',
      fitTableCaption: '每项技能的当前水平、所需水平和计入水平',
      skills: '技能',
      counts: '计入水平',
      estimated: '估算',
      fitMaths: '匹配度如何计算',
      fitDetail: (numerator, denominator, title, percent) =>
        `你已达到 ${title} 所需 ${denominator} 个水平中的 ${numerator} 个，因此匹配度为 ${percent}。`,
      fitNotReady: (title) => `还无法计算 ${title} 的匹配度。`,
      fitFormula: (numerator, denominator, percent) =>
        `匹配度 = 你达到的所需水平总和 ÷ 所需水平总和；本例为 ${numerator} / ${denominator}，结果是 ${percent}。`,
      estimatedFrom: (title) => `这里的水平是根据你对 ${title} 的回答估算的。`,
      seeMaths: '查看计算方法',
      whyRole: '为什么推荐这个职位',
      linkedSdgTargets: '关联的 SDG 目标',
      buildRoadmap: '制定我的路线图',
      notePicked: '你选择了这个职位。',
      notePlan: '你的路线图是为这个职位制定的。',
      noteTarget: '为你挑选：你想要的职位。',
      noteRising: (count, beside, rising) => {
        const besideJob = beside ? '，也优于你目前的工作' : ''
        return count === 1
          ? `为你挑选：唯一一个${rising}的职位${besideJob}。`
          : `为你挑选：${count} 个${rising}的职位中最适合你的${besideJob}。`
      },
      noteFit: (rising) => `为你挑选：这是最适合你的职位，因为没有职位呈${rising}趋势。`
    },
    kopi: {
      qualifiedFocus: (title, estimated, fit, needsQualification) =>
        `${title}与你的匹配度为${estimated ? '估算 ' : ''}${fit}%。${
          needsQualification
            ? '在马来西亚，这个职位还需要特定资格。决定攻读学位之前，先衡量匹配度。'
            : '这个职位在马来西亚受监管，也请查看下方的步骤。'
        }`,
      focus: (title, estimated, fit, gap) =>
        `${title}与你的匹配度为${estimated ? '估算 ' : ''}${fit}%。${
          gap ? `接下来弥补 ${gap} 的差距。` : '你已达到所有所需水平。'
        }`,
      rising: (title, estimated, fit, rising, bestTitle, bestFit, outlook) =>
        `${title}在${rising}趋势的职位中最适合你，匹配度为${estimated ? '估算 ' : ''}${fit}%。整体而言，${bestTitle}最适合你，匹配度为 ${bestFit}%，前景${outlook}。`,
      best: (title, fit, estimated) => `${title}最适合你，匹配度为${estimated ? '估算 ' : ''}${fit}%。`,
      noRole: '目前还没有可用的职位匹配结果。',
      noRead: '目前还没有这个职位的分析结果。',
      noSkillRead: '目前还没有这个职位的技能分析结果。',
      outlookAndGap: (outlook, gap, hasGap) =>
        hasGap
          ? `这个职位的前景${outlook}，你最大的差距是 ${gap}。`
          : `这个职位的前景${outlook}，你已达到所有所需水平。`,
      strength: (name) => `你可以发挥的一项优势是 ${name}。`
    },
    jobView: {
      opening: '正在打开这份工作…',
      neededBy: (date) => `预计于 ${date} 需要`,
      jobs: '工作',
      checkFit: '查看我的匹配度',
      needsTitle: '这份工作需要什么',
      needsCount: (count) => `${count} 项技能，以及每项技能所需的水平（最高 3 级）。`,
      skill: '技能',
      trend: '趋势',
      neededLevel: '所需水平',
      ofThree: (level) => `${level} / 3`,
      radarTitle: '雷达图：所需水平',
      radarDescription: '这份工作的要求。图表不使用个人资料。',
      mapTitle: '这份工作的定位',
      mapWithFit: '左右表示你根据已保存的检测结果，对这份工作的准备程度。向上表示工作正在增长。',
      mapWithoutFit: '向上表示工作正在增长。完成检测后，才能确定它在左右方向的位置。',
      checkupPrompt: '完成检测，了解自己准备得如何。',
      startCheckup: '开始检测',
      relatedTitle: '相关职位',
      relatedDescription: '按 O*NET 的顺序排列。少于五个也没关系。',
      noRelated: 'O*NET 没有列出这份工作的相关职位数据。',
      yourFit: (fit) => `你的匹配度：${fit}%`,
      openJob: '打开工作页面'
    },
    access: {
      labels: (status, education) => {
        if (status === 'degree' && education === 'diploma') return '通常需要文凭'
        return {
          open: '你可以从事',
          qualify: '需要相关资格',
          register: '尚需完成注册步骤',
          check_licence: '需要执照',
          experience: '需要工作经验',
          degree: '通常需要学位'
        }[status]
      },
      summary: {
        experience: (years) =>
          `管理他人的职位需要先积累工作经验${
            years ? `：美国从事这份工作的人表示需要超过 ${years} 年相关经验（O*NET）` : ''
          }。`,
        degree: (education) => {
          const labels: Record<EducationLevel, string> = {
            secondary: 'SPM 或同等学历',
            certificate: '证书',
            diploma: '文凭',
            bachelor: '学士学位',
            master: '硕士学位',
            doctorate: '博士学位'
          }
          return `美国从事这份工作的人表示，通常需要${labels[education]}（O*NET）。`
        }
      },
      fitExplanation: (percent, estimated, title, qualification) =>
        `根据你的回答，你已达到 ${title} 所需水平的${estimated ? '估算 ' : ''}${percent}%。${
          qualification
            ? '匹配度高表示这份工作适合你，相关资格可能值得争取；匹配度低则值得在报名之前考虑清楚。'
            : '你也可以结合职位要求来权衡。'
        }`,
      routeHeading: '入行途径',
      regulator: '监管机构：',
      checkedAgainst: '核对来源：',
      sourceSeparator: '，',
      changingRequirements: '。要求可能会改变，报名之前请向监管机构确认。',
      fromOnet: '依据美国从业者向 O*NET 提供的资料。马来西亚雇主的要求可能较低或较高；招聘广告反映当前要求。'
    },
    market: {
      title: '马来西亚招聘广告',
      intro: (reviewed, title, date) =>
        `Kotak 管理员审核的 ${reviewed.toLocaleString('en-MY')} 则 JobStreet 招聘广告，涉及 ${title}，最近查看于 ${date}。这些信息仅供参考，不代表趋势判断。`,
      popularityTitle: 'JobStreet 招聘广告',
      about: (count) => `约 ${count.toLocaleString('en-MY')}`,
      popularityHeadline: (count, rank) =>
        `JobStreet 估算约有 ${count.toLocaleString('en-MY')} 则广告${rank ? `，${rank}` : ''}`,
      popularitySample: (count, title, approved, reviewed) =>
        `根据 JobStreet 为“${title}”找到的 ${count.toLocaleString('en-MY')} 则广告估算：Kotak 管理员审核了 ${reviewed.toLocaleString('en-MY')} 则，其中 ${approved} 则获通过。`,
      activeAds: '活跃招聘广告',
      activeAdsCount: (count) => `${count.toLocaleString('en-MY')} 则活跃招聘广告`,
      employersSeen: (count) => `最近 2 周收集到 ${count.toLocaleString('en-MY')} 家雇主的广告`,
      medianPayLevel: (name) => `${name}职位的薪资中位数`,
      monthly: (amount) => `每月 ${amount}`,
      middleHalf: (p25, p75) => `中间一半介于 ${p25} 至 ${p75}，来自`,
      payRangeByLevel: (p25, p75, ads, overallMedian) =>
        `中间一半介于 ${p25} 至 ${p75}，来自 ${ads.toLocaleString('en-MY')} 则要求你这个水平且列出薪资的广告${overallMedian ? `；所有水平合计为 ${overallMedian}` : ''}`,
      payRangeAll: (p25, p75, ads) =>
        `中间一半介于 ${p25} 至 ${p75}，来自 ${ads.toLocaleString('en-MY')} 则列出薪资的广告`,
      askingYourLevel: '要求你这个水平且列出薪资的广告',
      allLevelsMedian: '所有水平的广告薪资中位数',
      statingPay: '列出薪资的广告',
      tooFewPay: '列出令吉薪资的广告太少，无法估算。',
      tooFewLevelPay: (level) => `${level}职位列出薪资的广告太少，无法单独估算`,
      levelRoles: (level) => `${level === 'mid' ? '中级' : level === 'junior' ? '初级' : '高级'}职位`,
      adsCount: (count) => `${count.toLocaleString('en-MY')} 则广告`,
      payByLevel: '按水平查看薪资',
      yourLevel: '（你的水平）',
      asks: (text) => ` · 要求 ${text}`,
      tooFewAds: (count) => `列出薪资的广告太少 · ${count.toLocaleString('en-MY')} 则广告`,
      payLevelNote: (stated, unstated) =>
        `每项数据是要求该水平的广告所列月薪中位数。水平指广告要求的经验；若未列明，则依据职位名称：${stated.toLocaleString('en-MY')} 则活跃广告有列明，另有 ${unstated.toLocaleString('en-MY')} 则没有。`,
      whereJobs: '招聘地点',
      distribution: (otherStates, withoutState, remote, hybrid) =>
        [
          otherStates > 0 && `${otherStates.toLocaleString('en-MY')} 则广告位于其他州`,
          withoutState > 0 && `${withoutState.toLocaleString('en-MY')} 则广告未列明州属`,
          remote > 0 && `${remote.toLocaleString('en-MY')} 则广告提供远程工作`,
          hybrid > 0 && `${hybrid.toLocaleString('en-MY')} 则广告提供混合办公`
        ]
          .filter(Boolean)
          .join('；') + '。',
      toolsNamed: '广告提到的工具',
      languagesAsked: '广告要求的语言',
      aiInAds: '广告中的 AI',
      skillSeparator: '、',
      aiShare: (share, skills) => `${share} 的广告提到 AI${skills ? `，最常提到 ${skills}` : ''}。`,
      noAi: 'Kotak 查看过的广告都没有提到 AI。',
      sharesOfAds: (count) => `比例以 Kotak 查看过的 ${count.toLocaleString('en-MY')} 则活跃广告为准。`,
      skillCaveat: '大多数广告只显示摘要，因此可能要求某种工具，却没有明确提到。',
      notEnoughRead: 'Kotak 查看这批广告的数量还不够，暂时无法说明它们要求哪些工具和语言。',
      tooFewAdsSkills: '活跃广告太少，无法说明它们要求哪些工具和语言。',
      benefitsNamed: '广告提到的福利',
      benefitShare: (count) => `比例以 JobStreet 卡片列出雇主福利的 ${count.toLocaleString('en-MY')} 则活跃广告为准。`,
      benefitCaveat: '大多数卡片没有列出福利，因此即使没有提到，也可能提供福利。',
      noBenefits: (count) => `${count.toLocaleString('en-MY')} 则活跃广告的雇主说明都没有提到福利。`,
      rank: (_rank, total, ordinal) => (total < 2 ? null : `在 ${total} 个有 JobStreet 估算的职位中排名${ordinal}`),
      rankPopularity: (count, rank) =>
        `JobStreet 估算约有 ${count.toLocaleString('en-MY')} 则广告${rank ? `，${rank}` : ''}`,
      payLabel: (amount, level) =>
        level
          ? `根据你的工作年限，${level === 'mid' ? '中级' : level === 'junior' ? '初级' : '高级'}职位的月薪中位数为 ${amount}`
          : `广告月薪中位数为 ${amount}`,
      levelName: (level) => ({ junior: '初级', mid: '中级', senior: '高级' })[level],
      levelAsk: (level) =>
        ({
          junior: '少于 2 年或应届毕业生',
          mid: '2 至 4 年',
          senior: '5 年或以上'
        })[level],
      ordinal: (number) => `第 ${number.toLocaleString('en-MY')}`
    },
    quadrant: {
      title: '你目前的位置',
      description: '每个圆点代表一份工作。左右表示你的准备程度；向上表示工作正在增长。',
      thisJobAria: '这份工作的定位',
      boxes: {
        plan: { name: '规划', line: '正在增长，还未准备好。为此提升技能。' },
        best: { name: '最佳', line: '准备充分且正在增长。争取机会。' },
        rethink: { name: '重新考虑', line: '准备不足且正在萎缩。避免选择。' },
        push: { name: '尽快行动', line: '准备充分但正在萎缩。尽快行动。' }
      },
      markers: { you: '你目前的工作', target: '你的目标职位', suggested: 'Kotak 推荐' },
      shortMarkers: { you: '你目前的工作', target: '目标职位', suggested: '推荐' },
      thisJob: '这份工作',
      noTrend: '没有趋势数据',
      fitUnknownLower: '匹配度未知',
      fitUnknown: '匹配度未知',
      fitLower: (fit) => `匹配度 ${fit}%`,
      fit: (fit) => `匹配度 ${fit}%`,
      box: '象限',
      neededFirst: (gap) => `优先提升：${gap}`,
      middleLine: '中间线',
      notPlaced: '未定位',
      higherIsBetter: '越高越好',
      thisJobTrend: (trend) => `这份工作：${trend}`,
      openJobPage: '打开工作页面',
      openJobTitle: (title) => `：${title}`,
      fitAxis: '匹配度 0%',
      readinessAxis: '你的准备程度',
      targetLegend: '你的目标职位',
      textVersion: '文字版（见计算表）',
      textDescription: (rising, declining, steady) =>
        `左右表示你的匹配度（50% 或以上视为准备就绪）。向上表示工作的趋势：${rising} 位于中间线上方，${declining} 位于下方，${steady} 位于线上，因此不在任何象限。`,
      role: '职位',
      marker: '标记',
      fitColumn: '匹配度',
      place: '位置',
      points: (label, marker, fit, trend, place, box, gap) =>
        `${label}，${marker}，${fit}，${trend}，${place}${box ? '，象限' : ''}${gap ? `，优先提升：${gap}` : ''}`,
      gapLabel: (name, you, needed) => `${name}（你 ${you}，所需 ${needed}）`
    },
    reason: (code, original) => {
      const dynamic = (prefix: string, suffix = '') =>
        original.startsWith(prefix) && (!suffix || original.endsWith(suffix))
          ? original.slice(prefix.length, suffix ? -suffix.length : undefined)
          : null
      switch (code) {
        case 'target':
          return '你选择了这个职位'
        case 'area': {
          const area = dynamic('In ')
          return area === null ? original : `属于${area}`
        }
        case 'field': {
          const field = dynamic('Your ', ' study leads here')
          return field === null ? original : `你的${field}专业可以通向这里`
        }
        case 'interests':
          return '符合你的兴趣'
        case 'activity_area': {
          const areas = dynamic('Your picks point to ')
          return areas === null ? original : `你的选择指向${areas}`
        }
        case 'job_related':
          return '与你的工作相关'
        case 'related': {
          const title = dynamic('Related to ')
          return title === null ? original : `与${title}相关`
        }
        case 'current':
          return '你目前的工作'
      }
    },
    benefits: zhBenefits,
    professionRoutes: zhProfessionRoutes
  }
)

function rankOrdinal(number: number) {
  const tens = number % 100
  const suffix =
    tens >= 11 && tens <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[number % 10]
  return `${number.toLocaleString('en-MY')}${suffix ?? 'th'}`
}
