import type { VerdictRow } from '@kotak/shared'
import { defineText } from '../text'

const COUNT_EN: Record<number, string> = {
  1: 'One',
  2: 'Two',
  3: 'Three',
  4: 'Four',
  5: 'Five',
  6: 'Six'
}

const COUNT_MS: Record<number, string> = {
  1: 'Satu',
  2: 'Dua',
  3: 'Tiga',
  4: 'Empat',
  5: 'Lima',
  6: 'Enam'
}

const COUNT_ZH: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六'
}

// Every user-facing string of the What Changed and Connect screens, in English, Bahasa Malaysia and Simplified
// Chinese. Skill and role names, source titles, copy-block contents and third-party product labels stay in English.
export const changesText = defineText(
  {
    // WhatChangedView
    title: 'What Changed When May Data Arrived',
    bannerTitle: 'Kopi Could Not Open This Job',
    bannerBody: 'Reload the page, or choose your job again.',
    comparing: 'Comparing the dated job data…',
    thenCompare: ', then I can compare its snapshots.',
    viewingApril: 'You are viewing April data. Select After (May) to apply the newer snapshot across Kotak.',
    liveDemo: 'Live Demo',
    activeMay: (label: string) => `New data landed: ${label} is active across Kotak.`,
    activeApril: (label: string) => `${label} data is active across Kotak.`,
    snapshotChoice: 'Choose the active snapshot',
    beforeApril: 'Before (April)',
    afterMay: 'After (May)',
    aprilToMay: 'April to May Changes',
    seeChangeInSpace: 'See This Change in the Space',
    noChanges: 'No skill changes were found between April and May.',
    dashedLine: 'The Dashed Line Moved',
    neededNowMay: 'Needed Now (May)',
    roadmapUpdated: 'See My Updated Roadmap',
    roadmapApril: 'See My April Roadmap',
    countWord: (n: number) => COUNT_EN[n] ?? String(n),
    speechNone: (before: string, after: string) => `Nothing moved between ${before} and ${after}.`,
    speechRoadmap: (count: string, n: number) =>
      `New data landed. ${count} skill${n === 1 ? '' : 's'} changed, and your roadmap moved with them.`,
    speechSkills: (count: string, n: number, before: string, after: string) =>
      `New data landed. ${count} skill${n === 1 ? '' : 's'} changed between ${before} and ${after}.`,
    speechRoles: (before: string, after: string) =>
      `New data landed. Matched roles changed between ${before} and ${after}.`,

    // WhatChangedCard
    changedTo: 'changed to',

    // WhatChangedRadar
    radarComparison: 'Future Skills Radar comparison',
    youSelfReported: 'You (Self-Reported)',
    radarLegend: 'Radar chart legend',
    tableCaption: (needed: string, before: string) =>
      `Skill levels from 0 to 3. Values for You, ${needed}, and ${before} by skill.`,
    thSkill: 'Skill',
    thYou: 'You',

    // WhatMovedList and whatMoved helpers
    whatMoved: 'What Moved',
    newData: 'New data',
    storySource: (title: string, dateText: string) => `May data · ${title}, ${dateText}`,
    verdictChange: (before: string, after: string, beforeRefs: string, afterRefs: string) =>
      `April's verdict was ${before}${beforeRefs}, and May's verdict is ${after}${afterRefs}.`,
    targetChange: (before: string, after: string, beforeRefs: string, afterRefs: string) =>
      `The estimated target moved from about ${before} in April${beforeRefs} to about ${after} in May${afterRefs}.`,
    aiUseChange: (beforeRefs: string, afterRefs: string) =>
      `The AI-use reading or its projection changed between April${beforeRefs} and May${afterRefs}.`,
    roadmapChange: (before: string, after: string, beforeRefs: string, afterRefs: string) =>
      `The roadmap position moved from ${before} in April${beforeRefs} to ${after} in May${afterRefs}.`,
    oneSource: 'One source',
    anotherSource: 'Another source',
    notPlanned: 'not planned',
    splitPace: (observed: string, faster: string) =>
      `At the observed AI-use pace, this points to ${observed}; with faster uptake, it points to ${faster}.`,
    splitSources: (firstSource: string, first: string, secondSource: string, second: string) =>
      `The sources disagree: ${firstSource} points to ${first}, while ${secondSource} points to ${second}.`,
    fallbackWhy: 'The skill data changed between April and May.',
    roadmapJoined: (title: string, from: number, to: number) => `Your roadmap: “${title}” joined weeks ${from}–${to}.`,
    roadmapMovedStep: (title: string, rank: number | null) => `Your roadmap: “${title}” moved to step ${rank}.`,
    estimatedTarget: (target: string) => `Estimated target: about ${target}.`,
    roadmapPosition: (rank: string) => `Roadmap position: ${rank}.`,
    kopiLabels: (label: string) => `Kopi now labels this skill ${label}.`,
    /** The engine's verdict rows (packages/shared VerdictRow), which travel inside verdictChange and kopiLabels; Steady
     * reads as the common verdict. */
    verdictRows: {
      'Rising: AI helps it scale': 'Rising: AI helps it scale',
      'Declining because of AI': 'Declining because of AI',
      "Rising: AI can't do it yet": "Rising: AI can't do it yet",
      'Declining for other reasons': 'Declining for other reasons'
    } satisfies Record<Exclude<VerdictRow, 'Steady'>, string>,
    kopiSignal: 'Kopi uses the changed AI-use signal.',
    movedTargetNone: 'No estimated skill targets changed between snapshots.',
    movedTargets: (n: number, names: string) => `${n} estimated skill target${n === 1 ? '' : 's'} changed: ${names}.`,
    movedRolesReordered: 'Matched roles changed order between snapshots.',
    movedFitChanged: (titles: string) => `Fit scores changed for ${titles}, while the rank order stayed the same.`,
    movedRolesSame: 'Matched role fits and order stayed the same.',
    labelTargets: 'Target Levels',
    labelRoles: 'Role Ranking',
    labelRoadmap: 'Roadmap Order',
    roadmapOrderChanged: 'The suggested learning order changed between snapshots.',
    roadmapOrderSame: 'The suggested learning order stayed the same.',

    // ScenarioControl, ScenarioMathsNote and CopyBlock
    scenarioChoice: 'Which AI Future?',
    scenarioChoiceShort: 'AI Future',
    estimateTag: 'Estimate',
    scenarioLines: { slow: 'Malaysia keeps today’s AI pace', fast: 'AI use moves halfway to Singapore’s' },
    scenarioLinesShort: { slow: 'Today’s AI pace', fast: 'Halfway to Singapore' },
    scenarioShort: { slow: 'Slow', fast: 'Fast' },
    whatChanges: 'What Changes?',
    estimatesOnly:
      'Only estimates move: needed levels, fit and plan weeks. Verdicts such as Rising and Declining stay the same in both futures.',
    rulerTitle: 'Malaysia’s AI Usage Index',
    rulerMalaysia: 'Malaysia now',
    rulerHalfway: 'halfway',
    rulerSingapore: 'Singapore',
    rulerLabel: (mys: number, sgp: number) =>
      `Malaysia’s AI usage index is ${mys} today; Singapore’s is ${sgp}. Fast AI Uptake moves Malaysia halfway.`,
    receipts: {
      radarPreview: (n: number, total: number) => `Fast AI Uptake would move ${n} of ${total} skills’ needed levels.`,
      radarDone: (n: number, total: number) =>
        `Fast AI Uptake moved ${n} of ${total} needed levels. Verdicts stay the same.`,
      radarSame: 'Both futures give this job the same needed levels.',
      radarFitPreview: (from: number, to: number) =>
        `Fast AI Uptake keeps these needed levels; your fit would move from ${from}% to ${to}%.`,
      radarFitDone: (from: number, to: number) =>
        `Same needed levels as Slow AI Uptake; your fit moved from ${from}% to ${to}%. Verdicts stay the same.`,
      rolesPreview: (title: string, from: number, to: number) =>
        `Fast AI Uptake would move ${title} from ${from}% to ${to}% fit.`,
      rolesDone: (title: string, from: number, to: number) =>
        `Fast AI Uptake moved ${title} from ${from}% to ${to}% fit. Verdicts stay the same.`,
      rolesSame: 'Fit stays the same for these roles in both futures.',
      planSame: 'Same steps, hours and fit in both futures.',
      planStart: (from: number, to: number) =>
        `Same steps and hours; Fast AI Uptake starts you at ${to}%, not ${from}%.`,
      planStartDone: (from: number, to: number) => `Same steps and hours; you start at ${to}%, not ${from}%.`,
      planHours: (hours: string) => `Fast AI Uptake changes the plan to about ${hours} h.`,
      planHoursDone: (hours: string) => `Slow AI Uptake plans about ${hours} h.`,
      planOrder: 'Fast AI Uptake keeps the hours but changes the steps or their order.',
      planOrderDone: 'Same hours as Slow AI Uptake, with different steps or a different order.'
    },
    mathsBefore: (fast: string, mys: number, sgp: number, source: string) =>
      `${fast} is an estimate with one assumption: Malaysia’s AI usage index (${mys}) moves halfway to Singapore’s (${sgp}), from ${source}. So growing AI use grows`,
    mathsAfter: ' faster, and shrinking use shrinks that much slower. Verdicts stay the same in both futures.',
    copy: 'Copy',
    copied: 'Copied',

    // ConnectView
    connectSpeech:
      'Want me in your own AI? Connect it here. It gets the same tools and sources I use, so data still decides.',
    connectIntro:
      'Add Kotak to Claude, Claude Code, VS Code or Cursor. Your assistant runs the same check-up as this app, with the same rules and sources.',
    mcpUrlTitle: 'Your MCP URL',
    mcpUrlBody: 'Any assistant that supports remote MCP servers can connect here. It’s read-only and needs no sign-in.',
    setupTitle: 'Set Up Your Assistant',
    claudeStep1: {
      before: 'In claude.ai or Claude Desktop, go to ',
      between: ', then ',
      after: '.'
    },
    claudeStep2: { before: 'Select ', between: ', then ', after: '.' },
    claudeStep3: { before: 'Name it Kotak, paste this URL and select ', after: '.' },
    claudeStep4: {
      before: 'Kotak needs no sign-in: under ',
      choose: ', choose ',
      thenSelect: ', then select ',
      after: '.'
    },
    claudeNoteCloud: 'Claude connects from Anthropic’s cloud, so it needs a public address.',
    claudeNotePrivate: ' It can’t reach this computer, so use the live site’s URL above.',
    claudeNoteFree: ' Free plans can add one custom connector.',
    codeCommandIntro: 'Add the server with one command:',
    codePluginIntro: 'Or install the Kotak plugin. It adds the server, on the live site, and the kotak-checkup skill:',
    vscodeIntro: {
      before: 'Save this as ',
      middle: ' in your workspace, then start Kotak from ',
      after: ' in the Command Palette.'
    },
    cursorIntro: {
      before: 'Save this as ',
      middle: ' in your project, or as ',
      after: ' for every project.'
    },
    teachTitle: 'Teach Claude the Check-Up',
    teachIntro:
      'The kotak-checkup skill shows Claude how to run a check-up with Kotak’s tools: one question at a time, with every source and date. The Claude Code plugin already has it.',
    teachStep1: {
      before: 'In claude.ai, go to ',
      then: ', then ',
      turnOn: ', and turn on ',
      after: '.'
    },
    teachStep2: {
      before: 'Go to ',
      then: ', then ',
      select: '. Select ',
      andChoose: ', and choose the zip',
      after: '.'
    },
    downloadSkill: 'Download the Skill',
    tryTitle: 'Try Asking',
    tryIntro:
      'Your assistant finds your role, asks Kotak’s can-do questions one at a time, and quotes Kotak’s verdicts with their sources.',
    toolsTitle: 'Tools Your Assistant Gets',
    toolsIntro: 'Every tool is read-only: your assistant can look things up in Kotak, but it can’t change anything.',
    toastCopyFailTitle: 'Couldn’t Copy',
    toastCopiedBody: (name: string) => `${name} copied to your clipboard.`,
    toastCopyFailBody: 'Your browser blocked the clipboard. Select the text and copy it.'
  },
  {
    // WhatChangedView
    title: 'Perubahan Apabila Data Mei Tiba',
    bannerTitle: 'Kopi Tidak Dapat Membuka Pekerjaan Ini',
    bannerBody: 'Muat semula halaman, atau pilih pekerjaan anda semula.',
    comparing: 'Membandingkan data pekerjaan bertarikh…',
    thenCompare: ', kemudian saya boleh membandingkan snapshotnya.',
    viewingApril: 'Anda melihat data April. Pilih Selepas (Mei) untuk menggunakan snapshot terkini di seluruh Kotak.',
    liveDemo: 'Demo Langsung',
    activeMay: (label) => `Data baharu diterima: ${label} aktif di seluruh Kotak.`,
    activeApril: (label) => `Data ${label} aktif di seluruh Kotak.`,
    snapshotChoice: 'Pilih snapshot yang aktif',
    beforeApril: 'Sebelum (April)',
    afterMay: 'Selepas (Mei)',
    aprilToMay: 'Perubahan April hingga Mei',
    seeChangeInSpace: 'Lihat Perubahan Ini dalam Ruang',
    noChanges: 'Tiada perubahan kemahiran antara April dan Mei.',
    dashedLine: 'Garis Putus-Putus Beralih',
    neededNowMay: 'Diperlukan Kini (Mei)',
    roadmapUpdated: 'Lihat Peta Jalan Saya yang Dikemas Kini',
    roadmapApril: 'Lihat Peta Jalan April Saya',
    countWord: (n) => COUNT_MS[n] ?? String(n),
    speechNone: (before, after) => `Tiada perubahan antara ${before} dan ${after}.`,
    speechRoadmap: (count) => `Data baharu diterima. ${count} kemahiran berubah, dan peta jalan anda turut berubah.`,
    speechSkills: (count, _n, before, after) =>
      `Data baharu diterima. ${count} kemahiran berubah antara ${before} dan ${after}.`,
    speechRoles: (before, after) => `Data baharu diterima. Peranan padanan berubah antara ${before} dan ${after}.`,

    // WhatChangedCard
    changedTo: 'berubah kepada',

    // WhatChangedRadar
    radarComparison: 'Perbandingan Radar Kemahiran Masa Depan',
    youSelfReported: 'Anda (Laporan Sendiri)',
    radarLegend: 'Legenda carta radar',
    tableCaption: (needed, before) =>
      `Tahap kemahiran 0 hingga 3. Nilai untuk Anda, ${needed}, dan ${before} mengikut kemahiran.`,
    thSkill: 'Kemahiran',
    thYou: 'Anda',

    // WhatMovedList and whatMoved helpers
    whatMoved: 'Apa yang Berubah',
    newData: 'Data baharu',
    storySource: (title, dateText) => `Data Mei · ${title}, ${dateText}`,
    verdictChange: (before, after, beforeRefs, afterRefs) =>
      `Verdik April ialah ${before}${beforeRefs}, dan verdik Mei ialah ${after}${afterRefs}.`,
    targetChange: (before, after, beforeRefs, afterRefs) =>
      `Anggaran sasaran berubah daripada sekitar ${before} pada April${beforeRefs} kepada sekitar ${after} pada Mei${afterRefs}.`,
    aiUseChange: (beforeRefs, afterRefs) =>
      `Bacaan penggunaan AI atau unjurannya berubah antara April${beforeRefs} dan Mei${afterRefs}.`,
    roadmapChange: (before, after, beforeRefs, afterRefs) =>
      `Kedudukan peta jalan berubah daripada ${before} pada April${beforeRefs} kepada ${after} pada Mei${afterRefs}.`,
    oneSource: 'Satu sumber',
    anotherSource: 'Sumber lain',
    notPlanned: 'tidak dirancang',
    splitPace: (observed, faster) =>
      `Pada kadar penggunaan AI yang diperhatikan, ini menunjukkan ${observed}; dengan penggunaan yang lebih pantas, ia menunjukkan ${faster}.`,
    splitSources: (firstSource, first, secondSource, second) =>
      `Sumber-sumber tidak bersetuju: ${firstSource} menunjukkan ${first}, manakala ${secondSource} menunjukkan ${second}.`,
    fallbackWhy: 'Data kemahiran berubah antara April dan Mei.',
    roadmapJoined: (title, from, to) => `Peta jalan anda: “${title}” menyertai minggu ${from}–${to}.`,
    roadmapMovedStep: (title, rank) => `Peta jalan anda: “${title}” beralih ke langkah ${rank}.`,
    estimatedTarget: (target) => `Anggaran sasaran: sekitar ${target}.`,
    roadmapPosition: (rank) => `Kedudukan peta jalan: ${rank}.`,
    kopiLabels: (label) => `Kopi kini melabelkan kemahiran ini ${label}.`,
    verdictRows: {
      'Rising: AI helps it scale': 'Meningkat: AI membantunya berkembang',
      'Declining because of AI': 'Menurun kerana AI',
      "Rising: AI can't do it yet": 'Meningkat: AI belum mampu melakukannya',
      'Declining for other reasons': 'Menurun kerana sebab lain'
    },
    kopiSignal: 'Kopi menggunakan isyarat penggunaan AI yang berubah.',
    movedTargetNone: 'Tiada anggaran sasaran kemahiran berubah antara snapshot.',
    movedTargets: (n, names) => `${n} anggaran sasaran kemahiran berubah: ${names}.`,
    movedRolesReordered: 'Peranan padanan berubah susunan antara snapshot.',
    movedFitChanged: (titles) => `Skor padanan berubah untuk ${titles}, manakala susunan pangkat kekal sama.`,
    movedRolesSame: 'Padanan dan susunan peranan padanan kekal sama.',
    labelTargets: 'Tahap Sasaran',
    labelRoles: 'Kedudukan Peranan',
    labelRoadmap: 'Susunan Peta Jalan',
    roadmapOrderChanged: 'Susunan pembelajaran yang dicadangkan berubah antara snapshot.',
    roadmapOrderSame: 'Susunan pembelajaran yang dicadangkan kekal sama.',

    // ScenarioControl, ScenarioMathsNote and CopyBlock
    scenarioChoice: 'Masa Depan AI yang Mana?',
    scenarioChoiceShort: 'Masa Depan AI',
    estimateTag: 'Anggaran',
    scenarioLines: {
      slow: 'Malaysia kekal pada kadar AI hari ini',
      fast: 'Penggunaan AI separuh jalan ke Singapura'
    },
    scenarioLinesShort: { slow: 'Kadar AI hari ini', fast: 'Separuh ke Singapura' },
    scenarioShort: { slow: 'Perlahan', fast: 'Pantas' },
    whatChanges: 'Apa yang Berubah?',
    estimatesOnly:
      'Hanya anggaran yang berubah: tahap diperlukan, padanan dan minggu pelan. Keputusan seperti Meningkat dan Menurun kekal sama dalam kedua-dua masa depan.',
    rulerTitle: 'Indeks Penggunaan AI Malaysia',
    rulerMalaysia: 'Malaysia kini',
    rulerHalfway: 'separuh jalan',
    rulerSingapore: 'Singapura',
    rulerLabel: (mys, sgp) =>
      `Indeks penggunaan AI Malaysia ialah ${mys} hari ini; Singapura ${sgp}. Guna AI Pantas membawa Malaysia separuh jalan.`,
    receipts: {
      radarPreview: (n, total) => `Guna AI Pantas akan mengubah tahap diperlukan ${n} daripada ${total} kemahiran.`,
      radarDone: (n, total) => `Guna AI Pantas mengubah ${n} daripada ${total} tahap diperlukan. Keputusan kekal sama.`,
      radarSame: 'Kedua-dua masa depan memberi tahap diperlukan yang sama untuk kerja ini.',
      radarFitPreview: (from, to) =>
        `Guna AI Pantas mengekalkan tahap diperlukan ini; padanan anda akan berubah daripada ${from}% kepada ${to}%.`,
      radarFitDone: (from, to) =>
        `Tahap diperlukan sama seperti Guna AI Perlahan; padanan anda berubah daripada ${from}% kepada ${to}%. Keputusan kekal sama.`,
      rolesPreview: (title, from, to) =>
        `Guna AI Pantas akan mengubah padanan ${title} daripada ${from}% kepada ${to}%.`,
      rolesDone: (title, from, to) =>
        `Guna AI Pantas mengubah padanan ${title} daripada ${from}% kepada ${to}%. Keputusan kekal sama.`,
      rolesSame: 'Padanan peranan ini kekal sama dalam kedua-dua masa depan.',
      planSame: 'Langkah, jam dan padanan sama dalam kedua-dua masa depan.',
      planStart: (from, to) => `Langkah dan jam sama; Guna AI Pantas memulakan anda pada ${to}%, bukan ${from}%.`,
      planStartDone: (from, to) => `Langkah dan jam sama; anda bermula pada ${to}%, bukan ${from}%.`,
      planHours: (hours) => `Guna AI Pantas mengubah pelan kepada kira-kira ${hours} j.`,
      planHoursDone: (hours) => `Guna AI Perlahan merancang kira-kira ${hours} j.`,
      planOrder: 'Guna AI Pantas mengekalkan jam tetapi mengubah langkah atau susunannya.',
      planOrderDone: 'Jam sama seperti Guna AI Perlahan, dengan langkah atau susunan yang berbeza.'
    },
    mathsBefore: (fast, mys, sgp, source) =>
      `${fast} ialah anggaran dengan satu andaian: indeks penggunaan AI Malaysia (${mys}) bergerak separuh jalan ke Singapura (${sgp}), daripada ${source}. Jadi penggunaan AI yang meningkat berkembang`,
    mathsAfter:
      ' lebih pantas, dan penggunaan yang menyusut pula menyusut dengan kadar yang sama perlahan. Verdik kekal sama dalam kedua-dua masa depan.',
    copy: 'Salin',
    copied: 'Disalin',

    // ConnectView
    connectSpeech:
      'Mahu saya dalam AI anda? Sambungkannya di sini. Ia mendapat alat dan sumber yang sama seperti saya, jadi data yang menentukan.',
    connectIntro:
      'Tambah Kotak ke Claude, Claude Code, VS Code atau Cursor. Pembantu anda menjalankan semakan yang sama seperti aplikasi ini, dengan peraturan dan sumber yang sama.',
    mcpUrlTitle: 'URL MCP Anda',
    mcpUrlBody:
      'Mana-mana pembantu yang menyokong pelayan MCP jauh boleh bersambung di sini. Ia baca sahaja dan tidak perlu log masuk.',
    setupTitle: 'Sediakan Pembantu Anda',
    claudeStep1: {
      before: 'Dalam claude.ai atau Claude Desktop, pergi ke ',
      between: ', kemudian ',
      after: '.'
    },
    claudeStep2: { before: 'Pilih ', between: ', kemudian ', after: '.' },
    claudeStep3: { before: 'Namakannya Kotak, tampal URL ini dan pilih ', after: '.' },
    claudeStep4: {
      before: 'Kotak tidak perlu log masuk: di bawah ',
      choose: ', pilih ',
      thenSelect: ', kemudian pilih ',
      after: '.'
    },
    claudeNoteCloud: 'Claude bersambung dari awan Anthropic, jadi ia memerlukan alamat awam.',
    claudeNotePrivate: ' Ia tidak dapat mencapai komputer ini, jadi gunakan URL laman langsung di atas.',
    claudeNoteFree: ' Pelan percuma boleh menambah satu penyambung tersuai.',
    codeCommandIntro: 'Tambah pelayan dengan satu arahan:',
    codePluginIntro: 'Atau pasang plugin Kotak. Ia menambah pelayan, di laman langsung, dan skill kotak-checkup:',
    vscodeIntro: {
      before: 'Simpan ini sebagai ',
      middle: ' dalam ruang kerja anda, kemudian mulakan Kotak daripada ',
      after: ' dalam Command Palette.'
    },
    cursorIntro: {
      before: 'Simpan ini sebagai ',
      middle: ' dalam projek anda, atau sebagai ',
      after: ' untuk setiap projek.'
    },
    teachTitle: 'Ajar Claude tentang Semakan',
    teachIntro:
      'Skill kotak-checkup menunjukkan kepada Claude cara menjalankan semakan dengan alat Kotak: satu soalan pada satu masa, dengan setiap sumber dan tarikh. Plugin Claude Code sudah mempunyainya.',
    teachStep1: {
      before: 'Dalam claude.ai, pergi ke ',
      then: ', kemudian ',
      turnOn: ', dan hidupkan ',
      after: '.'
    },
    teachStep2: {
      before: 'Pergi ke ',
      then: ', kemudian ',
      select: '. Pilih ',
      andChoose: ', dan pilih zip',
      after: '.'
    },
    downloadSkill: 'Muat Turun Skill',
    tryTitle: 'Cuba Tanya',
    tryIntro:
      'Pembantu anda mencari peranan anda, bertanya soalan kebolehan Kotak satu demi satu, dan memetik verdik Kotak berserta sumbernya.',
    toolsTitle: 'Alat yang Diperoleh Pembantu Anda',
    toolsIntro:
      'Setiap alat adalah baca sahaja: pembantu anda boleh merujuk maklumat dalam Kotak, tetapi tidak boleh mengubah apa-apa.',
    toastCopyFailTitle: 'Tidak Dapat Menyalin',
    toastCopiedBody: (name) => `${name} disalin ke papan klip anda.`,
    toastCopyFailBody: 'Pelayar anda menyekat papan klip. Pilih teks dan salinkannya.'
  },
  {
    // WhatChangedView
    title: '五月数据带来了什么变化',
    bannerTitle: 'Kopi 无法打开这份工作',
    bannerBody: '请重新加载页面，或重新选择你的工作。',
    comparing: '正在比较带日期的工作数据…',
    thenCompare: '，然后我就可以比较它的快照。',
    viewingApril: '你正在查看 4 月数据。请选择“之后（5 月）”，将新的快照应用到 Kotak 全站。',
    liveDemo: '实时演示',
    activeMay: (label) => `有新数据：${label}已在 Kotak 全站生效。`,
    activeApril: (label) => `${label}数据在 Kotak 全站生效。`,
    snapshotChoice: '选择生效的快照',
    beforeApril: '之前（4 月）',
    afterMay: '之后（5 月）',
    aprilToMay: '4 月到 5 月的变化',
    seeChangeInSpace: '在空间中查看这次变化',
    noChanges: '4 月到 5 月之间没有发现技能变化。',
    dashedLine: '虚线移动了',
    neededNowMay: '当前所需（5 月）',
    roadmapUpdated: '查看我更新后的路线图',
    roadmapApril: '查看我 4 月的路线图',
    countWord: (n) => COUNT_ZH[n] ?? String(n),
    speechNone: (before, after) => `${before}到${after}之间没有变化。`,
    speechRoadmap: (count, _n) => `有新数据。${count}项技能发生变化，路线图也随之更新。`,
    speechSkills: (count, _n, before, after) => `有新数据。${before}到${after}期间，${count}项技能发生变化。`,
    speechRoles: (before, after) => `有新数据。${before}到${after}期间，匹配职位发生了变化。`,

    // WhatChangedCard
    changedTo: '变为',

    // WhatChangedRadar
    radarComparison: '未来技能雷达对比',
    youSelfReported: '你（自评）',
    radarLegend: '雷达图图例',
    tableCaption: (needed, before) => `技能水平 0 到 3。按技能列出你、${needed}和${before}的数值。`,
    thSkill: '技能',
    thYou: '你',

    // WhatMovedList and whatMoved helpers
    whatMoved: '什么发生了变化',
    newData: '新数据',
    storySource: (title, dateText) => `5 月数据 · ${title}，${dateText}`,
    verdictChange: (before, after, beforeRefs, afterRefs) =>
      `4 月的结论是${before}${beforeRefs}，5 月的结论是${after}${afterRefs}。`,
    targetChange: (before, after, beforeRefs, afterRefs) =>
      `估算目标从 4 月的约 ${before}${beforeRefs}变为 5 月的约 ${after}${afterRefs}。`,
    aiUseChange: (beforeRefs, afterRefs) =>
      `AI 使用读数或其预测在 4 月${beforeRefs}到 5 月${afterRefs}之间发生了变化。`,
    roadmapChange: (before, after, beforeRefs, afterRefs) =>
      `路线图位置从 4 月的${before}${beforeRefs}变为 5 月的${after}${afterRefs}。`,
    oneSource: '一个来源',
    anotherSource: '另一个来源',
    notPlanned: '未规划',
    splitPace: (observed, faster) => `按观察到的 AI 使用进度，这指向${observed}；若采用更快，则指向${faster}。`,
    splitSources: (firstSource, first, secondSource, second) =>
      `来源之间存在分歧：${firstSource}指向${first}，而${secondSource}指向${second}。`,
    fallbackWhy: '4 月到 5 月之间技能数据发生了变化。',
    roadmapJoined: (title, from, to) => `你的路线图：“${title}”加入了第 ${from}–${to} 周。`,
    roadmapMovedStep: (title, rank) => `你的路线图：“${title}”已移至第 ${rank} 步。`,
    estimatedTarget: (target) => `估算目标：约 ${target}。`,
    roadmapPosition: (rank) => `路线图位置：${rank}。`,
    kopiLabels: (label) => `Kopi 现在将这项技能标为${label}。`,
    verdictRows: {
      'Rising: AI helps it scale': '上升：AI 助其扩展',
      'Declining because of AI': '因 AI 而下降',
      "Rising: AI can't do it yet": '上升：AI 尚无法胜任',
      'Declining for other reasons': '因其他原因下降'
    },
    kopiSignal: 'Kopi 采用了变化后的 AI 使用信号。',
    movedTargetNone: '两个快照之间，估算的技能目标没有变化。',
    movedTargets: (n, names) => `${n} 项估算技能目标发生了变化：${names}。`,
    movedRolesReordered: '两个快照之间，匹配职位的顺序发生了变化。',
    movedFitChanged: (titles) => `${titles}的匹配度发生了变化，但排名顺序保持不变。`,
    movedRolesSame: '匹配职位的匹配度和顺序保持不变。',
    labelTargets: '目标水平',
    labelRoles: '职位排名',
    labelRoadmap: '路线图顺序',
    roadmapOrderChanged: '两个快照之间，建议的学习顺序发生了变化。',
    roadmapOrderSame: '建议的学习顺序保持不变。',

    // ScenarioControl, ScenarioMathsNote and CopyBlock
    scenarioChoice: '哪一种 AI 未来？',
    scenarioChoiceShort: 'AI 未来',
    estimateTag: '估算',
    scenarioLines: { slow: '马来西亚保持目前的 AI 步伐', fast: 'AI 使用向新加坡靠拢一半' },
    scenarioLinesShort: { slow: '目前的 AI 步伐', fast: '向新加坡靠拢一半' },
    scenarioShort: { slow: '较慢', fast: '较快' },
    whatChanges: '会改变什么？',
    estimatesOnly: '只有估算会变化：所需水平、匹配度和计划周数。上升、下降等判定在两种未来中保持不变。',
    rulerTitle: '马来西亚 AI 使用指数',
    rulerMalaysia: '马来西亚现在',
    rulerHalfway: '一半',
    rulerSingapore: '新加坡',
    rulerLabel: (mys, sgp) => `马来西亚目前的 AI 使用指数为 ${mys}，新加坡为 ${sgp}。AI 采用较快会让马来西亚靠拢一半。`,
    receipts: {
      radarPreview: (n, total) => `AI 采用较快会改变 ${total} 项技能中 ${n} 项的所需水平。`,
      radarDone: (n, total) => `AI 采用较快改变了 ${total} 项所需水平中的 ${n} 项。判定保持不变。`,
      radarSame: '两种未来给这份工作的所需水平相同。',
      radarFitPreview: (from, to) => `AI 采用较快时所需水平不变；你的匹配度会从 ${from}% 变为 ${to}%。`,
      radarFitDone: (from, to) => `所需水平与 AI 采用较慢时相同；你的匹配度从 ${from}% 变为 ${to}%。判定保持不变。`,
      rolesPreview: (title, from, to) => `AI 采用较快会让 ${title} 的匹配度从 ${from}% 变为 ${to}%。`,
      rolesDone: (title, from, to) => `AI 采用较快让 ${title} 的匹配度从 ${from}% 变为 ${to}%。判定保持不变。`,
      rolesSame: '这些职位的匹配度在两种未来中相同。',
      planSame: '两种未来的步骤、时数和匹配度相同。',
      planStart: (from, to) => `步骤和时数相同；AI 采用较快时你从 ${to}% 起步，而不是 ${from}%。`,
      planStartDone: (from, to) => `步骤和时数相同；你从 ${to}% 起步，而不是 ${from}%。`,
      planHours: (hours) => `AI 采用较快会把计划改为约 ${hours} 小时。`,
      planHoursDone: (hours) => `AI 采用较慢的计划约为 ${hours} 小时。`,
      planOrder: 'AI 采用较快时时数不变，但步骤或顺序不同。',
      planOrderDone: '时数与 AI 采用较慢时相同，但步骤或顺序不同。'
    },
    mathsBefore: (fast, mys, sgp, source) =>
      `${fast}是一项估算，只有一个假设：马来西亚的 AI 使用指数（${mys}）向新加坡（${sgp}）靠拢一半，数据来自${source}。因此，增长的 AI 使用会以`,
    mathsAfter: '倍的速度增长，而萎缩的使用则以同样的幅度放缓。两种前景的结论保持不变。',
    copy: '复制',
    copied: '已复制',

    // ConnectView
    connectSpeech: '想把我接到你自己的 AI 里？在这里连接。它和我用同样的工具和来源，所以还是数据说了算。',
    connectIntro:
      '将 Kotak 添加到 Claude、Claude Code、VS Code 或 Cursor。你的助手运行与本应用相同的检测，规则和来源也相同。',
    mcpUrlTitle: '你的 MCP URL',
    mcpUrlBody: '任何支持远程 MCP 服务器的助手都可以在此连接。它是只读的，无需登录。',
    setupTitle: '设置你的助手',
    claudeStep1: {
      before: '在 claude.ai 或 Claude Desktop 中，前往 ',
      between: '，然后选择 ',
      after: '。'
    },
    claudeStep2: { before: '选择 ', between: '，然后选择 ', after: '。' },
    claudeStep3: { before: '将其命名为 Kotak，粘贴此 URL，然后选择 ', after: '。' },
    claudeStep4: {
      before: 'Kotak 无需登录：在 ',
      choose: ' 下，选择 ',
      thenSelect: '，然后选择 ',
      after: '。'
    },
    claudeNoteCloud: 'Claude 从 Anthropic 的云端连接，因此需要一个公网地址。',
    claudeNotePrivate: ' 它无法访问这台电脑，请使用上方的正式网站 URL。',
    claudeNoteFree: ' 免费计划可添加一个自定义连接器。',
    codeCommandIntro: '用一条命令添加服务器：',
    codePluginIntro: '或安装 Kotak 插件。它会添加服务器、正式网站和 kotak-checkup skill：',
    vscodeIntro: {
      before: '将其保存为工作区中的 ',
      middle: '，然后在 Command Palette 中通过 ',
      after: ' 启动 Kotak。'
    },
    cursorIntro: {
      before: '将其保存为项目中的 ',
      middle: '，或保存为 ',
      after: ' 以用于每个项目。'
    },
    teachTitle: '教 Claude 做检测',
    teachIntro:
      'kotak-checkup skill 会教 Claude 如何用 Kotak 的工具做检测：一次只问一个问题，并给出每个来源和日期。Claude Code 插件已经内置了它。',
    teachStep1: {
      before: '在 claude.ai 中进入 ',
      then: '，再进入 ',
      turnOn: '，并开启 ',
      after: '。'
    },
    teachStep2: {
      before: '进入 ',
      then: '，再进入 ',
      select: '。选择 ',
      andChoose: '，最后选择该 zip 文件',
      after: '。'
    },
    downloadSkill: '下载 Skill',
    tryTitle: '试着问一问',
    tryIntro: '你的助手会找到你的职位，一次问一个 Kotak 的实操问题，并引用 Kotak 的结论及其来源。',
    toolsTitle: '你的助手能用的工具',
    toolsIntro: '所有工具都是只读的：你的助手可以在 Kotak 中查询，但不能更改任何内容。',
    toastCopyFailTitle: '无法复制',
    toastCopiedBody: (name) => `已将${name}复制到剪贴板。`,
    toastCopyFailBody: '浏览器阻止了剪贴板。请手动选择文本并复制。'
  }
)
