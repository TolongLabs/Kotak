import { defineText } from '../text'

export type OccupationSdgReasonKey =
  | '11'
  | '13'
  | '15'
  | '17'
  | '19'
  | '21'
  | '23'
  | '25'
  | '27'
  | '29'
  | '31'
  | '33'
  | '35'
  | '37'
  | '39'
  | '41'
  | '43'
  | '45'
  | '47'
  | '49'
  | '51'
  | '53'
  | '55'
  | '11-9031'
  | '11-9032'
  | '11-9033'
  | '11-9039'
  | '11-9111'
  | '17-2071'
  | '17-2081'
  | '17-3025'
  | '19-1031'
  | '19-1041'
  | '19-1042'
  | '19-2041'
  | '19-3011'
  | '19-3051'
  | '19-4042'
  | '21-1094'
  | '25-4011'
  | '25-4012'
  | '25-4013'
  | '25-4022'
  | '25-4031'
  | '33-2011'
  | '39-9011'
  | '45-3031'
  | '45-4011'
  | '47-2152'
  | '47-2231'
  | '49-9081'
  | '51-8013'
  | '51-8031'
  | '53-3052'
  | '13-2'
  | '13-1031'
  | '13-1032'
  | '17-1011'
  | '17-1012'
  | '17-1022'
  | '17-2051'
  | '17-3011'
  | '17-3022'
  | '17-3031'
  | '37-3'
  | '37-1012'
  | '53-7'
  | '53-7081'

export type SdgReasonKey =
  | '1.1'
  | '1.2'
  | '2.3'
  | '2.4'
  | '3.3'
  | '3.8'
  | '3.9'
  | '3.b'
  | '4.1'
  | '4.2'
  | '4.3'
  | '4.4'
  | '4.7'
  | '4.c'
  | '5.4'
  | '6.1'
  | '6.2'
  | '6.3'
  | '6.4'
  | '6.6'
  | '7.1'
  | '7.2'
  | '7.3'
  | '8.2'
  | '8.3'
  | '8.5'
  | '8.8'
  | '8.10'
  | '9.1'
  | '9.2'
  | '9.4'
  | '9.5'
  | '10.2'
  | '11.2'
  | '11.3'
  | '11.4'
  | '11.5'
  | '11.6'
  | '11.7'
  | '12.2'
  | '12.3'
  | '12.4'
  | '12.5'
  | '12.6'
  | '12.8'
  | '13.1'
  | '13.2'
  | '14.2'
  | '14.4'
  | '15.1'
  | '15.2'
  | '15.3'
  | '15.5'
  | '16.1'
  | '16.3'
  | '16.6'
  | '16.10'
  | '17.17'

const sdgReasonsEn: Record<SdgReasonKey, string> = {
  '1.1': 'Social service work that supports clients can help people living in extreme poverty get the help they need.',
  '1.2':
    'Planning resources well and responding to setbacks can help protect the incomes that keep people out of poverty.',
  '2.3':
    'Biological and crop research and field inspection add to the farming knowledge that can help small-scale food producers grow more.',
  '2.4':
    'Good crop, livestock and land practices help make farming more productive and resilient while protecting soil and ecosystems.',
  '3.3':
    'Tracking, preventing and treating infectious diseases helps fight the communicable diseases this target covers.',
  '3.8':
    'Skilled health, care and support work helps people get quality essential health services, which universal health coverage needs.',
  '3.9':
    'Collecting samples for lab testing helps find chemical residues and contamination early, which can help prevent illness from them.',
  '3.b': 'Research skills in medicine can contribute to developing new vaccines and medicines.',
  '4.1': 'Teaching and running schools helps children complete quality primary and secondary education.',
  '4.2': 'Early childhood care and teaching help young children get ready for primary school.',
  '4.3':
    'Teaching and running colleges and training programmes can help widen access to quality technical, vocational and tertiary education.',
  '4.4':
    'Building a skill this job uses gives you relevant skills for employment and decent jobs, which this target wants more youth and adults to have.',
  '4.7':
    'Explaining science to the public helps people gain the knowledge and skills needed to promote sustainable development.',
  '4.c': 'Building teaching skills adds to the supply of qualified teachers.',
  '5.4': 'Providing care services, such as childcare, helps share the unpaid care work that families do.',
  '6.1':
    'Designing water storage and tracking water levels and flows supports the systems that provide safe drinking water.',
  '6.2': 'Cleaning and sanitation work helps keep toilets, washrooms and buildings hygienic.',
  '6.3': 'Testing and treating water helps find and reduce pollution, which improves water quality.',
  '6.4':
    'Measuring and studying water, and planning how it is moved and used, support more efficient and sustainable use of freshwater.',
  '6.6':
    'Studying and reducing environmental impacts helps protect and restore rivers, lakes, wetlands and other water-related ecosystems.',
  '7.1':
    'Installing and checking energy systems such as solar helps bring reliable, modern energy to homes and businesses.',
  '7.2':
    'Planning, building and running renewable energy systems helps raise the share of energy that comes from renewables.',
  '7.3': 'Insulating and sealing buildings cuts the energy they waste, which improves energy efficiency.',
  '8.2':
    'Learning better tools and methods for this work can help raise productivity through technology and innovation.',
  '8.3':
    'Skills that start or grow businesses, or shape policy for them, support productive activity and job creation.',
  '8.5': 'Building this skill helps you stay in, or move into, productive and decent work.',
  '8.8':
    'Working safely and keeping equipment and work areas in order helps keep workplaces safe and secure for the people who work there.',
  '8.10':
    'Finance and insurance skills help banks and insurers serve customers, including people new to financial services.',
  '9.1':
    'Keeping equipment and monitoring stations working, with accurate data, supports reliable and resilient infrastructure.',
  '9.2': 'Production skills are part of the industry this target wants to grow inclusively and sustainably.',
  '9.4':
    'Upgrading infrastructure and industry to be cleaner and more efficient needs people who can install, repair and improve it.',
  '9.5':
    'Research and technical skills add to the scientific research and technological capability this target aims to grow.',
  '10.2':
    'Reaching out to and assisting people of every age and ability helps include them in social and economic life.',
  '11.2': 'Directing traffic and enforcing road rules helps make roads safer.',
  '11.3': 'Planning skills help towns and cities grow in a sustainable, well-managed way.',
  '11.4': 'Recording, conserving and sharing culture helps protect cultural and natural heritage.',
  '11.5': 'Planning and coordinating emergency response helps reduce the deaths, harm and losses that disasters cause.',
  '11.6':
    'Meeting environmental standards and managing waste and pollution helps reduce the environmental impact of cities.',
  '11.7':
    'Designing and looking after parks and other green and public spaces helps keep them safe and usable for everyone.',
  '12.2': 'Planning how natural resources are used helps manage them sustainably and use them efficiently.',
  '12.3':
    'Inspecting farm produce and how it is handled in transport can find disease and damage early, which can reduce food losses after harvest.',
  '12.4':
    'Developing pest and weed control methods and testing samples for pollution can help manage chemicals and spot what reaches air, water and soil.',
  '12.5':
    'Using materials carefully, repairing things and tracking waste helps prevent and reduce what gets thrown away.',
  '12.6':
    'Preparing sustainability reports helps companies share clear information on their environmental and social impact in their regular reporting.',
  '12.8':
    'Giving customers clear advice on sustainable products and practices can help them make informed, sustainable choices.',
  '13.1':
    'Measuring, studying and planning for climate and water risks helps communities prepare for and adapt to climate hazards.',
  '13.2':
    'Assessing and monitoring climate and environmental risks helps give climate policies and plans the evidence they need.',
  '14.2':
    'Raising fish responsibly and assessing pollution risks to water can help reduce harm that flows on to coasts and seas.',
  '14.4': 'Fishing within the rules and managing fish stocks help protect stocks and let them recover.',
  '15.1':
    'Surveying, planning and managing land and forests helps conserve and restore land and freshwater ecosystems.',
  '15.2': 'Planning restoration work helps restore degraded forests and other natural areas.',
  '15.3': 'Conserving soil and managing land and vegetation helps restore degraded land and soil.',
  '15.5': 'Surveying wildlife and planning its management helps protect habitats and threatened species.',
  '16.1': 'Skills that prevent violence and keep people safe help reduce violence and the deaths it causes.',
  '16.3': 'Fair, consistent sentencing helps uphold the rule of law and equal treatment under it.',
  '16.6':
    'Keeping accurate records, checking facts and reporting openly are everyday parts of running effective, accountable and transparent institutions.',
  '16.10': 'Helping people find and use information supports public access to information.',
  '17.17':
    'Building community partnerships helps bring public bodies, businesses and community groups together to work on shared goals.'
}

