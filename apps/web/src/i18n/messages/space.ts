import type { SpaceJob } from '../../views/space/model'
import { defineText } from '../text'

// Every user-facing string of the 3D space (/app/space) and its table, in English, Bahasa Malaysia and Simplified
// Chinese. The futures' names, verdicts, Ask Kopi and the citation label live in commonText and uiText; job titles and
// source names stay in English, as on every other screen, and skill names come from the content overlays.

type Zone = SpaceJob['zone']

export const spaceText = defineText(
  {
    // SpaceView: the page's states and the table dialog's notes
    heading3D: 'The 3D Space',
    backToDashboard: 'Back to Dashboard',
    /** Kopi's line with no answers yet, after startAgain's speech. */
    thenPlaceJobs:
      ', then I can place every job by how well you fit it. Or have a look around now, with each job placed by how much preparation it needs.',
    lookAround: 'Look Around',
    couldNotOpen: { title: 'Kopi Could Not Open the Space', body: 'Check your connection, then try again.' },
    loadingSpace: 'Loading the space',
    loading3D: 'Loading the 3D space',
    placingJobs: 'Placing every job…',
    placingJobsForAnswers: 'Placing every job for your answers…',
    tableNote: {
      noWebgl: 'This browser can’t draw the 3D view, so the space shows as this table, with the same numbers.',
      failed:
        'The 3D view stopped, so the space shows as this table, with the same numbers. Reload the page to try 3D again.',
      reduced:
        'Reduced motion is on, so the space shows as this table, with the same numbers. Show 3D opens the 3D view.'
    },
    show3D: 'Show 3D',

    // Words the table and the 3D view share
    est: 'est.',
    estimated: 'estimated',
    noEstimate: 'No estimate yet',
    yourJob: 'Your Job',
    related: 'Related',
    pinned: 'Pinned',
    fit: 'Fit',
    fitEst: 'Fit (est.)',
    singapore: 'Singapore',
    mysIndex: 'Malaysia’s AI Usage Index',
    futureShort: { slow: 'Slow', fast: 'Fast' },
    jobs: (n: number) => `${n} ${n === 1 ? 'job' : 'jobs'}`,
    dataOf: (month: string) => `${month} data`,
    anchorDetail: (date: string) => `MYS and SGP · ${date}`,
    /** Ring names and other short lists. */
    list: (items: string[]) => items.join(', '),
    /**
     * Each O*NET Job Zone's preparation, shortened from O*NET's own names ("Job Zone One: Little or No Preparation
     * Needed"), in sentence case. Source: O*NET 30.1 Job Zone Reference,
     * https://www.onetcenter.org/dictionary/30.1/excel/job_zone_reference.html (read 30 October 2026).
     */
    zones: {
      1: 'Little or no preparation',
      2: 'Some preparation',
      3: 'Medium preparation',
      4: 'Considerable preparation',
      5: 'Extensive preparation'
    } as Record<Zone, string>,
    jobZone: (zone: number) => `Job Zone ${zone}`,
    /**
     * SOC 2018 major groups by the first two digits of an O*NET-SOC code, without the trailing "Occupations". Source:
     * U.S. Bureau of Labor Statistics, "2018 Standard Occupational Classification System: Major Groups",
     * https://www.bls.gov/soc/2018/major_groups.htm (read 30 October 2026).
     */
    groups: {
      '11': 'Management',
      '13': 'Business and Financial Operations',
      '15': 'Computer and Mathematical',
      '17': 'Architecture and Engineering',
      '19': 'Life, Physical, and Social Science',
      '21': 'Community and Social Service',
      '23': 'Legal',
      '25': 'Educational Instruction and Library',
      '27': 'Arts, Design, Entertainment, Sports, and Media',
      '29': 'Healthcare Practitioners and Technical',
      '31': 'Healthcare Support',
      '33': 'Protective Service',
      '35': 'Food Preparation and Serving Related',
      '37': 'Building and Grounds Cleaning and Maintenance',
      '39': 'Personal Care and Service',
      '41': 'Sales and Related',
      '43': 'Office and Administrative Support',
      '45': 'Farming, Fishing, and Forestry',
      '47': 'Construction and Extraction',
      '49': 'Installation, Maintenance, and Repair',
      '51': 'Production',
      '53': 'Transportation and Material Moving',
      '55': 'Military Specific'
    } as Record<string, string>,
    /** The ground's ring names, painted on the ground. */
    rings: { fit: (fit: number) => `${fit}% fit` },

    // SpaceTable
    table: {
      title: (count: number, month: string, future: string) => `All ${count} Jobs · ${month} · ${future}`,
      viewTitle: 'Table View',
      region: 'Jobs Table',
      introAnswers:
        'Fit is the share of each job’s needed levels your answers already meet; for every other job it is estimated from your answers. AI use, 12-month change, is the median of a job’s skills’ projected change in AI use: an AI-usage signal, not job demand. Both are estimates, for the month and AI future the title names, as the space shows them. Open a job to see both futures and each skill.',
      introLookAround:
        'With no answers yet, there is no fit, so each job shows its O*NET Job Zone: how much preparation it needs. AI use, 12-month change, is the median of a job’s skills’ projected change in AI use: an AI-usage signal, not job demand. It is an estimate, for the month and AI future the title names, as the space shows them. Open a job to see both futures and each skill.',
      fastNote: 'Fast AI Uptake moves Malaysia halfway to Singapore, from the same release, so it is an estimate.',
      fitBetween: 'Fit Between the Two Futures',
      fitSame: 'Fit is the same in both futures for every job.',
      fitChanged: (count: number, max: number) =>
        `Fit changed for ${count} ${count === 1 ? 'job' : 'jobs'}, by at most ${max} ${max === 1 ? 'point' : 'points'}.`,
      wholePercents: 'Whole percents, as the table shows them.',
      onetJobZone: 'O*NET Job Zone',
      /** The text around the scale's two numbers, 1 and 5: before the 1, between them, and after the 5. */
      zoneScale: (low: string, high: string): [string, string, string] => ['From ', `, ${low}, to `, `, ${high}.`],
      zoneMeaning:
        'The education, training and experience a job needs, as O*NET rates it for US workers. It is the same in both futures and both months.',
      byFit: (future: string) => `· best fit first, ${future}`,
      byZone: '· by Job Zone, then title',
      verdicts: 'Verdicts',
      captionFit: (first: number, last: number, total: number, future: string, month: string) =>
        `Jobs ${first} to ${last} of ${total}: each job’s fit, AI use, 12-month change, and skill verdicts in ${future}, for ${month} data, best fit first.`,
      captionZone: (first: number, last: number, total: number, future: string, month: string) =>
        `Jobs ${first} to ${last} of ${total}: each job’s O*NET Job Zone, AI use, 12-month change, and skill verdicts in ${future}, for ${month} data, by Job Zone, then title.`,
      job: 'Job',
      group: 'Group',
      jobZone: 'Job Zone',
      change: ['AI Use,', '12-Month Change'],
      skillVerdicts: 'Skill Verdicts',
      pages: 'Jobs Table Pages',
      previous: 'Previous',
      previousPage: 'Previous Page',
      next: 'Next',
      nextPage: 'Next Page',
      pageStatus: (page: number, pages: number, first: number, last: number, total: number) =>
        `Page ${page} of ${pages} · rows ${first}–${last} of ${total}`,
      opened: (page: number, pages: number, title: string) => `Page ${page} of ${pages}, showing ${title}`,
      detailsOf: (title: string) => `Both futures and skills of ${title}`,
      futuresCaption: (title: string) => `${title} in both AI futures`,
      bothFutures: 'Both Futures',
      medianChange: 'AI use, 12-month change, median skill',
      skillsCaption: (title: string) => `Skills of ${title}`,
      skill: 'Skill',
      skillChange: 'AI Use, 12-Month Change',
      verdict: 'Verdict',
      aiUseData: 'AI-Use Data',
      borrowed: 'Borrowed from a broader row',
      notBorrowed: 'Not borrowed'
    },

    // The HUD over the 3D view
    hud: {
      titlePrefix: 'The 3D Space: ',
      worldLine: {
        slow: 'Malaysia keeps today’s AI pace.',
        fast: 'Malaysia’s AI usage index moves halfway to Singapore’s.'
      },
      monthKnown: 'Two dated points: a trend for every skill.',
      monthUnknown: 'Unknown: one dated point per skill, so Kotak won’t guess.',
      howToRead: 'How to Read',
      showTable: 'Show the Table',
      hintPointer: 'Drag to look around · R resets',
      hintTouch: 'Drag to look around · double-tap a job',
      jobs: 'Jobs',
      fitFor: (title: string) => `Fit, ${title}`,
      pinYours: (fit: string, title: string) => `${fit} fit, ${title}: Pin Your Card`,
      fitChanged: 'Fit Changed, Slow to Fast',
      atMost: (max: number) => `· at most ${max}\u00A0pts`,
      distance: 'Distance',
      zoneRange: 'Job Zone 1 to 5',
      scenario: 'AI Uptake Scenario',
      data: 'Data',
      dataMonth: 'Data Month',
      closeSources: 'Close Sources',
      /** Look Around's note, before and after its citation. */
      lookAroundNote: [
        'Distance shows the preparation each job needs, its O*NET Job Zone',
        '. Take the check-up to place every job by your fit.'
      ] as [string, string],
      announceSlow: (name: string) => `${name} · Malaysia keeps today’s AI pace`,
      announceFast: (name: string) => `${name} · Malaysia halfway to Singapore’s AI usage index`,
      announceMonth: (month: string, note: string) => `${month} · ${note}`,
      sameNumbers: 'The same numbers are in the table: press D. How to Read, H, explains every mark in the space.',
      pictureAnswers: (count: number, rings: string) =>
        `The 3D space: ${count} jobs as tufts of grass around your box, one blade per skill, each blade as tall as its skill’s AI use, 12-month change (est.); rings on the ground, labelled ${rings}, mark each job’s fit; the ring in the sky stands at Malaysia’s AI usage index.`,
      pictureLookAround: (count: number) =>
        `The 3D space: ${count} jobs as tufts of grass around the box, one blade per skill, each blade as tall as its skill’s AI use, 12-month change (est.); rings on the ground, labelled Job Zone 1 to 5, mark the preparation each job needs; the ring in the sky stands at Malaysia’s AI usage index.`,
      jobInHand: (title: string, group: string) => `${title}, ${group}`,
      rulerSr: (month: string, mys: string, fast: string, sgp: string, shown: string) =>
        `, ${month}: Malaysia ${mys} in Slow AI Uptake and ${fast} in Fast AI Uptake, halfway to Singapore’s ${sgp}. ${shown} is on show.`
    },

    // A job's card
    card: {
      label: (title: string) => `${title}, job card`,
      openJobPage: 'Open the Job Page',
      openJobPageSr: ': Open the Job Page',
      kindSr: (kind: 'yours' | 'related' | 'other', group: string) =>
        `, ${kind === 'yours' ? 'your job, ' : kind === 'related' ? 'related, ' : ''}${group}`,
      captionFit: 'Fit and AI-use change in both AI futures',
      captionChange: 'AI-use change in both AI futures',
      measure: 'Measure',
      zoneValue: (zone: number, label: string) => `${zone}: ${label}`,
      zoneLine: (zone: number, label: string) => `Job Zone ${zone}: ${label}`,
      change: 'AI use, 12-month change (est.)',
      medianSkill: 'median skill',
      verdicts: (future: string) => `Skill verdicts, ${future}:`,
      borrowed: (count: number, total: number) => `AI-use data borrowed for ${count} of ${total} skills`,
      fitPair: 'Fit, Slow/Fast',
      aiUse: '· AI use',
      aiUsePair: '· AI use, Slow/Fast',
      fitSr: (slow: string, fast: string, estimated: boolean) =>
        `Fit${estimated ? ' (est.)' : ''}: ${slow} in Slow AI Uptake, ${fast} in Fast. `,
      noEstimateSr: (text: string) => `Fit: ${text}. `,
      zoneSr: (zone: number, label: string) => `Job Zone ${zone}: ${label}. `,
      changeSr: (slow: string, fast: string) =>
        `AI use, 12-month change (est.), median skill: ${slow} in Slow AI Uptake, ${fast} in Fast.`,
      close: 'Close Card',
      unpin: 'Unpin Your Card'
    },

    // How to Read: each item's bold lead, then the rest, which carries its own leading space or punctuation
    howTo: {
      title: 'How to Read the Space',
      tuft: {
        lead: 'Each tuft is one job',
        rest: (count: number) => `, ${count} in all, and each blade is one of its skills.`
      },
      distance: 'Distance from the box',
      distanceFit: (rings: string) =>
        ` is 100 minus your fit: the nearer a job, the more of its needed levels your answers already meet. The rings mark ${rings}. Hollow tufts at the far edge are jobs no answer reaches, so they have no estimate yet.`,
      distanceZone: (low: string, high: string) =>
        ` is the job’s O*NET Job Zone, 1 to 5: how much preparation it needs, from Job Zone 1 (${low}), nearest, to Job Zone 5 (${high}), farthest. Each zone is a band with a ring at its inner edge. There are no answers yet; take the check-up and distance becomes your fit instead.`,
      angle: 'The angle',
      angleRest: (answers: boolean) =>
        ` is the job’s SOC major group. ${
          answers
            ? 'Within a group, jobs sit in alphabetical order.'
            : 'Within a group and a zone, jobs sit in alphabetical order in columns, from left to right, each column running from the box outward.'
        } It means only the group.`,
      blade: 'A blade’s height',
      bladeRest:
        ' is that skill’s AI use, 12-month change (est.). The base height is no change. Rising AI use climbs on a log scale: each doubling adds the same height. Falling use shrinks in a straight line, from the base height at 0% to a short stub at −100%.',
      colour: 'Colour:',
      colourRest: (answers: boolean) =>
        ` ${
          answers
            ? 'yellow is your job, blue the related roles Kotak ranks against it, warm light every other job.'
            : 'every job is warm light, since there is no job of yours yet.'
        } Grey blades are Unknown: one dated point, so Kotak won’t guess.`,
      ring: 'The ring',
      ringRest:
        ' stands at Malaysia’s AI usage index. In Fast AI Uptake it rises halfway to Singapore’s. The ruler reads the same index in numbers, Singapore’s too.',
      atmosphere: 'Atmosphere:',
      atmosphereRest: ' the sky, haze, glow, dust and the ground’s shimmer are not data.',
      moving: 'Moving Around',
      drag: 'Drag (one finger on touch) to look around the field; the horizon stays ahead.',
      zoom: 'Scroll or pinch to zoom.',
      pan: 'Right-drag, Shift-drag or a two-finger drag pans along the ground.',
      doubleClick: 'Double-click or double-tap a tuft to fly to it and pin its card.',
      reset: ' flies back to the opening view and lets the camera drift again; any other key below holds it still.',
      keys: 'Keys',
      keyFuture: 'The AI future: flip, Slow, Fast',
      keyMonth: 'The data month',
      keyArrows: 'Step through the jobs across the fan',
      keyTable: 'The table, with the same numbers',
      keyGuide: 'This guide',
      keyEscape: 'Close a card or the sources'
    }
  },
  {
    heading3D: 'Ruang 3D',
    backToDashboard: 'Kembali ke Papan Pemuka',
    thenPlaceJobs:
      ', kemudian saya boleh meletakkan setiap pekerjaan mengikut sejauh mana anda sepadan dengannya. Atau lihat sekeliling sekarang, dengan setiap pekerjaan diletakkan mengikut persediaan yang diperlukannya.',
    lookAround: 'Lihat Sekeliling',
    couldNotOpen: { title: 'Kopi Tidak Dapat Membuka Ruang Ini', body: 'Semak sambungan anda, kemudian cuba lagi.' },
    loadingSpace: 'Memuatkan ruang',
    loading3D: 'Memuatkan ruang 3D',
    placingJobs: 'Meletakkan setiap pekerjaan…',
    placingJobsForAnswers: 'Meletakkan setiap pekerjaan mengikut jawapan anda…',
    tableNote: {
      noWebgl:
        'Pelayar ini tidak dapat melukis paparan 3D, jadi ruang ini dipaparkan sebagai jadual ini, dengan nombor yang sama.',
      failed:
        'Paparan 3D terhenti, jadi ruang ini dipaparkan sebagai jadual ini, dengan nombor yang sama. Muat semula halaman untuk mencuba 3D sekali lagi.',
      reduced:
        'Pergerakan dikurangkan sedang aktif, jadi ruang ini dipaparkan sebagai jadual ini, dengan nombor yang sama. Papar 3D membuka paparan 3D.'
    },
    show3D: 'Papar 3D',

    est: 'anggaran',
    estimated: 'dianggarkan',
    noEstimate: 'Belum ada anggaran',
    yourJob: 'Pekerjaan Anda',
    related: 'Berkaitan',
    pinned: 'Disematkan',
    fit: 'Padanan',
    fitEst: 'Padanan (anggaran)',
    singapore: 'Singapura',
    mysIndex: 'Indeks Penggunaan AI Malaysia',
    futureShort: { slow: 'Perlahan', fast: 'Pantas' },
    jobs: (n) => `${n} pekerjaan`,
    dataOf: (month) => `Data ${month}`,
    anchorDetail: (date) => `MYS dan SGP · ${date}`,
    list: (items) => items.join(', '),
    zones: {
      1: 'Hampir tiada persediaan',
      2: 'Sedikit persediaan',
      3: 'Persediaan sederhana',
      4: 'Banyak persediaan',
      5: 'Persediaan yang meluas'
    },
    jobZone: (zone) => `Zon Pekerjaan ${zone}`,
    groups: {
      '11': 'Pengurusan',
      '13': 'Operasi Perniagaan dan Kewangan',
      '15': 'Komputer dan Matematik',
      '17': 'Seni Bina dan Kejuruteraan',
      '19': 'Sains Hayat, Fizikal dan Sosial',
      '21': 'Perkhidmatan Komuniti dan Sosial',
      '23': 'Undang-undang',
      '25': 'Pendidikan dan Perpustakaan',
      '27': 'Seni, Reka Bentuk, Hiburan, Sukan dan Media',
      '29': 'Pengamal Penjagaan Kesihatan dan Teknikal',
      '31': 'Sokongan Penjagaan Kesihatan',
      '33': 'Perkhidmatan Perlindungan',
      '35': 'Penyediaan dan Penyajian Makanan',
      '37': 'Pembersihan dan Penyelenggaraan Bangunan dan Kawasan',
      '39': 'Penjagaan dan Perkhidmatan Peribadi',
      '41': 'Jualan dan Berkaitan',
      '43': 'Sokongan Pejabat dan Pentadbiran',
      '45': 'Pertanian, Perikanan dan Perhutanan',
      '47': 'Pembinaan dan Pengekstrakan',
      '49': 'Pemasangan, Penyelenggaraan dan Pembaikan',
      '51': 'Pengeluaran',
      '53': 'Pengangkutan dan Pemindahan Bahan',
      '55': 'Khusus Ketenteraan'
    },
    rings: { fit: (fit) => `Padanan ${fit}%` },

    table: {
      title: (count, month, future) => `Semua ${count} Pekerjaan · ${month} · ${future}`,
      viewTitle: 'Paparan Jadual',
      region: 'Jadual Pekerjaan',
      introAnswers:
        'Padanan ialah bahagian tahap yang diperlukan bagi setiap pekerjaan yang sudah dicapai oleh jawapan anda; bagi setiap pekerjaan lain, ia dianggarkan daripada jawapan anda. Penggunaan AI, perubahan 12 bulan, ialah median unjuran perubahan penggunaan AI bagi kemahiran sesuatu pekerjaan: isyarat penggunaan AI, bukan permintaan pekerjaan. Kedua-duanya anggaran, bagi bulan dan masa depan AI yang dinamakan dalam tajuk, seperti yang dipaparkan dalam ruang ini. Buka sesuatu pekerjaan untuk melihat kedua-dua masa depan dan setiap kemahiran.',
      introLookAround:
        'Belum ada jawapan, jadi belum ada padanan: setiap pekerjaan menunjukkan Zon Pekerjaan O*NET, iaitu berapa banyak persediaan yang diperlukannya. Penggunaan AI, perubahan 12 bulan, ialah median unjuran perubahan penggunaan AI bagi kemahiran sesuatu pekerjaan: isyarat penggunaan AI, bukan permintaan pekerjaan. Ia anggaran, bagi bulan dan masa depan AI yang dinamakan dalam tajuk, seperti yang dipaparkan dalam ruang ini. Buka sesuatu pekerjaan untuk melihat kedua-dua masa depan dan setiap kemahiran.',
      fastNote:
        'Guna AI Pantas menggerakkan Malaysia separuh jalan ke Singapura, daripada keluaran yang sama, jadi ia anggaran.',
      fitBetween: 'Padanan Antara Dua Masa Depan',
      fitSame: 'Padanan setiap pekerjaan sama dalam kedua-dua masa depan.',
      fitChanged: (count, max) => `Padanan berubah bagi ${count} pekerjaan, paling banyak ${max} mata.`,
      wholePercents: 'Dalam peratus bulat, seperti yang ditunjukkan dalam jadual.',
      onetJobZone: 'Zon Pekerjaan O*NET',
      zoneScale: (low, high) => ['Dari ', `, ${low}, hingga `, `, ${high}.`],
      zoneMeaning:
        'Pendidikan, latihan dan pengalaman yang diperlukan sesuatu pekerjaan, seperti yang dinilai O*NET bagi pekerja AS. Ia sama dalam kedua-dua masa depan dan kedua-dua bulan.',
      byFit: (future) => `· padanan terbaik dahulu, ${future}`,
      byZone: '· mengikut Zon Pekerjaan, kemudian tajuk',
      verdicts: 'Verdik',
      captionFit: (first, last, total, future, month) =>
        `Pekerjaan ${first} hingga ${last} daripada ${total}: padanan, penggunaan AI, perubahan 12 bulan dan verdik kemahiran setiap pekerjaan dalam ${future}, bagi data ${month}, padanan terbaik dahulu.`,
      captionZone: (first, last, total, future, month) =>
        `Pekerjaan ${first} hingga ${last} daripada ${total}: Zon Pekerjaan O*NET, penggunaan AI, perubahan 12 bulan dan verdik kemahiran setiap pekerjaan dalam ${future}, bagi data ${month}, mengikut Zon Pekerjaan, kemudian tajuk.`,
      job: 'Pekerjaan',
      group: 'Kumpulan',
      jobZone: 'Zon Pekerjaan',
      change: ['Penggunaan AI,', 'Perubahan 12 Bulan'],
      skillVerdicts: 'Verdik Kemahiran',
      pages: 'Halaman Jadual Pekerjaan',
      previous: 'Sebelumnya',
      previousPage: 'Halaman Sebelumnya',
      next: 'Seterusnya',
      nextPage: 'Halaman Seterusnya',
      pageStatus: (page, pages, first, last, total) =>
        `Halaman ${page} daripada ${pages} · baris ${first}–${last} daripada ${total}`,
      opened: (page, pages, title) => `Halaman ${page} daripada ${pages}, menunjukkan ${title}`,
      detailsOf: (title) => `Kedua-dua masa depan dan kemahiran ${title}`,
      futuresCaption: (title) => `${title} dalam kedua-dua masa depan AI`,
      bothFutures: 'Kedua-dua Masa Depan',
      medianChange: 'Penggunaan AI, perubahan 12 bulan, kemahiran median',
      skillsCaption: (title) => `Kemahiran ${title}`,
      skill: 'Kemahiran',
      skillChange: 'Penggunaan AI, Perubahan 12 Bulan',
      verdict: 'Verdik',
      aiUseData: 'Data Penggunaan AI',
      borrowed: 'Dipinjam daripada baris yang lebih luas',
      notBorrowed: 'Tidak dipinjam'
    },

    hud: {
      titlePrefix: 'Ruang 3D: ',
      worldLine: {
        slow: 'Malaysia mengekalkan kadar AI hari ini.',
        fast: 'Indeks penggunaan AI Malaysia separuh jalan ke Singapura.'
      },
      monthKnown: 'Dua titik bertarikh: ada trend bagi setiap kemahiran.',
      monthUnknown: 'Belum Diketahui: satu titik bertarikh bagi setiap kemahiran, jadi Kotak tidak akan meneka.',
      howToRead: 'Cara Membaca',
      showTable: 'Papar Jadual',
      hintPointer: 'Seret untuk melihat sekeliling · R set semula',
      hintTouch: 'Seret untuk melihat sekeliling · ketik dua kali pada pekerjaan',
      jobs: 'Pekerjaan',
      fitFor: (title) => `Padanan, ${title}`,
      pinYours: (fit, title) => `Padanan ${fit}, ${title}: Sematkan Kad Anda`,
      fitChanged: 'Padanan Berubah, Perlahan ke Pantas',
      atMost: (max) => `· paling banyak ${max}\u00A0mata`,
      distance: 'Jarak',
      zoneRange: 'Zon Pekerjaan 1 hingga 5',
      scenario: 'Senario Penggunaan AI',
      data: 'Data',
      dataMonth: 'Bulan Data',
      closeSources: 'Tutup Sumber',
      lookAroundNote: [
        'Jarak menunjukkan persediaan yang diperlukan, iaitu Zon Pekerjaan O*NET',
        '. Ambil semakan untuk menyusun pekerjaan mengikut padanan anda.'
      ],
      announceSlow: (name) => `${name} · Malaysia mengekalkan kadar AI hari ini`,
      announceFast: (name) => `${name} · Malaysia separuh jalan ke indeks penggunaan AI Singapura`,
      announceMonth: (month, note) => `${month} · ${note}`,
      sameNumbers:
        'Nombor yang sama ada dalam jadual: tekan D. Cara Membaca, H, menerangkan setiap tanda dalam ruang ini.',
      pictureAnswers: (count, rings) =>
        `Ruang 3D: ${count} pekerjaan sebagai rumpun rumput di sekeliling kotak anda, satu helai bagi setiap kemahiran, setiap helai setinggi penggunaan AI kemahirannya, perubahan 12 bulan (anggaran); gelang di tanah, berlabel ${rings}, menandakan padanan setiap pekerjaan; gelang di langit berada pada indeks penggunaan AI Malaysia.`,
      pictureLookAround: (count) =>
        `Ruang 3D: ${count} pekerjaan sebagai rumpun rumput di sekeliling kotak, satu helai bagi setiap kemahiran, setiap helai setinggi penggunaan AI kemahirannya, perubahan 12 bulan (anggaran); gelang di tanah, berlabel Zon Pekerjaan 1 hingga 5, menandakan persediaan yang diperlukan setiap pekerjaan; gelang di langit berada pada indeks penggunaan AI Malaysia.`,
      jobInHand: (title, group) => `${title}, ${group}`,
      rulerSr: (month, mys, fast, sgp, shown) =>
        `, ${month}: Malaysia ${mys} dalam Guna AI Perlahan dan ${fast} dalam Guna AI Pantas, separuh jalan ke ${sgp} bagi Singapura. ${shown} sedang dipaparkan.`
    },

    card: {
      label: (title) => `${title}, kad pekerjaan`,
      openJobPage: 'Buka Halaman Pekerjaan',
      openJobPageSr: ': Buka Halaman Pekerjaan',
      kindSr: (kind, group) =>
        `, ${kind === 'yours' ? 'pekerjaan anda, ' : kind === 'related' ? 'berkaitan, ' : ''}${group}`,
      captionFit: 'Padanan dan perubahan penggunaan AI dalam kedua-dua masa depan AI',
      captionChange: 'Perubahan penggunaan AI dalam kedua-dua masa depan AI',
      measure: 'Ukuran',
      zoneValue: (zone, label) => `${zone}: ${label}`,
      zoneLine: (zone, label) => `Zon Pekerjaan ${zone}: ${label}`,
      change: 'Penggunaan AI, perubahan 12 bulan (anggaran)',
      medianSkill: 'median',
      verdicts: (future) => `Verdik kemahiran, ${future}:`,
      borrowed: (count, total) => `Data penggunaan AI dipinjam bagi ${count} daripada ${total} kemahiran`,
      fitPair: 'Padanan, Perlahan/Pantas',
      aiUse: '· Penggunaan AI',
      aiUsePair: '· Penggunaan AI, Perlahan/Pantas',
      fitSr: (slow, fast, estimated) =>
        `Padanan${estimated ? ' (anggaran)' : ''}: ${slow} dalam Guna AI Perlahan, ${fast} dalam Guna AI Pantas. `,
      noEstimateSr: (text) => `Padanan: ${text}. `,
      zoneSr: (zone, label) => `Zon Pekerjaan ${zone}: ${label}. `,
      changeSr: (slow, fast) =>
        `Penggunaan AI, perubahan 12 bulan (anggaran), kemahiran median: ${slow} dalam Guna AI Perlahan, ${fast} dalam Guna AI Pantas.`,
      close: 'Tutup Kad',
      unpin: 'Nyahsemat Kad Anda'
    },

    howTo: {
      title: 'Cara Membaca Ruang Ini',
      tuft: {
        lead: 'Setiap rumpun ialah satu pekerjaan',
        rest: (count) => `, ${count} semuanya, dan setiap helai ialah salah satu kemahirannya.`
      },
      distance: 'Jarak dari kotak',
      distanceFit: (rings) =>
        ` ialah 100 tolak padanan anda: semakin dekat sesuatu pekerjaan, semakin banyak tahap yang diperlukannya sudah dicapai oleh jawapan anda. Gelang menandakan ${rings}. Rumpun berongga di pinggir jauh ialah pekerjaan yang tidak dicapai oleh mana-mana jawapan, jadi belum ada anggaran.`,
      distanceZone: (low, high) =>
        ` ialah Zon Pekerjaan O*NET bagi pekerjaan itu, 1 hingga 5: berapa banyak persediaan yang diperlukannya, dari Zon Pekerjaan 1 (${low}), paling dekat, hingga Zon Pekerjaan 5 (${high}), paling jauh. Setiap zon ialah satu jalur dengan gelang di pinggir dalamnya. Belum ada jawapan; ambil semakan dan jarak akan menjadi padanan anda.`,
      angle: 'Sudut',
      angleRest: (answers) =>
        ` ialah kumpulan utama SOC bagi pekerjaan itu. ${
          answers
            ? 'Dalam satu kumpulan, pekerjaan disusun mengikut abjad.'
            : 'Dalam satu kumpulan dan satu zon, pekerjaan disusun mengikut abjad dalam lajur, dari kiri ke kanan, setiap lajur bermula dari kotak ke luar.'
        } Ia hanya menunjukkan kumpulan.`,
      blade: 'Ketinggian helai',
      bladeRest:
        ' ialah penggunaan AI kemahiran itu, perubahan 12 bulan (anggaran). Ketinggian asas bermaksud tiada perubahan. Penggunaan AI yang meningkat naik pada skala log: setiap kali ia berganda, ketinggian bertambah sama banyak. Penggunaan yang menurun memendek secara lurus, dari ketinggian asas pada 0% hingga tunggul pendek pada −100%.',
      colour: 'Warna:',
      colourRest: (answers) =>
        ` ${
          answers
            ? 'kuning ialah pekerjaan anda, biru ialah peranan berkaitan yang Kotak bandingkan dengannya, cahaya hangat ialah setiap pekerjaan lain.'
            : 'setiap pekerjaan bercahaya hangat, kerana belum ada pekerjaan anda.'
        } Helai kelabu ialah Belum Diketahui: satu titik bertarikh, jadi Kotak tidak akan meneka.`,
      ring: 'Gelang di langit',
      ringRest:
        ' berada pada indeks penggunaan AI Malaysia. Dalam Guna AI Pantas, ia naik separuh jalan ke indeks Singapura. Pembaris menunjukkan indeks yang sama dalam angka, termasuk indeks Singapura.',
      atmosphere: 'Suasana:',
      atmosphereRest: ' langit, jerebu, cahaya, debu dan kilauan tanah bukan data.',
      moving: 'Bergerak di Sekeliling',
      drag: 'Seret (satu jari pada skrin sentuh) untuk melihat sekeliling padang; ufuk kekal di hadapan.',
      zoom: 'Tatal atau cubit untuk zum.',
      pan: 'Seret dengan butang kanan, seret sambil menekan Shift atau seret dengan dua jari untuk beralih di sepanjang tanah.',
      doubleClick: 'Klik dua kali atau ketik dua kali pada rumpun untuk terbang ke sana dan menyematkan kadnya.',
      reset:
        ' membawa kamera kembali ke pandangan awal dan membiarkannya hanyut semula; kekunci lain di bawah menahannya tetap.',
      keys: 'Kekunci',
      keyFuture: 'Masa depan AI: tukar, Perlahan, Pantas',
      keyMonth: 'Bulan data',
      keyArrows: 'Melangkah melalui pekerjaan merentasi kipas',
      keyTable: 'Jadual, dengan nombor yang sama',
      keyGuide: 'Panduan ini',
      keyEscape: 'Tutup kad atau sumber'
    }
  },
  {
    heading3D: '3D 空间',
    backToDashboard: '返回仪表板',
    thenPlaceJobs: '，然后我就能按你的匹配度摆放每份工作。也可以现在就四处看看，每份工作会按所需的准备程度摆放。',
    lookAround: '四处看看',
    couldNotOpen: { title: 'Kopi 无法打开空间', body: '请检查网络连接，然后重试。' },
    loadingSpace: '正在加载空间',
    loading3D: '正在加载 3D 空间',
    placingJobs: '正在摆放每份工作…',
    placingJobsForAnswers: '正在按你的回答摆放每份工作…',
    tableNote: {
      noWebgl: '此浏览器无法绘制 3D 视图，所以空间以此表格显示，数字相同。',
      failed: '3D 视图已停止，所以空间以此表格显示，数字相同。重新加载页面即可再次尝试 3D。',
      reduced: '已开启减少动态效果，所以空间以此表格显示，数字相同。点击“显示 3D”可打开 3D 视图。'
    },
    show3D: '显示 3D',

    est: '估算',
    estimated: '估算值',
    noEstimate: '暂无估算',
    yourJob: '你目前的工作',
    related: '相关',
    pinned: '已固定',
    fit: '匹配度',
    fitEst: '匹配度（估算）',
    singapore: '新加坡',
    mysIndex: '马来西亚的 AI 使用指数',
    futureShort: { slow: '较慢', fast: '较快' },
    jobs: (n) => `${n} 份工作`,
    dataOf: (month) => `${month} 数据`,
    anchorDetail: (date) => `MYS 和 SGP · ${date}`,
    list: (items) => items.join('、'),
    zones: {
      1: '几乎无需准备',
      2: '需要一些准备',
      3: '需要中等准备',
      4: '需要较多准备',
      5: '需要大量准备'
    },
    jobZone: (zone) => `准备等级 ${zone}`,
    groups: {
      '11': '管理',
      '13': '商业与金融运营',
      '15': '计算机与数学',
      '17': '建筑设计与工程',
      '19': '生命科学、物理科学与社会科学',
      '21': '社区与社会服务',
      '23': '法律',
      '25': '教育教学与图书馆',
      '27': '艺术、设计、娱乐、体育与媒体',
      '29': '医疗从业人员与技术',
      '31': '医疗辅助',
      '33': '保护服务',
      '35': '食品准备与餐饮服务',
      '37': '楼宇与场地清洁维护',
      '39': '个人护理与服务',
      '41': '销售及相关',
      '43': '办公室与行政支持',
      '45': '农业、渔业与林业',
      '47': '施工与采掘',
      '49': '安装、维护与维修',
      '51': '生产',
      '53': '运输与物料搬运',
      '55': '军事专业'
    },
    rings: { fit: (fit) => `匹配度 ${fit}%` },

    table: {
      title: (count, month, future) => `全部 ${count} 份工作 · ${month} · ${future}`,
      viewTitle: '表格视图',
      region: '工作表格',
      introAnswers:
        '匹配度是你的回答已达到的、每份工作所需水平的比例；你的工作之外的其他工作，匹配度根据你的回答估算。AI 使用 12 个月变化，是一份工作各项技能预测 AI 使用变化的中位数：这是 AI 使用信号，而不是职位需求。两者都是估算，对应标题所示的月份和 AI 前景，与空间中显示的一致。展开一份工作，即可查看两种前景和每项技能。',
      introLookAround:
        '你还没有回答，所以没有匹配度，每份工作显示它的 O*NET 准备等级：需要多少准备。AI 使用 12 个月变化，是一份工作各项技能预测 AI 使用变化的中位数：这是 AI 使用信号，而不是职位需求。它是估算，对应标题所示的月份和 AI 前景，与空间中显示的一致。展开一份工作，即可查看两种前景和每项技能。',
      fastNote: 'AI 采用较快时，马来西亚向新加坡靠拢一半，数据来自同一版本，因此属于估算。',
      fitBetween: '两种前景之间的匹配度',
      fitSame: '每份工作在两种前景下的匹配度都相同。',
      fitChanged: (count, max) => `${count} 份工作的匹配度有变化，最多相差 ${max} 个百分点。`,
      wholePercents: '按整数百分比计算，与表格显示一致。',
      onetJobZone: 'O*NET 准备等级',
      zoneScale: (low, high) => ['从 ', `（${low}）到 `, `（${high}）。`],
      zoneMeaning: '一份工作所需的教育、培训和经验，依据 O*NET 对美国从业者的评级。在两种前景和两个月份中都相同。',
      byFit: (future) => `· 匹配度从高到低，${future}`,
      byZone: '· 按准备等级，再按职位名称',
      verdicts: '结论',
      captionFit: (first, last, total, future, month) =>
        `第 ${first} 至 ${last} 份工作，共 ${total} 份：每份工作在“${future}”下的匹配度、AI 使用 12 个月变化和技能结论，${month} 数据，按匹配度从高到低排列。`,
      captionZone: (first, last, total, future, month) =>
        `第 ${first} 至 ${last} 份工作，共 ${total} 份：每份工作在“${future}”下的 O*NET 准备等级、AI 使用 12 个月变化和技能结论，${month} 数据，按准备等级、再按职位名称排列。`,
      job: '工作',
      group: '类别',
      jobZone: '准备等级',
      change: ['AI 使用，', '12 个月变化'],
      skillVerdicts: '技能结论',
      pages: '工作表格分页',
      previous: '上一页',
      previousPage: '上一页',
      next: '下一页',
      nextPage: '下一页',
      pageStatus: (page, pages, first, last, total) =>
        `第 ${page} 页，共 ${pages} 页 · 第 ${first}–${last} 行，共 ${total} 行`,
      opened: (page, pages, title) => `第 ${page} 页，共 ${pages} 页，显示 ${title}`,
      detailsOf: (title) => `${title} 的两种前景和技能`,
      futuresCaption: (title) => `${title} 在两种 AI 前景下`,
      bothFutures: '两种前景',
      medianChange: 'AI 使用，12 个月变化，技能中位数',
      skillsCaption: (title) => `${title} 的技能`,
      skill: '技能',
      skillChange: 'AI 使用，12 个月变化',
      verdict: '结论',
      aiUseData: 'AI 使用数据',
      borrowed: '借用自更宽泛的数据行',
      notBorrowed: '未借用'
    },

    hud: {
      titlePrefix: '3D 空间：',
      worldLine: { slow: '马来西亚保持目前的 AI 步伐。', fast: '马来西亚的 AI 使用指数向新加坡靠拢一半。' },
      monthKnown: '两个有日期的数据点：每项技能都有趋势。',
      monthUnknown: '未知：每项技能只有一个有日期的数据点，所以 Kotak 不做猜测。',
      howToRead: '阅读指南',
      showTable: '显示表格',
      hintPointer: '拖动以四处查看 · 按 R 复位',
      hintTouch: '拖动以四处查看 · 双击一份工作',
      jobs: '工作',
      fitFor: (title) => `匹配度，${title}`,
      pinYours: (fit, title) => `匹配度 ${fit}，${title}：固定你的卡片`,
      fitChanged: '匹配度变化，较慢到较快',
      atMost: (max) => `· 最多 ${max}\u00A0个百分点`,
      distance: '距离',
      zoneRange: '准备等级 1 至 5',
      scenario: 'AI 采用情景',
      data: '数据',
      dataMonth: '数据月份',
      closeSources: '关闭来源',
      lookAroundNote: ['距离表示每份工作所需的准备，即 O*NET 准备等级', '。完成检测，即可按你的匹配度摆放每份工作。'],
      announceSlow: (name) => `${name} · 马来西亚保持目前的 AI 步伐`,
      announceFast: (name) => `${name} · 马来西亚向新加坡的 AI 使用指数靠拢一半`,
      announceMonth: (month, note) => `${month} · ${note}`,
      sameNumbers: '表格里有相同的数字：按 D。阅读指南（H）解释空间里的每个标记。',
      pictureAnswers: (count, rings) =>
        `3D 空间：${count} 份工作化作你的盒子周围的一丛丛草，每片叶子代表一项技能，叶子高度等于该技能的 AI 使用 12 个月变化（估算）；地面上标为${rings}的圆环表示每份工作的匹配度；天空中的光环位于马来西亚的 AI 使用指数。`,
      pictureLookAround: (count) =>
        `3D 空间：${count} 份工作化作盒子周围的一丛丛草，每片叶子代表一项技能，叶子高度等于该技能的 AI 使用 12 个月变化（估算）；地面上标为准备等级 1 至 5 的圆环表示每份工作所需的准备；天空中的光环位于马来西亚的 AI 使用指数。`,
      jobInHand: (title, group) => `${title}，${group}`,
      rulerSr: (month, mys, fast, sgp, shown) =>
        `，${month}：马来西亚在 AI 采用较慢时为 ${mys}，在 AI 采用较快时为 ${fast}，向新加坡的 ${sgp} 靠拢一半。当前显示${shown}。`
    },

    card: {
      label: (title) => `${title}，工作卡片`,
      openJobPage: '打开工作页面',
      openJobPageSr: '：打开工作页面',
      kindSr: (kind, group) => `，${kind === 'yours' ? '你目前的工作，' : kind === 'related' ? '相关，' : ''}${group}`,
      captionFit: '两种 AI 前景下的匹配度和 AI 使用变化',
      captionChange: '两种 AI 前景下的 AI 使用变化',
      measure: '指标',
      zoneValue: (zone, label) => `${zone}：${label}`,
      zoneLine: (zone, label) => `准备等级 ${zone}：${label}`,
      change: 'AI 使用，12 个月变化（估算）',
      medianSkill: '技能中位数',
      verdicts: (future) => `技能结论，${future}：`,
      borrowed: (count, total) => `${total} 项技能中有 ${count} 项的 AI 使用数据为借用`,
      fitPair: '匹配度，较慢/较快',
      aiUse: '· AI 使用',
      aiUsePair: '· AI 使用，较慢/较快',
      fitSr: (slow, fast, estimated) =>
        `匹配度${estimated ? '（估算）' : ''}：AI 采用较慢时为 ${slow}，较快时为 ${fast}。`,
      noEstimateSr: (text) => `匹配度：${text}。`,
      zoneSr: (zone, label) => `准备等级 ${zone}：${label}。`,
      changeSr: (slow, fast) => `AI 使用，12 个月变化（估算），技能中位数：AI 采用较慢时为 ${slow}，较快时为 ${fast}。`,
      close: '关闭卡片',
      unpin: '取消固定你的卡片'
    },

    howTo: {
      title: '如何解读这个空间',
      tuft: { lead: '每一丛草代表一份工作', rest: (count) => `，共 ${count} 份；每片叶子代表它的一项技能。` },
      distance: '与盒子的距离',
      distanceFit: (rings) =>
        `等于 100 减去你的匹配度：工作离得越近，你的回答已达到它所需水平的比例就越高。圆环标出${rings}。远处边缘的空心草丛是任何回答都覆盖不到的工作，所以暂无估算。`,
      distanceZone: (low, high) =>
        `是该工作的 O*NET 准备等级（1 至 5）：表示需要多少准备，从准备等级 1（${low}，最近）到准备等级 5（${high}，最远）。每个等级是一条环带，内缘有一个圆环。目前还没有回答；完成检测后，距离就会变成你的匹配度。`,
      angle: '角度',
      angleRest: (answers) =>
        `表示该工作所属的 SOC 主要类别。${
          answers
            ? '同一类别内，工作按字母顺序排列。'
            : '同一类别和等级内，工作按字母顺序分列排放，从左到右，每列从盒子向外延伸。'
        }角度只代表类别。`,
      blade: '叶子的高度',
      bladeRest:
        '表示该技能的 AI 使用 12 个月变化（估算）。基准高度代表没有变化。AI 使用上升时按对数刻度增高：每翻一倍，增加相同的高度。使用下降时按直线缩短，从 0% 时的基准高度缩到 −100% 时的一小截。',
      colour: '颜色：',
      colourRest: (answers) =>
        `${
          answers
            ? '黄色是你的工作，蓝色是 Kotak 拿来与它比较的相关职位，暖光是其他所有工作。'
            : '每份工作都是暖光，因为还没有你的工作。'
        }灰色叶子表示未知：只有一个有日期的数据点，所以 Kotak 不做猜测。`,
      ring: '天空中的光环',
      ringRest:
        '位于马来西亚的 AI 使用指数。在 AI 采用较快时，它升到向新加坡靠拢一半的位置。标尺用数字显示同一指数，也显示新加坡的指数。',
      atmosphere: '氛围：',
      atmosphereRest: '天空、薄雾、光晕、尘埃和地面的微光都不是数据。',
      moving: '移动视角',
      drag: '拖动（触屏上用单指）四处查看草地；地平线始终在前方。',
      zoom: '滚动或双指捏合以缩放。',
      pan: '右键拖动、按住 Shift 拖动或双指拖动，可沿地面平移。',
      doubleClick: '双击一丛草，即可飞到那里并固定它的卡片。',
      reset: '飞回初始视角，让镜头重新缓缓漂移；下面的其他按键会让镜头保持不动。',
      keys: '按键',
      keyFuture: 'AI 前景：切换、较慢、较快',
      keyMonth: '数据月份',
      keyArrows: '在扇形区域中逐一浏览工作',
      keyTable: '表格，数字相同',
      keyGuide: '本指南',
      keyEscape: '关闭卡片或来源'
    }
  }
)

export type SpaceText = (typeof spaceText)['en']