const sdgReasonsMs: Record<SdgReasonKey, string> = {
  '1.1':
    'Kerja perkhidmatan sosial yang menyokong klien boleh membantu orang yang hidup dalam kemiskinan tegar mendapatkan bantuan yang diperlukan.',
  '1.2':
    'Perancangan sumber yang baik dan tindak balas terhadap cabaran boleh membantu melindungi pendapatan yang menjauhkan orang daripada kemiskinan.',
  '2.3':
    'Penyelidikan biologi dan tanaman serta pemeriksaan lapangan menambah pengetahuan pertanian yang boleh membantu pengeluar makanan berskala kecil meningkatkan hasil.',
  '2.4':
    'Amalan tanaman, ternakan dan tanah yang baik membantu meningkatkan produktiviti dan daya tahan pertanian sambil melindungi tanah serta ekosistem.',
  '3.3':
    'Pengesanan, pencegahan dan rawatan penyakit berjangkit membantu membanteras penyakit yang diliputi sasaran ini.',
  '3.8':
    'Kerja kesihatan, penjagaan dan sokongan yang mahir membantu orang mendapatkan perkhidmatan kesihatan asas yang berkualiti, yang diperlukan untuk liputan kesihatan sejagat.',
  '3.9':
    'Pengumpulan sampel untuk ujian makmal membantu mengesan sisa kimia dan pencemaran lebih awal, sekali gus membantu mencegah penyakit akibatnya.',
  '3.b': 'Kemahiran penyelidikan dalam bidang perubatan boleh menyumbang kepada pembangunan vaksin dan ubat baharu.',
  '4.1':
    'Mengajar dan mengurus sekolah membantu kanak-kanak menamatkan pendidikan rendah dan menengah yang berkualiti.',
  '4.2': 'Penjagaan dan pengajaran awal kanak-kanak membantu anak kecil bersedia untuk sekolah rendah.',
  '4.3':
    'Mengajar dan mengurus kolej serta program latihan boleh meluaskan akses kepada pendidikan teknikal, vokasional dan tertiari yang berkualiti.',
  '4.4':
    'Membina kemahiran yang digunakan dalam pekerjaan ini memberi anda kemahiran berkaitan untuk mendapat pekerjaan dan kerja wajar, yang ingin ditingkatkan oleh sasaran ini bagi golongan muda dan dewasa.',
  '4.7':
    'Penerangan sains kepada orang ramai membantu mereka memperoleh pengetahuan dan kemahiran untuk memajukan pembangunan mampan.',
  '4.c': 'Peningkatan kemahiran mengajar menambah bilangan guru yang berkelayakan.',
  '5.4':
    'Perkhidmatan penjagaan seperti penjagaan kanak-kanak membantu berkongsi kerja penjagaan tanpa gaji yang dilakukan oleh keluarga.',
  '6.1':
    'Reka bentuk simpanan air serta pemantauan paras dan aliran air menyokong sistem bekalan air minuman yang selamat.',
  '6.2': 'Kerja pembersihan dan sanitasi membantu memastikan tandas, bilik air dan bangunan bersih serta higienik.',
  '6.3': 'Ujian dan rawatan air membantu mengesan serta mengurangkan pencemaran, lalu meningkatkan kualiti air.',
  '6.4':
    'Pengukuran dan kajian air serta perancangan aliran dan penggunaannya menyokong penggunaan air tawar yang lebih cekap dan mampan.',
  '6.6':
    'Kajian dan pengurangan kesan alam sekitar membantu melindungi dan memulihkan sungai, tasik, tanah lembap serta ekosistem berkaitan air yang lain.',
  '7.1':
    'Pemasangan dan pemeriksaan sistem tenaga seperti solar membantu membekalkan tenaga moden yang boleh dipercayai kepada rumah dan perniagaan.',
  '7.2':
    'Perancangan, pembinaan dan pengendalian sistem tenaga boleh baharu membantu meningkatkan bahagian tenaga daripada sumber boleh baharu.',
  '7.3': 'Penebatan dan kedapan bangunan mengurangkan pembaziran tenaga, lalu meningkatkan kecekapan tenaga.',
  '8.2':
    'Mempelajari alat dan kaedah yang lebih baik untuk kerja ini boleh meningkatkan produktiviti melalui teknologi dan inovasi.',
  '8.3':
    'Kemahiran untuk memulakan atau mengembangkan perniagaan, atau membentuk dasar untuknya, menyokong kegiatan produktif dan penciptaan pekerjaan.',
  '8.5': 'Membina kemahiran ini membantu anda kekal dalam atau beralih kepada pekerjaan yang produktif dan wajar.',
  '8.8':
    'Amalan kerja selamat serta peralatan dan ruang kerja yang teratur membantu memastikan tempat kerja selamat untuk semua pekerja.',
  '8.10':
    'Kemahiran kewangan dan insurans membantu bank serta syarikat insurans memberikan perkhidmatan kepada pelanggan, termasuk mereka yang baru menggunakan perkhidmatan kewangan.',
  '9.1':
    'Memastikan peralatan dan stesen pemantauan berfungsi dengan data yang tepat menyokong infrastruktur yang boleh dipercayai dan berdaya tahan.',
  '9.2':
    'Kemahiran pengeluaran ialah sebahagian daripada industri yang ingin dikembangkan oleh sasaran ini secara inklusif dan mampan.',
  '9.4':
    'Peningkatan infrastruktur dan industri supaya lebih bersih dan cekap memerlukan pekerja yang boleh memasang, membaiki dan menambah baiknya.',
  '9.5':
    'Kemahiran penyelidikan dan teknikal menyumbang kepada penyelidikan saintifik dan keupayaan teknologi yang ingin ditingkatkan oleh sasaran ini.',
  '10.2':
    'Mendekati dan membantu orang daripada semua peringkat umur dan keupayaan membantu mereka menyertai kehidupan sosial dan ekonomi.',
  '11.2': 'Mengawal lalu lintas dan menguatkuasakan peraturan jalan raya membantu menjadikan jalan lebih selamat.',
  '11.3': 'Kemahiran perancangan membantu pekan dan bandar berkembang secara mampan dan terurus.',
  '11.4': 'Merekod, memulihara dan berkongsi budaya membantu melindungi warisan budaya dan semula jadi.',
  '11.5':
    'Perancangan dan penyelarasan tindak balas kecemasan membantu mengurangkan kematian, kecederaan dan kerugian akibat bencana.',
  '11.6':
    'Pematuhan piawaian alam sekitar serta pengurusan sisa dan pencemaran membantu mengurangkan kesan bandar terhadap alam sekitar.',
  '11.7':
    'Reka bentuk dan penjagaan taman serta ruang hijau dan awam membantu memastikan ruang itu selamat dan boleh digunakan oleh semua.',
  '12.2':
    'Perancangan penggunaan sumber semula jadi membantu mengurusnya secara mampan dan menggunakannya dengan cekap.',
  '12.3':
    'Pemeriksaan hasil ladang dan pengendaliannya semasa pengangkutan boleh mengesan penyakit serta kerosakan lebih awal, lalu mengurangkan kehilangan makanan selepas tuaian.',
  '12.4':
    'Pembangunan kaedah kawalan perosak dan rumpai serta ujian pencemaran pada sampel boleh membantu mengurus bahan kimia dan mengesan bahan yang sampai ke udara, air dan tanah.',
  '12.5':
    'Penggunaan bahan dengan cermat, pembaikan barang dan penjejakan sisa membantu mencegah serta mengurangkan barang yang dibuang.',
  '12.6':
    'Penyediaan laporan kemampanan membantu syarikat berkongsi maklumat yang jelas tentang kesan alam sekitar dan sosial dalam laporan berkala mereka.',
  '12.8':
    'Nasihat yang jelas tentang produk dan amalan mampan boleh membantu pelanggan membuat pilihan mampan berdasarkan maklumat.',
  '13.1':
    'Pengukuran, kajian dan perancangan risiko iklim serta air membantu komuniti bersedia menghadapi bahaya iklim dan menyesuaikan diri.',
  '13.2':
    'Penilaian dan pemantauan risiko iklim serta alam sekitar membekalkan bukti yang diperlukan untuk dasar dan rancangan iklim.',
  '14.2':
    'Penternakan ikan secara bertanggungjawab dan penilaian risiko pencemaran air boleh mengurangkan kesan buruk yang sampai ke pantai dan laut.',
  '14.4': 'Penangkapan ikan mengikut peraturan dan pengurusan stok ikan membantu melindungi stok serta memulihkannya.',
  '15.1':
    'Tinjauan, perancangan dan pengurusan tanah serta hutan membantu memulihara dan memulihkan ekosistem daratan dan air tawar.',
  '15.2': 'Perancangan kerja pemulihan membantu memulihkan hutan terosot dan kawasan semula jadi yang lain.',
  '15.3': 'Pemuliharaan tanah serta pengurusan tanah dan tumbuh-tumbuhan membantu memulihkan tanah yang terosot.',
  '15.5': 'Tinjauan hidupan liar dan perancangan pengurusannya membantu melindungi habitat dan spesies terancam.',
  '16.1':
    'Kemahiran mencegah keganasan dan menjaga keselamatan orang membantu mengurangkan keganasan serta kematian akibatnya.',
  '16.3':
    'Hukuman yang adil dan konsisten membantu menegakkan kedaulatan undang-undang serta layanan yang sama di bawahnya.',
  '16.6':
    'Rekod yang tepat, semakan fakta dan laporan terbuka ialah amalan harian untuk mengurus institusi yang berkesan, bertanggungjawab dan telus.',
  '16.10': 'Membantu orang mencari dan menggunakan maklumat menyokong akses awam kepada maklumat.',
  '17.17':
    'Kerjasama komuniti membantu menghimpunkan badan awam, perniagaan dan kumpulan komuniti untuk mencapai matlamat bersama.'
}

const sdgReasonsZh: Record<SdgReasonKey, string> = {
  '1.1': '支持服务对象的社会服务工作，可以帮助生活在极端贫困中的人获得所需援助。',
  '1.2': '妥善规划资源并应对挫折，有助于保障人们脱贫所需的收入。',
  '2.3': '生物和作物研究及实地检查能积累农业知识，帮助小规模粮食生产者提高产量。',
  '2.4': '良好的作物、畜牧和土地管理方式，有助于提高农业生产力和韧性，同时保护土壤与生态系统。',
  '3.3': '追踪、预防和治疗传染病，有助于应对这一目标涵盖的传染性疾病。',
  '3.8': '专业的医疗、照护和支援工作，能帮助人们获得优质的基本医疗服务，这是全民健康保障所需的。',
  '3.9': '采集样本进行实验室检测，有助于及早发现化学残留和污染，从而预防相关疾病。',
  '3.b': '医学研究技能可以为开发新疫苗和药物作出贡献。',
  '4.1': '教学和学校管理工作，有助于儿童完成优质的小学和中学教育。',
  '4.2': '幼儿照护和教学有助于孩子为小学做好准备。',
  '4.3': '在学院任教和管理培训课程，有助于扩大人们接受优质技术、职业和高等教育的机会。',
  '4.4': '培养这份工作所需的技能，能为你带来就业和体面工作所需的相关技能；这个目标希望更多青年和成年人具备这些技能。',
  '4.7': '向公众讲解科学，有助于人们掌握推动可持续发展所需的知识和技能。',
  '4.c': '提升教学技能，有助于增加合格教师的数量。',
  '5.4': '提供托儿等照护服务，有助于分担家庭承担的无偿照护工作。',
  '6.1': '设计储水设施并追踪水位和水流，有助于支持安全饮用水供应系统。',
  '6.2': '清洁和卫生工作有助于保持厕所、洗手间和建筑环境卫生。',
  '6.3': '检测和处理水有助于发现并减少污染，从而改善水质。',
  '6.4': '测量和研究水资源，并规划水的输送和使用方式，有助于更高效、可持续地利用淡水。',
  '6.6': '研究并减少环境影响，有助于保护和恢复河流、湖泊、湿地及其他与水有关的生态系统。',
  '7.1': '安装和检查太阳能等能源系统，有助于为家庭和企业提供可靠、现代的能源。',
  '7.2': '规划、建设和运营可再生能源系统，有助于提高可再生能源在能源中的占比。',
  '7.3': '为建筑隔热和密封能减少能源浪费，从而提高能源效率。',
  '8.2': '学习更好的工具和工作方法，有助于通过技术和创新提高生产力。',
  '8.3': '创办或发展企业，以及为企业制定政策所需的技能，有助于推动生产活动和创造就业。',
  '8.5': '培养这项技能，有助于你留在生产性和体面的工作岗位，或转入这类工作。',
  '8.8': '安全作业并保持设备和工作区域整齐，有助于保障所有员工的工作场所安全。',
  '8.10': '金融和保险技能有助于银行和保险公司服务客户，包括刚开始使用金融服务的人。',
  '9.1': '保持设备和监测站正常运作，并确保数据准确，有助于建设可靠、有韧性的基础设施。',
  '9.2': '生产技能属于这一目标希望以包容和可持续方式发展的产业所需技能。',
  '9.4': '要让基础设施和产业更清洁、更高效，就需要有人安装、维修和改进相关设施。',
  '9.5': '研究和技术技能有助于提升这一目标希望发展的科学研究和技术能力。',
  '10.2': '主动联系并协助不同年龄和能力的人，有助于他们参与社会和经济生活。',
  '11.2': '指挥交通并执行道路规则，有助于提升道路安全。',
  '11.3': '规划技能有助于城镇和城市以可持续且管理良好的方式发展。',
  '11.4': '记录、保护和分享文化，有助于守护文化与自然遗产。',
  '11.5': '规划和协调紧急应对工作，有助于减少灾害造成的死亡、伤害和损失。',
  '11.6': '遵守环境标准并管理废弃物和污染，有助于减少城市对环境的影响。',
  '11.7': '设计和维护公园及其他绿地和公共空间，有助于确保人人都能安全使用这些空间。',
  '12.2': '规划自然资源的使用方式，有助于可持续地管理并高效利用资源。',
  '12.3': '检查农产品及其运输处理情况，可以及早发现疾病和损坏，从而减少收获后的粮食损失。',
  '12.4': '开发病虫害和杂草防治方法，并检测样本中的污染，有助于管理化学品并发现进入空气、水和土壤的污染物。',
  '12.5': '谨慎使用材料、修理物品并追踪废弃物，有助于预防和减少丢弃物。',
  '12.6': '编制可持续发展报告，有助于企业在定期报告中清楚说明其环境和社会影响。',
  '12.8': '为顾客清楚介绍可持续产品和做法，有助于他们根据充分信息作出可持续选择。',
  '13.1': '测量、研究并规划气候和水资源风险，有助于社区为气候灾害做好准备并适应变化。',
  '13.2': '评估和监测气候及环境风险，有助于为气候政策和计划提供所需依据。',
  '14.2': '负责任地养殖鱼类并评估水污染风险，有助于减少流向海岸和海洋的危害。',
  '14.4': '遵守规定捕鱼并管理鱼类资源，有助于保护鱼群并让其恢复。',
  '15.1': '调查、规划和管理土地与森林，有助于保护和恢复陆地及淡水生态系统。',
  '15.2': '规划生态修复工作，有助于恢复退化的森林和其他自然区域。',
  '15.3': '保护土壤并管理土地和植被，有助于恢复退化的土地和土壤。',
  '15.5': '调查野生动物并规划管理工作，有助于保护栖息地和受威胁物种。',
  '16.1': '预防暴力和保障人身安全的技能，有助于减少暴力及其导致的死亡。',
  '16.3': '公平、一致的量刑有助于维护法治和法律面前的平等。',
  '16.6': '准确记录、核实事实和公开汇报，是建立高效、负责、透明机构的日常工作。',
  '16.10': '帮助人们查找和使用信息，有助于保障公众获取信息。',
  '17.17': '建立社区伙伴关系，有助于公共机构、企业和社区团体携手实现共同目标。'
}

const occupationReasonsEn: Record<OccupationSdgReasonKey, string> = {
  '11': 'Managers organise the work that provides productive employment (SDG 8.5).',
  '13': 'Business operations work helps organisations run productively (SDG 8.2).',
  '15': 'Computing and data work builds digital tools that can help industries upgrade their technology and innovate (SDG 9.5).',
  '17': 'Engineering, design and mapping work helps industries upgrade their technology and innovate (SDG 9.5).',
  '19': 'Scientists carry out the scientific research this target aims to grow (SDG 9.5).',
  '21': 'Community and social service work helps people take part in social and economic life, whatever their circumstances (SDG 10.2).',
  '23': 'Legal work helps uphold the rule of law and access to justice (SDG 16.3).',
  '25': 'Teaching and training add to the supply of qualified teachers that quality education depends on (SDG 4.c).',
  '27': 'Creative and media work can help record, share and keep alive cultural heritage (SDG 11.4).',
  '29': 'Health practitioners provide the essential health care that universal health coverage needs (SDG 3.8).',
  '31': 'Health support work helps people get the essential health care that universal health coverage needs (SDG 3.8).',
  '33': 'Protective service work helps prevent violence and keep people safe (SDG 16.1).',
  '35': 'Food service work can cut the food wasted in kitchens and restaurants (SDG 12.3).',
  '37': 'Cleaning and pest control work helps keep buildings and their washrooms hygienic (SDG 6.2).',
  '39': 'Personal care and service work is employment, which this target wants to be productive and decent for everyone (SDG 8.5).',
  '41': 'Sales work is employment, which this target wants to be productive and decent for everyone (SDG 8.5).',
  '43': 'Office and administrative work keeps organisations running productively (SDG 8.2).',
  '45': 'Farming, fishing and forestry produce food and manage land, which this target wants done sustainably (SDG 2.4).',
  '47': 'Construction work builds and repairs the infrastructure people rely on (SDG 9.1).',
  '49': 'Installation and repair work keeps infrastructure and equipment working (SDG 9.1).',
  '51': 'Production work is part of the industry this target wants to grow inclusively and sustainably (SDG 9.2).',
  '53': 'Transport work helps run the transport systems that move people and goods (SDG 11.2).',
  '55': 'Military work aims to protect people from violence and conflict (SDG 16.1).',
  '11-9031': 'Early-childhood centre leaders run early childhood care and education (SDG 4.2).',
  '11-9032': 'School leaders run primary and secondary schools (SDG 4.1).',
  '11-9033': 'Postsecondary administrators run colleges and universities (SDG 4.3).',
  '11-9039': 'Education administrators run education and training programmes (SDG 4.3).',
  '11-9111': 'Health service managers run the services behind essential health care (SDG 3.8).',
  '17-2071': 'Electrical engineers design the power systems behind reliable, modern energy (SDG 7.1).',
  '17-2081': 'Environmental engineers design ways to cut pollution and treat wastewater (SDG 6.3).',
  '17-3025': 'Environmental engineering technicians help reduce pollution and treat wastewater (SDG 6.3).',
  '19-1031': 'Conservation scientists manage and protect land ecosystems (SDG 15.1).',
  '19-1041': 'Epidemiologists track and help control communicable diseases (SDG 3.3).',
  '19-1042': 'Medical research can lead to new medicines and vaccines (SDG 3.b).',
  '19-2041': 'Environmental scientists study and help protect ecosystems (SDG 15.1).',
  '19-3011': 'Economists advise on policies that support productive activity and job creation (SDG 8.3).',
  '19-3051': 'Urban and regional planners plan how towns and cities grow (SDG 11.3).',
  '19-4042': 'Environmental science technicians monitor pollution, including in water (SDG 6.3).',
  '21-1094': 'Community health workers bring health care to communities (SDG 3.8).',
  '25-4011': 'Archivists keep the records that make up cultural heritage (SDG 11.4).',
  '25-4012': 'Curators look after and share cultural and natural heritage (SDG 11.4).',
  '25-4013': 'Museum technicians and conservators protect heritage objects (SDG 11.4).',
  '25-4022': 'Librarians help people find and use information (SDG 16.10).',
  '25-4031': 'Library technicians help people find and use information (SDG 16.10).',
  '33-2011': 'Firefighters protect communities from fires and disasters (SDG 11.5, 13.1).',
  '39-9011':
    'Childcare workers support early learning and share care that parents would otherwise do unpaid (SDG 4.2, 5.4).',
  '45-3031': 'Fishing work depends on the healthy fish stocks this target aims to restore (SDG 14.4).',
  '45-4011': 'Forest and conservation workers plant, protect and manage forests (SDG 15.2).',
  '47-2152':
    'Plumbers install the pipes and fixtures that bring safe water and sanitation into buildings (SDG 6.1, 6.2).',
  '47-2231': 'Solar installers add renewable energy to the energy mix (SDG 7.2).',
  '49-9081': 'Wind turbine technicians keep renewable power running (SDG 7.2).',
  '51-8013': 'Power plant operators keep reliable electricity flowing (SDG 7.1).',
  '51-8031': 'Water and wastewater treatment operators supply safe water and treat wastewater (SDG 6.1, 6.3).',
  '53-3052': 'Bus drivers run public transport (SDG 11.2).',
  '13-2': 'Finance work helps people and firms use banking, insurance and other financial services (SDG 8.10).',
  '13-1031': 'Claims adjusters help insurers pay out on the cover people and firms rely on (SDG 8.10).',
  '13-1032': 'Insurance appraisers help insurers settle claims (SDG 8.10).',
  '17-1011': 'Architects design the buildings that are part of the infrastructure people rely on (SDG 9.1).',
  '17-1012': 'Landscape architects design parks, streets and other green and public spaces (SDG 11.7).',
  '17-1022': 'Surveyors measure the land that roads, buildings and other infrastructure are built on (SDG 9.1).',
  '17-2051': 'Civil engineers design roads, bridges, water systems and other infrastructure (SDG 9.1).',
  '17-3011': 'Architectural and civil drafters draw up the plans infrastructure is built from (SDG 9.1).',
  '17-3022': 'Civil engineering technicians help plan, build and inspect infrastructure (SDG 9.1).',
  '17-3031': 'Surveying and mapping technicians gather the measurements infrastructure projects need (SDG 9.1).',
  '37-3': 'Grounds work looks after parks, gardens and other green spaces (SDG 11.7).',
  '37-1012': 'Groundskeeping supervisors look after parks, gardens and other green spaces (SDG 11.7).',
  '53-7':
    'Material moving work is employment, which this target wants to be productive and decent for everyone (SDG 8.5).',
  '53-7081':
    'Refuse and recycling collectors carry out the municipal waste management this target highlights (SDG 11.6).'
}

const occupationReasonsMs: Record<OccupationSdgReasonKey, string> = {
  '11': 'Pengurus menyusun kerja yang menyediakan pekerjaan produktif (SDG 8.5).',
  '13': 'Kerja operasi perniagaan membantu organisasi beroperasi dengan produktif (SDG 8.2).',
  '15': 'Kerja pengkomputeran dan data membina alat digital yang membantu industri meningkatkan teknologi dan berinovasi (SDG 9.5).',
  '17': 'Kerja kejuruteraan, reka bentuk dan pemetaan membantu industri meningkatkan teknologi dan berinovasi (SDG 9.5).',
  '19': 'Ahli sains menjalankan penyelidikan saintifik yang ingin dikembangkan oleh sasaran ini (SDG 9.5).',
  '21': 'Kerja khidmat masyarakat dan sosial membantu orang menyertai kehidupan sosial dan ekonomi, dalam apa jua keadaan (SDG 10.2).',
  '23': 'Kerja undang-undang membantu menegakkan kedaulatan undang-undang dan akses kepada keadilan (SDG 16.3).',
  '25': 'Pengajaran dan latihan menambah bilangan guru berkelayakan yang diperlukan untuk pendidikan berkualiti (SDG 4.c).',
  '27': 'Kerja kreatif dan media boleh membantu merekod, berkongsi dan memelihara warisan budaya (SDG 11.4).',
  '29': 'Pengamal kesihatan menyediakan rawatan penting yang diperlukan untuk liputan kesihatan sejagat (SDG 3.8).',
  '31': 'Kerja sokongan kesihatan membantu orang mendapatkan rawatan penting yang diperlukan untuk liputan kesihatan sejagat (SDG 3.8).',
  '33': 'Perkhidmatan perlindungan membantu mencegah keganasan dan menjaga keselamatan orang (SDG 16.1).',
  '35': 'Kerja perkhidmatan makanan boleh mengurangkan pembaziran makanan di dapur dan restoran (SDG 12.3).',
  '37': 'Kerja pembersihan dan kawalan makhluk perosak membantu memastikan bangunan dan tandasnya bersih serta higienik (SDG 6.2).',
  '39': 'Kerja penjagaan diri dan perkhidmatan ialah pekerjaan yang disasarkan agar produktif dan wajar untuk semua (SDG 8.5).',
  '41': 'Kerja jualan ialah pekerjaan yang disasarkan agar produktif dan wajar untuk semua (SDG 8.5).',
  '43': 'Kerja pejabat dan pentadbiran memastikan organisasi beroperasi dengan produktif (SDG 8.2).',
  '45': 'Pertanian, perikanan dan perhutanan menghasilkan makanan serta mengurus tanah secara mampan (SDG 2.4).',
  '47': 'Kerja pembinaan membina dan membaiki infrastruktur yang diperlukan orang (SDG 9.1).',
  '49': 'Kerja pemasangan dan pembaikan memastikan infrastruktur serta peralatan terus berfungsi (SDG 9.1).',
  '51': 'Kerja pengeluaran ialah sebahagian industri yang ingin dikembangkan secara inklusif dan mampan (SDG 9.2).',
  '53': 'Kerja pengangkutan membantu mengendalikan sistem yang membawa orang dan barangan (SDG 11.2).',
  '55': 'Kerja ketenteraan bertujuan melindungi orang daripada keganasan dan konflik (SDG 16.1).',
  '11-9031': 'Pemimpin pusat awal kanak-kanak mengendalikan penjagaan dan pendidikan awal kanak-kanak (SDG 4.2).',
  '11-9032': 'Pemimpin sekolah mengendalikan sekolah rendah dan menengah (SDG 4.1).',
  '11-9033': 'Pentadbir pendidikan lepas menengah mengendalikan kolej dan universiti (SDG 4.3).',
  '11-9039': 'Pentadbir pendidikan mengendalikan program pendidikan dan latihan (SDG 4.3).',
  '11-9111':
    'Pengurus perkhidmatan kesihatan mengendalikan perkhidmatan penting di sebalik rawatan kesihatan (SDG 3.8).',
  '17-2071': 'Jurutera elektrik mereka bentuk sistem kuasa untuk tenaga yang boleh dipercayai dan moden (SDG 7.1).',
  '17-2081': 'Jurutera alam sekitar mereka bentuk cara mengurangkan pencemaran dan merawat air sisa (SDG 6.3).',
  '17-3025': 'Juruteknik kejuruteraan alam sekitar membantu mengurangkan pencemaran dan merawat air sisa (SDG 6.3).',
  '19-1031': 'Ahli sains pemuliharaan mengurus dan melindungi ekosistem daratan (SDG 15.1).',
  '19-1041': 'Ahli epidemiologi mengesan dan membantu mengawal penyakit berjangkit (SDG 3.3).',
  '19-1042': 'Penyelidikan perubatan boleh menghasilkan ubat dan vaksin baharu (SDG 3.b).',
  '19-2041': 'Ahli sains alam sekitar mengkaji dan membantu melindungi ekosistem (SDG 15.1).',
  '19-3011':
    'Ahli ekonomi menasihati tentang dasar yang menyokong kegiatan produktif dan penciptaan pekerjaan (SDG 8.3).',
  '19-3051': 'Perancang bandar dan wilayah merancang pertumbuhan pekan dan bandar (SDG 11.3).',
  '19-4042': 'Juruteknik sains alam sekitar memantau pencemaran, termasuk pencemaran air (SDG 6.3).',
  '21-1094': 'Petugas kesihatan masyarakat membawa rawatan kesihatan kepada komuniti (SDG 3.8).',
  '25-4011': 'Arkivis menjaga rekod yang membentuk warisan budaya (SDG 11.4).',
  '25-4012': 'Kurator menjaga dan berkongsi warisan budaya serta semula jadi (SDG 11.4).',
  '25-4013': 'Juruteknik muzium dan konservator melindungi objek warisan (SDG 11.4).',
  '25-4022': 'Pustakawan membantu orang mencari dan menggunakan maklumat (SDG 16.10).',
  '25-4031': 'Juruteknik perpustakaan membantu orang mencari dan menggunakan maklumat (SDG 16.10).',
  '33-2011': 'Anggota bomba melindungi komuniti daripada kebakaran dan bencana (SDG 11.5, 13.1).',
  '39-9011':
    'Petugas penjagaan kanak-kanak menyokong pembelajaran awal dan berkongsi kerja penjagaan yang biasanya dilakukan ibu bapa tanpa gaji (SDG 4.2, 5.4).',
  '45-3031': 'Kerja menangkap ikan bergantung pada stok ikan sihat yang ingin dipulihkan oleh sasaran ini (SDG 14.4).',
  '45-4011': 'Petugas hutan dan pemuliharaan menanam, melindungi dan mengurus hutan (SDG 15.2).',
  '47-2152':
    'Tukang paip memasang paip dan kelengkapan yang membawa air bersih serta sanitasi ke dalam bangunan (SDG 6.1, 6.2).',
  '47-2231': 'Pemasang solar menambah tenaga boleh baharu kepada campuran tenaga (SDG 7.2).',
  '49-9081': 'Juruteknik turbin angin memastikan kuasa boleh baharu terus berfungsi (SDG 7.2).',
  '51-8013': 'Operator loji janakuasa memastikan bekalan elektrik yang boleh dipercayai terus mengalir (SDG 7.1).',
  '51-8031': 'Operator rawatan air dan air sisa membekalkan air bersih serta merawat air sisa (SDG 6.1, 6.3).',
  '53-3052': 'Pemandu bas mengendalikan pengangkutan awam (SDG 11.2).',
  '13-2':
    'Kerja kewangan membantu orang dan firma menggunakan perbankan, insurans dan perkhidmatan kewangan lain (SDG 8.10).',
  '13-1031':
    'Pelarasan tuntutan membantu syarikat insurans membayar perlindungan yang diharapkan orang dan firma (SDG 8.10).',
  '13-1032': 'Penilai insurans membantu syarikat insurans menyelesaikan tuntutan (SDG 8.10).',
  '17-1011':
    'Arkitek mereka bentuk bangunan yang menjadi sebahagian daripada infrastruktur yang diperlukan orang (SDG 9.1).',
  '17-1012': 'Arkitek landskap mereka bentuk taman, jalan dan ruang hijau serta ruang awam lain (SDG 11.7).',
  '17-1022': 'Juruukur mengukur tanah untuk pembinaan jalan, bangunan dan infrastruktur lain (SDG 9.1).',
  '17-2051': 'Jurutera awam mereka bentuk jalan, jambatan, sistem air dan infrastruktur lain (SDG 9.1).',
  '17-3011': 'Pelukis pelan seni bina dan awam menyediakan pelan untuk pembinaan infrastruktur (SDG 9.1).',
  '17-3022': 'Juruteknik kejuruteraan awam membantu merancang, membina dan memeriksa infrastruktur (SDG 9.1).',
  '17-3031': 'Juruteknik ukur dan pemetaan mengumpul ukuran yang diperlukan oleh projek infrastruktur (SDG 9.1).',
  '37-3': 'Kerja penjagaan kawasan menjaga taman, kebun dan ruang hijau lain (SDG 11.7).',
  '37-1012': 'Penyelia penjagaan kawasan menjaga taman, kebun dan ruang hijau lain (SDG 11.7).',
  '53-7': 'Kerja pemindahan bahan ialah pekerjaan yang disasarkan agar produktif dan wajar untuk semua (SDG 8.5).',
  '53-7081':
    'Pengutip sampah dan bahan kitar semula menjalankan pengurusan sisa perbandaran yang disorot sasaran ini (SDG 11.6).'
}

const occupationReasonsZh: Record<OccupationSdgReasonKey, string> = {
  '11': '管理人员统筹提供生产性就业的工作（SDG 8.5）。',
  '13': '商业运营工作帮助机构高效运作（SDG 8.2）。',
  '15': '计算与数据工作开发数字工具，帮助产业升级技术并创新（SDG 9.5）。',
  '17': '工程、设计与测绘工作帮助产业升级技术并创新（SDG 9.5）。',
  '19': '科学家开展该目标希望推动的科学研究（SDG 9.5）。',
  '21': '社区与社会服务工作帮助人们不受处境限制地参与社会和经济生活（SDG 10.2）。',
  '23': '法律工作有助维护法治并保障司法可及性（SDG 16.3）。',
  '25': '教学与培训增加优质教育所需的合格教师人数（SDG 4.c）。',
  '27': '创意与媒体工作有助记录、传播并延续文化遗产（SDG 11.4）。',
  '29': '医疗专业人员提供实现全民健康覆盖所需的基本医疗服务（SDG 3.8）。',
  '31': '医疗支持工作帮助人们获得实现全民健康覆盖所需的基本医疗服务（SDG 3.8）。',
  '33': '防护服务工作有助预防暴力并保障人们安全（SDG 16.1）。',
  '35': '餐饮服务工作有助减少厨房和餐馆的食物浪费（SDG 12.3）。',
  '37': '清洁与害虫防治工作有助保持建筑物及洗手间卫生（SDG 6.2）。',
  '39': '个人护理与服务工作属于就业；该目标希望人人都能获得生产性且体面的工作（SDG 8.5）。',
  '41': '销售工作属于就业；该目标希望人人都能获得生产性且体面的工作（SDG 8.5）。',
  '43': '办公室与行政工作帮助机构高效运作（SDG 8.2）。',
  '45': '农业、渔业与林业生产食物并管理土地，契合该目标的可持续方向（SDG 2.4）。',
  '47': '建筑工作建设并维修人们赖以生活的基础设施（SDG 9.1）。',
  '49': '安装与维修工作让基础设施和设备持续运作（SDG 9.1）。',
  '51': '生产工作属于该目标希望包容、可持续发展的产业（SDG 9.2）。',
  '53': '运输工作帮助运营运送人员和货物的交通系统（SDG 11.2）。',
  '55': '军事工作旨在保护人们免受暴力与冲突（SDG 16.1）。',
  '11-9031': '幼儿中心负责人管理幼儿照护与教育（SDG 4.2）。',
  '11-9032': '学校负责人管理小学和中学（SDG 4.1）。',
  '11-9033': '高等教育行政人员管理学院和大学（SDG 4.3）。',
  '11-9039': '教育行政人员管理教育与培训项目（SDG 4.3）。',
  '11-9111': '医疗服务经理管理提供基本医疗服务的机构（SDG 3.8）。',
  '17-2071': '电气工程师设计可靠、现代能源所需的供电系统（SDG 7.1）。',
  '17-2081': '环境工程师设计减少污染和处理污水的方法（SDG 6.3）。',
  '17-3025': '环境工程技术员协助减少污染并处理污水（SDG 6.3）。',
  '19-1031': '自然资源保护科学家管理并保护陆地生态系统（SDG 15.1）。',
  '19-1041': '流行病学家追踪并协助控制传染病（SDG 3.3）。',
  '19-1042': '医学研究可能带来新药物和疫苗（SDG 3.b）。',
  '19-2041': '环境科学家研究并协助保护生态系统（SDG 15.1）。',
  '19-3011': '经济学家为支持生产活动和创造就业的政策提供建议（SDG 8.3）。',
  '19-3051': '城市与区域规划师规划城镇和城市的发展（SDG 11.3）。',
  '19-4042': '环境科学技术员监测污染，包括水污染（SDG 6.3）。',
  '21-1094': '社区卫生工作者把医疗服务带到社区（SDG 3.8）。',
  '25-4011': '档案管理员保存构成文化遗产的记录（SDG 11.4）。',
  '25-4012': '策展人保护并分享文化与自然遗产（SDG 11.4）。',
  '25-4013': '博物馆技术员和文物修复人员保护文化遗产藏品（SDG 11.4）。',
  '25-4022': '图书馆员帮助人们查找和使用信息（SDG 16.10）。',
  '25-4031': '图书馆技术员帮助人们查找和使用信息（SDG 16.10）。',
  '33-2011': '消防员保护社区免受火灾和灾害侵害（SDG 11.5, 13.1）。',
  '39-9011': '托儿工作者支持幼儿学习，并分担原本由父母无偿承担的照护工作（SDG 4.2, 5.4）。',
  '45-3031': '渔业依赖健康的鱼类资源，该目标希望恢复这些资源（SDG 14.4）。',
  '45-4011': '森林与自然保护工作者种植、保护和管理森林（SDG 15.2）。',
  '47-2152': '水管工安装管道和设备，为建筑物提供安全用水与卫生设施（SDG 6.1, 6.2）。',
  '47-2231': '太阳能安装人员为能源结构增加可再生能源（SDG 7.2）。',
  '49-9081': '风力涡轮机技术员维护可再生能源发电系统（SDG 7.2）。',
  '51-8013': '发电厂操作员保障可靠的电力持续供应（SDG 7.1）。',
  '51-8031': '水和污水处理操作员供应安全用水并处理污水（SDG 6.1, 6.3）。',
  '53-3052': '公交车司机运营公共交通（SDG 11.2）。',
  '13-2': '金融工作帮助个人和企业使用银行、保险及其他金融服务（SDG 8.10）。',
  '13-1031': '理赔理算员协助保险公司支付个人和企业依赖的保险赔偿（SDG 8.10）。',
  '13-1032': '保险估价师协助保险公司处理理赔（SDG 8.10）。',
  '17-1011': '建筑师设计构成人们赖以生活的基础设施的建筑（SDG 9.1）。',
  '17-1012': '景观建筑师设计公园、街道及其他绿地和公共空间（SDG 11.7）。',
  '17-1022': '测量师测量道路、建筑和其他基础设施所建之地（SDG 9.1）。',
  '17-2051': '土木工程师设计道路、桥梁、供水系统和其他基础设施（SDG 9.1）。',
  '17-3011': '建筑与土木绘图员绘制基础设施建设所需的图纸（SDG 9.1）。',
  '17-3022': '土木工程技术员协助规划、建设和检查基础设施（SDG 9.1）。',
  '17-3031': '测绘技术员收集基础设施项目所需的测量数据（SDG 9.1）。',
  '37-3': '园林养护工作维护公园、花园和其他绿地（SDG 11.7）。',
  '37-1012': '园林养护主管维护公园、花园和其他绿地（SDG 11.7）。',
  '53-7': '物料搬运工作属于就业；该目标希望人人都能获得生产性且体面的工作（SDG 8.5）。',
  '53-7081': '垃圾与回收物收集人员执行该目标强调的市政废弃物管理工作（SDG 11.6）。'
}

const sdgNamesEn: Record<number, string> = {
  1: 'No Poverty',
  2: 'Zero Hunger',
  3: 'Good Health',
  4: 'Quality Education',
  5: 'Gender Equality',
  6: 'Clean Water',
  7: 'Clean Energy',
  8: 'Decent Work',
  9: 'Industry and Innovation',
  10: 'Reduced Inequalities',
  11: 'Sustainable Cities',
  12: 'Responsible Consumption',
  13: 'Climate Action',
  14: 'Life Below Water',
  15: 'Life on Land',
  16: 'Peace and Justice',
  17: 'Partnerships'
}

const sdgNamesMs: Record<number, string> = {
  1: 'Tiada Kemiskinan',
  2: 'Sifar Kelaparan',
  3: 'Kesihatan Baik',
  4: 'Pendidikan Berkualiti',
  5: 'Kesaksamaan Gender',
  6: 'Air Bersih',
  7: 'Tenaga Bersih',
  8: 'Pekerjaan Wajar',
  9: 'Industri dan Inovasi',
  10: 'Mengurangkan Ketidaksamaan',
  11: 'Bandar Mampan',
  12: 'Penggunaan Bertanggungjawab',
  13: 'Tindakan Iklim',
  14: 'Kehidupan di Bawah Air',
  15: 'Kehidupan di Darat',
  16: 'Keamanan dan Keadilan',
  17: 'Kerjasama'
}

const sdgNamesZh: Record<number, string> = {
  1: '无贫穷',
  2: '零饥饿',
  3: '良好健康',
  4: '优质教育',
  5: '性别平等',
  6: '清洁饮水',
  7: '清洁能源',
  8: '体面工作',
  9: '产业与创新',
  10: '减少不平等',
  11: '可持续城市',
  12: '负责任消费',
  13: '气候行动',
  14: '水下生物',
  15: '陆地生物',
  16: '和平与正义',
  17: '伙伴关系'
}

export const roadmapText = defineText(
  {
    startAgain: {
      speech: {
        'Finish your 12 questions': 'Finish your 12 questions',
        'Pick a role to check first': 'Pick a role to check first',
        'Tell me your job first': 'Tell me your job first'
      },
      label: {
        'Answer the Questions': 'Answer the Questions',
        'Pick a Role to Check': 'Pick a Role to Check',
        'Choose Your Job': 'Choose Your Job'
      },
      continueSpeech: (speech: string) => `${speech}, then I can make a roadmap for it.`
    },
    errors: {
      openJobTitle: 'Kopi Could Not Open This Job',
      reloadOrChooseJob: 'Reload the page, or choose your job again.',
      openingJob: 'Opening the box on your job…',
      skillsNotReadyTitle: 'Roadmap Skills Are Not Ready',
      skillsNotReadyBody:
        'Kopi has no can-do statements or learning hours for this job yet. Choose a related job for now.',
      chooseAnotherJob: 'Choose Another Job'
    },
    fit: {
      already: 'Already at least 80% Fit',
      byWeek: (week: number) => `80% Fit by Week ${week}`,
      belowWithin: (weeks: number) => `Below 80% Fit Within ${weeks} Weeks`,
      belowAtWeek: (fit: number, week: number) => `Below 80% Fit · ${fit}% by Week ${week}`,
      weekNumber: (week: number) => `Week ${week}`,
      noEstimate: 'No Readiness Estimate Yet',
      percent: (fit: number) => `${fit}% fit`,
      chartDescription: (annotation: string) =>
        `Estimated fit by plan week. ${annotation}. Clicking a point selects the step that is active in that week.`,
      speechReady: (weeks: number, hours: string) =>
        `You already meet the 80% fit threshold. These next ${weeks} weeks build your remaining skills at ${hours} hours a week.`,
      speechPlanned: (weeks: number, hours: string, readyCopy: string) =>
        `Your next ${weeks} weeks are planned at ${hours} hours a week. ${readyCopy}.`,
      speechNoSteps: 'There are no learning steps for this snapshot yet.',
      roadmapTitle: (weeks: number) => `Your ${weeks}-Week Roadmap`,
      roadmapTitleShort: 'Your Roadmap',
      summary: (role: string, ready: string, hours: string, date: string) =>
        `${role} · ${ready} · ${hours} h a Week · Starts ${date}`,
      heading: (role: string) => `Readiness for ${role}`,
      legend: 'Readiness Legend',
      yourPlan: 'Your Plan',
      threshold: 'Threshold = 80% Fit',
      today: 'Today',
      noStepsToPlot: 'No Roadmap Steps To Plot Yet.',
      tableCaption: 'Estimated fit by plan week',
      week: 'Week',
      date: 'Date',
      yourPlanFit: 'Your Plan Fit'
    },
    controls: {
      exportPdf: 'Export as PDF',
      planControls: 'Plan Controls',
      hoursPerWeek: 'Hours Per Week',
      planStartDate: 'Plan Start Date',
      impactArea: 'Impact Area',
      highlightStepsBySdg: 'Highlight Steps By SDG',
      filterStepsByImpact: 'Filter Steps By SDG Impact Area',
      showAll: 'Show All',
      stepDetails: 'Step Details',
      stepDetailsAria: 'Roadmap Reasoning',
      continue: 'Continue:'
    },
    qualification:
      'The steps below build the skills the role uses, so you can test whether the work suits you. To practise it, you’d still need the qualification and the admission above.',
    stepDetails: {
      paceSet: 'Pace set for you.',
      seeMaths: 'See the Maths',
      noLearningSteps: 'No learning steps are needed for this snapshot.',
      afterWeek: (week: number) => `After Week ${week}`,
      remaining: (hours: string, weeks: number) =>
        `About ${hours} learning hours remain after this window. The full path is about ${weeks} weeks at these hours. The 80% fit threshold does not mean every skill target is met.`,
      noLessImportant: 'No skills are marked as less important in this plan.'
    },
    funding: {
      title: 'Can Your Employer Fund This?',
      eligibility:
        'If your employer is registered with HRD Corp, it pays a training levy. It can claim approved training from that levy.',
      application:
        'Your employer applies for the grant in e-TRiS before training starts. The training must run at least 4 hours.',
      schemeRules: 'explains the scheme rules.',
      freePremium: 'offers free and premium courses.',
      source: (date: string) => `Source: HRD Corp · accessed ${date}`,
      accessed: (date: string) => `accessed ${date}`
    },
    freeTime: {
      title: 'Free Up Time With AI',
      noEstimate: 'There is no source-backed estimate of time saved for this role yet.',
      already: 'Already at least 80% Fit',
      changedWeek: (after: number, before: number) => `80% Fit by Week ${after}, Was Week ${before}`,
      newlyReady: (after: number) => `80% Fit by Week ${after} · Was Below 80%`,
      withTheseHours: (after: number) => `80% Fit by Week ${after} With These Hours`,
      withCurrentHours: (before: number) => `80% Fit by Week ${before} With Current Hours`,
      belowWithin: (weeks: number) => `Below 80% Fit Within ${weeks} Weeks`,
      aboutHours: (hours: string) => `About ${hours} h a week`,
      savedHours: (hours: string) => `-${hours} h`,
      goesFree: 'goes free with AI on tasks like these.',
      apply: (hours: string) => `Use ${hours} h a Week for My Plan`,
      source: 'Source: Anthropic Economic Index'
    },
    path: {
      title: 'What This Path Contributes To',
      description: (targets: number, steps: number, hours: string, shared: boolean) =>
        `The UN SDG ${targets === 1 ? 'target' : 'targets'} your ${steps} ${steps === 1 ? 'step builds' : 'steps build'} toward, from about ${hours} learning hours.${shared ? ' A step tagged with two targets counts toward each.' : ''}`,
      stepHours: (steps: number, hours: string) => `${steps} ${steps === 1 ? 'step' : 'steps'} · about ${hours} h`
    },
    timeline: {
      title: 'Timeline',
      zoomIn: 'Zoom In',
      zoomOut: 'Zoom Out',
      fitPlan: 'Fit Plan',
      legend: 'Timeline Legend',
      nextStep: 'Next Step',
      upcomingStep: 'Upcoming Step',
      doneStep: 'Done Step',
      groupLabel:
        'Zoom and pan the timeline. Ctrl or Cmd plus the mouse wheel zooms, arrow keys pan, dragging pans when zoomed in.',
      weeks: 'Weeks',
      hours: 'Hours',
      hoursPerWeek: 'Hours per Week',
      weekRange: (first: number, last: number) => (first === last ? `W${first}` : `W${first}–${last}`),
      axisWeek: (week: number) => `W${week}`,
      rowStep: (step: number) => `Step ${step}`,
      barLabel: (weeks: string, hours: string) => `${weeks} · ${hours} h/wk`,
      barAria: (skill: string, first: number, last: number, weekly: string, total: string) =>
        `${skill}, weeks ${first} to ${last}, ${weekly} h a week, about ${total} h total`,
      hoursLine: (weekly: string, total: string) => `${weekly} h a week · about ${total} h total`,
      resource: (label: string) => `Resource: ${label}`,
      searchSuggestion: 'Search suggestion, not checked',
      free: 'Free',
      tapHint: 'Tap again to see its step details.',
      noSteps: 'No Roadmap Steps Are Available For This Snapshot.',
      tableCaption: 'Roadmap timeline by week',
      step: 'Step',
      startWeek: 'Start Week',
      endWeek: 'End Week',
      sdgTargets: 'SDG Targets'
    },
    stepCard: {
      refresher: 'Refresher',
      later: 'Later',
      done: 'Done',
      showLess: 'Show Less',
      showMore: 'Show More',
      time: 'Time',
      builds: 'Builds',
      sdgTargets: 'SDG Targets',
      weekName: (first: number, last: number) => (first === last ? `week ${first}` : `weeks ${first} to ${last}`),
      weekRange: (first: number, last: number) => (first === last ? `Week ${first}` : `Weeks ${first}–${last}`),
      weekSpan: (first: number, last: number) => `Weeks ${first}–${last}`,
      doneLabel: (skill: string, weeks: string) => `Done: ${skill}, ${weeks}`,
      aboutTotal: (hours: string) => `About ${hours} h total`,
      perWeek: (hours: string) => `${hours} h a week`,
      opensInNewTab: '(opens in a new tab)',
      levels: { basic: 'Basic', working: 'Working', advanced: 'Advanced' },
      aboutLevel: (level: number, skill: string, _levelName: string) => `About Level ${level} · ${skill}`,
      estimated: 'Estimated',
      useResource: 'Use the linked resource to practise this skill.',
      searchResource: (title: string) => `Search: ${title}`,
      partialDescription: (description: string, allocated: string, hours: string, week: number) =>
        `${description} First ${allocated} of ${hours} estimated hours. Continue after Week ${week}.`,
      fullTarget: (gain: string) => `Target after the full milestone: ${gain}`
    },
    pace: {
      yourPace: 'Your pace',
      paceFactor: 'Pace factor',
      inputLabels: {
        situation: 'Situation',
        yearsOfWork: 'Years of work',
        qualification: 'Qualification'
      },
      situations: {
        working: 'Working',
        studying: 'Studying',
        graduated: 'Recently graduated',
        between_jobs: 'Between jobs',
        returning: 'Returning to work'
      },
      education: {
        secondary: 'SPM or below',
        certificate: 'Certificate',
        diploma: 'Diploma',
        bachelor: 'Bachelor’s degree',
        master: 'Master’s degree',
        doctorate: 'Doctorate'
      },
      years: {
        none: 'None yet',
        underTwo: 'Under 2 years',
        twoToThree: '2 to 3 years',
        fourToFive: '4 to 5 years',
        sixToNine: '6 to 9 years',
        tenOrMore: '10 years or more'
      },
      notGiven: 'Not given',
      notes: {
        faster: 'Faster than typical: your experience should shorten the hours. A stated estimate.',
        typical: 'Typical pace. A stated estimate.',
        morePractice:
          'Needs more practice time: the hours are lengthened to fit your starting point. A stated estimate.'
      },
      mathsFinal: 'Each step’s hours are multiplied by the factor; the finish week follows.',
      keptBetween: (min: number, max: number, finalLine: string) =>
        `Kept between ${min}x and ${max}x. ${finalLine} Unknown answers count as 1.00. A fixed rule; no AI sets it.`,
      refresherNote: (hours: number) =>
        `Refresher step added because you are returning to work: ${hours} fixed hours, not scaled by the factor.`,
      refreshers: {
        refresher: {
          title: 'Refresh your work routine',
          description:
            'A short warm-up before the skill steps: review how your field works today and rebuild a weekly study habit.'
        }
      }
    },
    tools: {
      employersName: 'Tools Employers Name',
      learnWith: 'Tools to Learn With',
      inDemand: (role: string) => `Software in demand in job postings for ${role}, from O*NET, in alphabetical order.`,
      oftenNamed: (role: string) => `Software that job postings for ${role} often name, from O*NET.`,
      usAndMalaysia: 'US postings; Malaysian job ads, where Kotak has them, show what employers here ask for.',
      listLabel: (role: string) => `Tools for ${role}`,
      showFewer: 'Show Fewer',
      showAll: (count: number) => `Show All ${count}`
    },
    reasoning: {
      paused: 'Explanation Paused',
      title: 'Why Kopi Says This',
      pausedText: 'Fixed rules set this verdict from the dated sources below, so it still holds.',
      youNeeded: (you: string, needed: string) => `You ${you} · Needed ${needed}`,
      pausedFooter: 'Fixed rules set this verdict from the sources below.',
      claudeFooter: 'Kopi wrote this with Claude from the cited rows only. Fixed rules set the verdict.',
      templateFooter: 'Fixed rules set the verdict. This summary is built from the cited inputs.',
      levels: { None: 'None', Basic: 'Basic', Working: 'Working', Advanced: 'Advanced' },
      twoFutures: 'The two AI futures disagree',
      jobAdSources: 'The job-ad sources disagree',
      disagree: (cause: string, slow: string, fast: string) =>
        `${cause}: ${slow} at Malaysia’s pace, ${fast} if AI uptake speeds up.`,
      skillMark: (status: string) => `Kopi marks this skill ${status.toLocaleLowerCase()}.`,
      tooFewPoints: 'There are too few dated data points to call a trend yet.',
      noCollaborationSplit: 'There is no data yet on whether AI helps with this work or does it alone.',
      noDemand: 'There is no job-ad demand data for this skill yet.',
      aiTrend: {
        rising: 'is rising',
        notRising: 'is not rising',
        unknown: 'has no trend yet'
      },
      aiMode: {
        augmentation: 'mostly helps people do it',
        automation: 'mostly does it alone',
        unknown: ''
      },
      demand: {
        up: 'rising',
        flat: 'flat',
        down: 'falling',
        unknown: 'not measured yet'
      },
      tableReason: (trend: string, mode: string, demand: string) =>
        `AI use for this work ${trend}${mode ? ` and AI ${mode}` : ''}. Job-ad demand is ${demand}.`
    },
    sdg: {
      names: sdgNamesEn,
      reasons: sdgReasonsEn,
      goal: (goal: number) => `Goal ${goal}`,
      whyItCounts: 'Why It Counts',
      whyWorkCounts: 'Why This Work Counts',
      unTarget: (target: string) => `UN Target ${target}`,
      sourceCredit: {
        before: 'Target text from the ',
        link: 'UN SDG API',
        after: (date: string) => `, read ${date}. The reason is Kotak’s.`
      }
    },
    occupationReasons: occupationReasonsEn
  },
  {
    startAgain: {
      speech: {
        'Finish your 12 questions': 'Lengkapkan 12 soalan anda',
        'Pick a role to check first': 'Pilih peranan untuk disemak dahulu',
        'Tell me your job first': 'Beritahu saya pekerjaan anda dahulu'
      },
      label: {
        'Answer the Questions': 'Jawab Soalan',
        'Pick a Role to Check': 'Pilih Peranan untuk Disemak',
        'Choose Your Job': 'Pilih Pekerjaan Anda'
      },
      continueSpeech: (speech) => `${speech}, kemudian saya boleh sediakan peta jalan untuknya.`
    },
    errors: {
      openJobTitle: 'Kopi Tidak Dapat Membuka Pekerjaan Ini',
      reloadOrChooseJob: 'Muat semula laman, atau pilih pekerjaan anda sekali lagi.',
      openingJob: 'Sedang membuka maklumat pekerjaan anda…',
      skillsNotReadyTitle: 'Kemahiran Peta Jalan Belum Sedia',
      skillsNotReadyBody:
        'Kopi belum mempunyai pernyataan kebolehan atau jam pembelajaran untuk pekerjaan ini. Pilih pekerjaan berkaitan dahulu.',
      chooseAnotherJob: 'Pilih Pekerjaan Lain'
    },
    fit: {
      already: 'Sudah mencapai Padanan 80%',
      byWeek: (week) => `Padanan 80% menjelang Minggu ${week}`,
      belowWithin: (weeks) => `Padanan di bawah 80% dalam ${weeks} minggu`,
      belowAtWeek: (fit, week) => `Padanan di bawah 80% · ${fit}% menjelang Minggu ${week}`,
      weekNumber: (week) => `Minggu ${week}`,
      noEstimate: 'Anggaran kesiapsiagaan belum tersedia',
      percent: (fit) => `${fit}% padanan`,
      chartDescription: (annotation) =>
        `Anggaran padanan mengikut minggu pelan. ${annotation}. Pilih titik untuk melihat langkah yang aktif pada minggu itu.`,
      speechReady: (weeks, hours) =>
        `Anda sudah mencapai ambang padanan 80%. Dalam ${weeks} minggu akan datang, anda akan membina kemahiran yang masih perlu pada kadar ${hours} jam seminggu.`,
      speechPlanned: (weeks, hours, readyCopy) =>
        `Pelan untuk ${weeks} minggu akan datang memperuntukkan ${hours} jam seminggu. ${readyCopy}.`,
      speechNoSteps: 'Belum ada langkah pembelajaran untuk paparan ini.',
      roadmapTitle: (weeks) => `Peta Jalan ${weeks} Minggu Anda`,
      roadmapTitleShort: 'Peta Jalan Anda',
      summary: (role, ready, hours, date) => `${role} · ${ready} · ${hours} jam seminggu · Bermula ${date}`,
      heading: (role) => `Kesiapsiagaan untuk ${role}`,
      legend: 'Petunjuk Kesiapsiagaan',
      yourPlan: 'Pelan Anda',
      threshold: 'Ambang = Padanan 80%',
      today: 'Hari Ini',
      noStepsToPlot: 'Belum Ada Langkah Peta Jalan untuk Dipaparkan.',
      tableCaption: 'Anggaran padanan mengikut minggu pelan',
      week: 'Minggu',
      date: 'Tarikh',
      yourPlanFit: 'Padanan Pelan Anda'
    },
    controls: {
      exportPdf: 'Eksport sebagai PDF',
      planControls: 'Kawalan Pelan',
      hoursPerWeek: 'Jam Seminggu',
      planStartDate: 'Tarikh Mula Pelan',
      impactArea: 'Bidang Impak',
      highlightStepsBySdg: 'Serlahkan Langkah Mengikut SDG',
      filterStepsByImpact: 'Tapis Langkah Mengikut Bidang Impak SDG',
      showAll: 'Tunjukkan Semua',
      stepDetails: 'Butiran Langkah',
      stepDetailsAria: 'Sebab Peta Jalan',
      continue: 'Teruskan:'
    },
    qualification:
      'Langkah di bawah membina kemahiran yang digunakan dalam peranan ini, supaya anda boleh menilai kesesuaiannya. Untuk melakukan kerja ini, anda masih memerlukan kelayakan dan kelulusan di atas.',
    stepDetails: {
      paceSet: 'Kadar ditetapkan untuk anda.',
      seeMaths: 'Lihat Pengiraan',
      noLearningSteps: 'Tiada langkah pembelajaran diperlukan untuk paparan ini.',
      afterWeek: (week) => `Selepas Minggu ${week}`,
      remaining: (hours, weeks) =>
        `Kira-kira ${hours} jam pembelajaran berbaki selepas tempoh ini. Keseluruhan laluan mengambil kira-kira ${weeks} minggu pada kadar ini. Ambang padanan 80% tidak bermakna semua sasaran kemahiran telah dicapai.`,
      noLessImportant: 'Tiada kemahiran ditandakan kurang penting dalam pelan ini.'
    },
    funding: {
      title: 'Bolehkah Majikan Membiayai Ini?',
      eligibility:
        'Jika majikan anda berdaftar dengan HRD Corp, majikan membayar levi latihan. Majikan boleh menuntut latihan yang diluluskan daripada levi itu.',
      application:
        'Majikan anda memohon geran melalui e-TRiS sebelum latihan bermula. Latihan mesti berlangsung sekurang-kurangnya 4 jam.',
      schemeRules: 'menerangkan peraturan skim ini.',
      freePremium: 'menawarkan kursus percuma dan berbayar.',
      source: (date) => `Sumber: HRD Corp · diakses pada ${date}`,
      accessed: (date) => `diakses pada ${date}`
    },
    freeTime: {
      title: 'Luangkan Masa dengan AI',
      noEstimate: 'Belum ada anggaran bersumber tentang masa yang dapat dijimatkan untuk peranan ini.',
      already: 'Sudah mencapai Padanan 80%',
      changedWeek: (after, before) => `Padanan 80% menjelang Minggu ${after}, sebelum ini Minggu ${before}`,
      newlyReady: (after) => `Padanan 80% menjelang Minggu ${after} · Sebelum ini di bawah 80%`,
      withTheseHours: (after) => `Padanan 80% menjelang Minggu ${after} dengan Jam Ini`,
      withCurrentHours: (before) => `Padanan 80% menjelang Minggu ${before} dengan Jam Semasa`,
      belowWithin: (weeks) => `Padanan di bawah 80% dalam ${weeks} minggu`,
      aboutHours: (hours) => `Kira-kira ${hours} jam seminggu`,
      savedHours: (hours) => `-${hours} jam`,
      goesFree: 'masa akan diluangkan dengan AI untuk tugas seperti ini.',
      apply: (hours) => `Gunakan ${hours} jam seminggu untuk Pelan Saya`,
      source: 'Sumber: Anthropic Economic Index'
    },
    path: {
      title: 'Sumbangan Laluan Ini',
      description: (targets, steps, hours, shared) =>
        `Sumbangan kepada ${targets} sasaran UN SDG melalui ${steps} langkah, dengan kira-kira ${hours} jam pembelajaran.${shared ? ' Langkah dengan dua sasaran dikira untuk kedua-duanya.' : ''}`,
      stepHours: (steps, hours) => `${steps} langkah · kira-kira ${hours} jam`
    },
    timeline: {
      title: 'Garis Masa',
      zoomIn: 'Zum Masuk',
      zoomOut: 'Zum Keluar',
      fitPlan: 'Muatkan Pelan',
      legend: 'Petunjuk Garis Masa',
      nextStep: 'Langkah Seterusnya',
      upcomingStep: 'Langkah Akan Datang',
      doneStep: 'Langkah Selesai',
      groupLabel:
        'Zum dan gerakkan garis masa. Ctrl atau Cmd bersama roda tetikus untuk zum, kekunci anak panah untuk bergerak, dan seret untuk bergerak apabila zum masuk.',
      weeks: 'Minggu',
      hours: 'Jam',
      hoursPerWeek: 'Jam Seminggu',
      weekRange: (first, last) => (first === last ? `Minggu ${first}` : `Minggu ${first}–${last}`),
      axisWeek: (week) => `M${week}`,
      rowStep: (step) => `Langkah ${step}`,
      barLabel: (weeks, hours) => `${weeks} · ${hours} jam/minggu`,
      barAria: (skill, first, last, weekly, total) =>
        `${skill}, minggu ${first} hingga ${last}, ${weekly} jam seminggu, kira-kira ${total} jam keseluruhan`,
      hoursLine: (weekly, total) => `${weekly} jam seminggu · kira-kira ${total} jam keseluruhan`,
      resource: (label) => `Sumber: ${label}`,
      searchSuggestion: 'Cadangan carian, belum disemak',
      free: 'Percuma',
      tapHint: 'Ketik sekali lagi untuk melihat butiran langkah.',
      noSteps: 'Tiada Langkah Peta Jalan untuk Paparan Ini.',
      tableCaption: 'Garis masa peta jalan mengikut minggu',
      step: 'Langkah',
      startWeek: 'Minggu Mula',
      endWeek: 'Minggu Tamat',
      sdgTargets: 'Sasaran SDG'
    },
    stepCard: {
      refresher: 'Ulang Kaji',
      later: 'Kemudian',
      done: 'Selesai',
      showLess: 'Tunjukkan Kurang',
      showMore: 'Tunjukkan Lagi',
      time: 'Masa',
      builds: 'Membina',
      sdgTargets: 'Sasaran SDG',
      weekName: (first, last) => (first === last ? `minggu ${first}` : `minggu ${first} hingga ${last}`),
      weekRange: (first, last) => (first === last ? `Minggu ${first}` : `Minggu ${first}–${last}`),
      weekSpan: (first, last) => `Minggu ${first}–${last}`,
      doneLabel: (skill, weeks) => `Selesai: ${skill}, ${weeks}`,
      aboutTotal: (hours) => `Kira-kira ${hours} jam keseluruhan`,
      perWeek: (hours) => `${hours} jam seminggu`,
      opensInNewTab: '(dibuka dalam tab baharu)',
      levels: { basic: 'Asas', working: 'Kompeten', advanced: 'Lanjutan' },
      aboutLevel: (_level, skill, levelName) => `Anggaran Tahap ${levelName} · ${skill}`,
      estimated: 'Anggaran',
      useResource: 'Gunakan sumber yang dipautkan untuk berlatih kemahiran ini.',
      searchResource: (title) => `Carian: ${title}`,
      partialDescription: (description, allocated, hours, week) =>
        `${description} ${allocated} daripada ${hours} jam anggaran yang pertama. Sambung selepas Minggu ${week}.`,
      fullTarget: (gain) => `Sasaran selepas langkah penuh: ${gain}`
    },
    pace: {
      yourPace: 'Kadar Anda',
      paceFactor: 'Faktor kadar',
      inputLabels: {
        situation: 'Situasi',
        yearsOfWork: 'Tempoh Bekerja',
        qualification: 'Kelayakan'
      },
      situations: {
        working: 'Bekerja',
        studying: 'Belajar',
        graduated: 'Baru tamat pengajian',
        between_jobs: 'Antara pekerjaan',
        returning: 'Kembali bekerja'
      },
      education: {
        secondary: 'SPM atau ke bawah',
        certificate: 'Sijil',
        diploma: 'Diploma',
        bachelor: 'Ijazah Sarjana Muda',
        master: 'Ijazah Sarjana',
        doctorate: 'Doktor Falsafah'
      },
      years: {
        none: 'Belum ada',
        underTwo: 'Kurang 2 tahun',
        twoToThree: '2 hingga 3 tahun',
        fourToFive: '4 hingga 5 tahun',
        sixToNine: '6 hingga 9 tahun',
        tenOrMore: '10 tahun atau lebih'
      },
      notGiven: 'Tidak diberikan',
      notes: {
        faster:
          'Lebih pantas daripada biasa: pengalaman anda sepatutnya memendekkan tempoh. Ini anggaran yang dinyatakan.',
        typical: 'Kadar biasa. Ini anggaran yang dinyatakan.',
        morePractice:
          'Perlu lebih masa latihan: jam ditambah mengikut tahap permulaan anda. Ini anggaran yang dinyatakan.'
      },
      mathsFinal: 'Jam bagi setiap langkah didarab dengan faktor; minggu tamat ditentukan selepas itu.',
      keptBetween: (min, max, finalLine) =>
        `Dikekalkan antara ${min}x dan ${max}x. ${finalLine} Jawapan tidak diketahui dikira sebagai 1.00. Peraturan tetap; AI tidak menentukannya.`,
      refresherNote: (hours) =>
        `Langkah ulang kaji ditambah kerana anda kembali bekerja: ${hours} jam tetap, tidak didarab dengan faktor.`,
      refreshers: {
        refresher: {
          title: 'Segarkan rutin kerja anda',
          description:
            'Persediaan ringkas sebelum langkah kemahiran: semak keadaan bidang anda hari ini dan bina semula tabiat belajar mingguan.'
        }
      }
    },
    tools: {
      employersName: 'Alat yang Disebut Majikan',
      learnWith: 'Alat untuk Dipelajari',
      inDemand: (role) =>
        `Perisian yang banyak diminta dalam iklan kerja untuk ${role}, daripada O*NET, mengikut abjad.`,
      oftenNamed: (role) => `Perisian yang sering disebut dalam iklan kerja untuk ${role}, daripada O*NET.`,
      usAndMalaysia:
        'Iklan kerja AS; jika ada, iklan kerja Malaysia di Kotak menunjukkan perkara yang diminta majikan di sini.',
      listLabel: (role) => `Alat untuk ${role}`,
      showFewer: 'Tunjukkan Kurang',
      showAll: (count) => `Tunjukkan Semua ${count}`
    },
    reasoning: {
      paused: 'Penjelasan Dijeda',
      title: 'Mengapa Kopi Berkata Begini',
      pausedText:
        'Peraturan tetap menetapkan keputusan ini berdasarkan sumber bertarikh di bawah, jadi keputusan ini masih terpakai.',
      youNeeded: (you, needed) => `Anda ${you} · Diperlukan ${needed}`,
      pausedFooter: 'Peraturan tetap menetapkan keputusan ini berdasarkan sumber di bawah.',
      claudeFooter:
        'Kopi menulis ini bersama Claude berdasarkan baris yang dipetik sahaja. Peraturan tetap menetapkan keputusan.',
      templateFooter: 'Peraturan tetap menetapkan keputusan. Ringkasan ini dibina daripada input yang dipetik.',
      levels: { None: 'Tiada', Basic: 'Asas', Working: 'Kompeten', Advanced: 'Lanjutan' },
      twoFutures: 'Dua gambaran masa depan AI berbeza',
      jobAdSources: 'Sumber iklan kerja berbeza pendapat',
      disagree: (cause, slow, fast) =>
        `${cause}: ${slow} pada kadar Malaysia, ${fast} jika penggunaan AI meningkat lebih pantas.`,
      skillMark: (status) => `Kopi menandakan kemahiran ini ${status}.`,
      tooFewPoints: 'Terlalu sedikit titik data bertarikh untuk menentukan arah aliran.',
      noCollaborationSplit: 'Belum ada data tentang sama ada AI membantu kerja ini atau melakukannya sendiri.',
      noDemand: 'Belum ada data permintaan iklan kerja untuk kemahiran ini.',
      aiTrend: {
        rising: 'sedang meningkat',
        notRising: 'tidak meningkat',
        unknown: 'belum mempunyai arah aliran'
      },
      aiMode: {
        augmentation: 'kebanyakannya membantu orang melakukannya',
        automation: 'kebanyakannya melakukannya sendiri',
        unknown: ''
      },
      demand: {
        up: 'meningkat',
        flat: 'stabil',
        down: 'menurun',
        unknown: 'belum diukur'
      },
      tableReason: (trend, mode, demand) =>
        `Penggunaan AI untuk kerja ini ${trend}${mode ? ` dan AI ${mode}` : ''}. Permintaan dalam iklan kerja ${demand}.`
    },
    sdg: {
      names: sdgNamesMs,
      reasons: sdgReasonsMs,
      goal: (goal) => `Matlamat ${goal}`,
      whyItCounts: 'Sebab Ia Dikira',
      whyWorkCounts: 'Sebab Kerja Ini Dikira',
      unTarget: (target) => `Sasaran UN ${target}`,
      sourceCredit: {
        before: 'Teks sasaran daripada ',
        link: 'UN SDG API',
        after: (date) => `, dibaca pada ${date}. Sebab ini daripada Kotak.`
      }
    },
    occupationReasons: occupationReasonsMs
  },
  {
    startAgain: {
      speech: {
        'Finish your 12 questions': '先完成 12 道问题',
        'Pick a role to check first': '先选择要检测的职位',
        'Tell me your job first': '先告诉我你的工作'
      },
      label: {
        'Answer the Questions': '回答问题',
        'Pick a Role to Check': '选择要检测的职位',
        'Choose Your Job': '选择你的工作'
      },
      continueSpeech: (speech) => `${speech}，然后我就能为你制定路线图。`
    },
    errors: {
      openJobTitle: 'Kopi 无法打开这份工作资料',
      reloadOrChooseJob: '请重新加载页面，或重新选择你的工作。',
      openingJob: '正在查看你的工作资料…',
      skillsNotReadyTitle: '路线图技能尚未准备好',
      skillsNotReadyBody: 'Kopi 目前还没有这份工作的可执行陈述或学习时数。请先选择相关工作。',
      chooseAnotherJob: '选择其他工作'
    },
    fit: {
      already: '已达到至少 80% 匹配度',
      byWeek: (week) => `第 ${week} 周达到 80% 匹配度`,
      belowWithin: (weeks) => `${weeks} 周内匹配度未达 80%`,
      belowAtWeek: (fit, week) => `匹配度未达 80% · 第 ${week} 周为 ${fit}%`,
      weekNumber: (week) => `第 ${week} 周`,
      noEstimate: '暂无准备度估算',
      percent: (fit) => `${fit}% 匹配度`,
      chartDescription: (annotation) => `按计划周数估算匹配度。${annotation}。点击数据点可选择该周正在进行的步骤。`,
      speechReady: (weeks, hours) =>
        `你已经达到 80% 匹配度门槛。接下来 ${weeks} 周会按每周 ${hours} 小时的进度提升你尚需加强的技能。`,
      speechPlanned: (weeks, hours, readyCopy) => `接下来 ${weeks} 周的计划是每周学习 ${hours} 小时。${readyCopy}。`,
      speechNoSteps: '此快照目前没有学习步骤。',
      roadmapTitle: (weeks) => `你的 ${weeks} 周路线图`,
      roadmapTitleShort: '你的路线图',
      summary: (role, ready, hours, date) => `${role} · ${ready} · 每周 ${hours} 小时 · 开始于 ${date}`,
      heading: (role) => `${role} 的准备度`,
      legend: '准备度图例',
      yourPlan: '你的计划',
      threshold: '门槛 = 80% 匹配度',
      today: '今天',
      noStepsToPlot: '暂无路线图步骤可供绘制。',
      tableCaption: '按计划周数估算匹配度',
      week: '周',
      date: '日期',
      yourPlanFit: '你的计划匹配度'
    },
    controls: {
      exportPdf: '导出为 PDF',
      planControls: '计划设置',
      hoursPerWeek: '每周学习时数',
      planStartDate: '计划开始日期',
      impactArea: '影响领域',
      highlightStepsBySdg: '按 SDG 突出显示步骤',
      filterStepsByImpact: '按 SDG 影响领域筛选步骤',
      showAll: '显示全部',
      stepDetails: '步骤详情',
      stepDetailsAria: '路线图说明',
      continue: '继续：'
    },
    qualification:
      '下面的步骤会帮助你培养该职位所需的技能，让你判断这类工作是否适合自己。若要从事这份工作，你仍需要上方提到的资格和录取许可。',
    stepDetails: {
      paceSet: '已为你设定学习进度。',
      seeMaths: '查看计算方式',
      noLearningSteps: '此快照无需学习步骤。',
      afterWeek: (week) => `第 ${week} 周之后`,
      remaining: (hours, weeks) =>
        `此阶段之后还剩约 ${hours} 小时的学习内容。按目前的时数，完整路径约需 ${weeks} 周。达到 80% 匹配度不代表已满足所有技能目标。`,
      noLessImportant: '此计划没有标记为较不重要的技能。'
    },
    funding: {
      title: '雇主可以资助这项培训吗？',
      eligibility: '如果你的雇主已向 HRD Corp 注册，就会缴纳培训税。雇主可用这笔税款申领获批的培训费用。',
      application: '你的雇主必须在培训开始前通过 e-TRiS 申请拨款。培训至少要进行 4 小时。',
      schemeRules: '说明计划规则。',
      freePremium: '提供免费和付费课程。',
      source: (date) => `来源：HRD Corp · 查阅日期 ${date}`,
      accessed: (date) => `查阅日期 ${date}`
    },
    freeTime: {
      title: '用 AI 腾出时间',
      noEstimate: '目前没有这份工作可节省时数的来源估算。',
      already: '已达到至少 80% 匹配度',
      changedWeek: (after, before) => `第 ${after} 周达到 80% 匹配度，原为第 ${before} 周`,
      newlyReady: (after) => `第 ${after} 周达到 80% 匹配度 · 原本未达 80%`,
      withTheseHours: (after) => `按这些时数，第 ${after} 周达到 80% 匹配度`,
      withCurrentHours: (before) => `按目前时数，第 ${before} 周达到 80% 匹配度`,
      belowWithin: (weeks) => `${weeks} 周内匹配度未达 80%`,
      aboutHours: (hours) => `每周约 ${hours} 小时`,
      savedHours: (hours) => `-${hours} 小时`,
      goesFree: '使用 AI 处理这类任务后可腾出时间。',
      apply: (hours) => `每周将 ${hours} 小时用于我的计划`,
      source: '来源：Anthropic Economic Index'
    },
    path: {
      title: '这条路径的贡献',
      description: (targets, steps, hours, shared) =>
        `这 ${steps} 个步骤将助力实现 UN SDG 的 ${targets} 项目标，预计需学习约 ${hours} 小时。${shared ? '标记两个目标的步骤会同时计入两者。' : ''}`,
      stepHours: (steps, hours) => `${steps} 个步骤 · 约 ${hours} 小时`
    },
    timeline: {
      title: '时间线',
      zoomIn: '放大',
      zoomOut: '缩小',
      fitPlan: '适配计划',
      legend: '时间线图例',
      nextStep: '下一步',
      upcomingStep: '后续步骤',
      doneStep: '已完成步骤',
      groupLabel: '缩放并平移时间线。按住 Ctrl 或 Cmd 并滚动鼠标滚轮可缩放；用方向键平移；放大后也可拖动平移。',
      weeks: '周数',
      hours: '小时',
      hoursPerWeek: '每周时数',
      weekRange: (first, last) => (first === last ? `第 ${first} 周` : `第 ${first}–${last} 周`),
      axisWeek: (week) => `第 ${week} 周`,
      rowStep: (step) => `第 ${step} 步`,
      barLabel: (weeks, hours) => `${weeks} · 每周 ${hours} 小时`,
      barAria: (skill, first, last, weekly, total) =>
        `${skill}，第 ${first} 至 ${last} 周，每周 ${weekly} 小时，总计约 ${total} 小时`,
      hoursLine: (weekly, total) => `每周 ${weekly} 小时 · 总计约 ${total} 小时`,
      resource: (label) => `资源：${label}`,
      searchSuggestion: '搜索建议，未经核实',
      free: '免费',
      tapHint: '再点一次查看步骤详情。',
      noSteps: '此快照没有可用的路线图步骤。',
      tableCaption: '按周排列的路线图时间线',
      step: '步骤',
      startWeek: '开始周',
      endWeek: '结束周',
      sdgTargets: 'SDG 目标'
    },
    stepCard: {
      refresher: '复习步骤',
      later: '稍后',
      done: '完成',
      showLess: '收起',
      showMore: '展开',
      time: '时间',
      builds: '培养',
      sdgTargets: 'SDG 目标',
      weekName: (first, last) => (first === last ? `第 ${first} 周` : `第 ${first} 至 ${last} 周`),
      weekRange: (first, last) => (first === last ? `第 ${first} 周` : `第 ${first}–${last} 周`),
      weekSpan: (first, last) => `第 ${first}–${last} 周`,
      doneLabel: (skill, weeks) => `完成：${skill}，${weeks}`,
      aboutTotal: (hours) => `总计约 ${hours} 小时`,
      perWeek: (hours) => `每周 ${hours} 小时`,
      opensInNewTab: '（在新标签页中打开）',
      levels: { basic: '基础', working: '熟练', advanced: '高级' },
      aboutLevel: (_level, skill, levelName) => `目标水平 ${levelName} · ${skill}`,
      estimated: '估算',
      useResource: '使用链接中的资源练习这项技能。',
      searchResource: (title) => `搜索：${title}`,
      partialDescription: (description, allocated, hours, week) =>
        `${description} 先完成估算 ${hours} 小时中的 ${allocated} 小时。第 ${week} 周后继续。`,
      fullTarget: (gain) => `完成整个步骤后的目标：${gain}`
    },
    pace: {
      yourPace: '你的学习进度',
      paceFactor: '进度系数',
      inputLabels: {
        situation: '当前情况',
        yearsOfWork: '工作年限',
        qualification: '学历资格'
      },
      situations: {
        working: '在职',
        studying: '在读',
        graduated: '刚毕业',
        between_jobs: '待业中',
        returning: '重返职场'
      },
      education: {
        secondary: 'SPM 或以下',
        certificate: '证书',
        diploma: '文凭',
        bachelor: '学士学位',
        master: '硕士学位',
        doctorate: '博士学位'
      },
      years: {
        none: '尚无',
        underTwo: '少于 2 年',
        twoToThree: '2 至 3 年',
        fourToFive: '4 至 5 年',
        sixToNine: '6 至 9 年',
        tenOrMore: '10 年或以上'
      },
      notGiven: '未提供',
      notes: {
        faster: '进度快于常见情况：你的经验应能缩短学习时数。这是明确给出的估算。',
        typical: '常见进度。这是明确给出的估算。',
        morePractice: '需要更多练习时间：我们按你的起点延长了学习时数。这是明确给出的估算。'
      },
      mathsFinal: '每个步骤的时数都会乘以该系数，再据此计算完成周数。',
      keptBetween: (min, max, finalLine) =>
        `范围限制在 ${min}x 至 ${max}x。${finalLine} 未知答案按 1.00 计算。这是固定规则，不由 AI 决定。`,
      refresherNote: (hours) => `由于你重返职场，计划加入复习步骤：固定 ${hours} 小时，不受系数影响。`,
      refreshers: {
        refresher: {
          title: '重整工作习惯',
          description: '开始技能步骤前先热身：了解你所在领域如今的情况，并重新建立每周学习习惯。'
        }
      }
    },
    tools: {
      employersName: '雇主提到的工具',
      learnWith: '学习时可用的工具',
      inDemand: (role) => `O*NET 显示，招聘广告中经常要求 ${role} 使用这些软件，以下按字母顺序排列。`,
      oftenNamed: (role) => `O*NET 显示，招聘广告中经常提到 ${role} 使用这些软件。`,
      usAndMalaysia: '美国招聘广告；Kotak 收录的马来西亚招聘广告则显示本地雇主的要求。',
      listLabel: (role) => `${role} 使用的工具`,
      showFewer: '收起',
      showAll: (count) => `显示全部 ${count} 项`
    },
    reasoning: {
      paused: '说明已暂停',
      title: 'Kopi 为什么这样说',
      pausedText: '下方标注日期的来源支持这项固定规则判断，因此判断仍然有效。',
      youNeeded: (you, needed) => `你的水平 ${you} · 需要 ${needed}`,
      pausedFooter: '这项判断由固定规则根据下方来源得出。',
      claudeFooter: 'Kopi 仅依据引用的行与 Claude 撰写说明。判断由固定规则得出。',
      templateFooter: '判断由固定规则得出。此摘要根据引用的输入生成。',
      levels: { None: '无', Basic: '基础', Working: '熟练', Advanced: '高级' },
      twoFutures: '两种 AI 前景的判断不同',
      jobAdSources: '招聘广告来源的判断不同',
      disagree: (cause, slow, fast) => `${cause}：按马来西亚的进度为${slow}；若 AI 使用加快则为${fast}。`,
      skillMark: (status) => `Kopi 对这项技能的判断为${status}。`,
      tooFewPoints: '带日期的数据点太少，暂时无法判断趋势。',
      noCollaborationSplit: '目前没有数据显示 AI 是帮助人们完成这项工作，还是独自完成。',
      noDemand: '目前没有这项技能的招聘需求数据。',
      aiTrend: {
        rising: '正在上升',
        notRising: '没有上升',
        unknown: '尚无趋势数据'
      },
      aiMode: {
        augmentation: '主要帮助人们完成工作',
        automation: '主要由 AI 独立完成',
        unknown: ''
      },
      demand: {
        up: '上升',
        flat: '持平',
        down: '下降',
        unknown: '尚未测量'
      },
      tableReason: (trend, mode, demand) =>
        `这项工作的 AI 使用${trend}${mode ? `，AI ${mode}` : ''}。招聘广告需求${demand}。`
    },
    sdg: {
      names: sdgNamesZh,
      reasons: sdgReasonsZh,
      goal: (goal) => `目标 ${goal}`,
      whyItCounts: '为何计入',
      whyWorkCounts: '这份工作为何有贡献',
      unTarget: (target) => `UN 目标 ${target}`,
      sourceCredit: {
        before: '目标文本来自 ',
        link: 'UN SDG API',
        after: (date) => `，查阅日期：${date}。原因由 Kotak 提供。`
      }
    },
    occupationReasons: occupationReasonsZh
  }
)
