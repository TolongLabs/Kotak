import { defineText } from '../text'

// Proving a roadmap step (#457): the step card's proof states and the proof sheet.
const en = {
  card: {
    prove: 'Prove This Step',
    proveLabel: (skill: string, weeks: string) => `Prove the ${skill} step, ${weeks}`,
    whatCounts: 'Upload a certificate or a course completion screen. Kopi checks it before the step counts as done.',
    lockedLabel: 'Finish this step after the plan window to prove it',
    judging: 'Kopi is reading your file…',
    proven: 'Proven',
    completedOn: (date: string) => `Completed ${date}`,
    notProven: 'Not proven yet',
    notProvenNote: 'You ticked this step before Kotak asked for proof.',
    failed: 'Not accepted',
    tryAnother: 'Try Another File',
    unclear: 'Kopi needs a clearer file',
    unclearHint: 'Show the whole certificate, including the date.',
    tryAgain: 'Try Again',
    errorTitle: 'Kopi could not check your file',
    errorBody: 'Your step stays open. Check your connection and try again.',
    undo: 'Undo',
    undoLabel: (skill: string) => `Undo the proof for ${skill}`,
    announcePass: (skill: string) => `${skill} is proven. The next step is open.`,
    announceFail: (reason: string) => `Not accepted. ${reason}`,
    announceUnclear: (hint: string) => `Kopi needs a clearer file. ${hint}`,
    announceError: 'Kopi could not check your file. Your step stays open.'
  },
  sheet: {
    title: 'Prove This Step',
    intro: (skill: string) => `Show that you finished a course on ${skill}.`,
    countsHeading: 'What counts',
    examples: {
      certificate: 'A certificate PDF',
      completion: 'A course completion screen',
      badge: 'A badge page'
    },
    dropTitle: 'Drop your file here, or paste it',
    dropTypes: 'PNG, JPEG, WebP or PDF, up to 5 MB',
    choose: 'Choose File',
    change: 'Choose Another File',
    remove: 'Remove File',
    previewLabel: (name: string) => `Preview of ${name}`,
    pdfFirstPage: 'Kopi reads the first page of a PDF.',
    privacy: 'Kotak reads your file once to check it, then deletes it. Only the verdict is kept.',
    submit: 'Check My Proof',
    cancel: 'Cancel',
    errors: {
      heic: 'iPhone photos save as HEIC, which Kopi cannot read. Take a screenshot of the certificate instead, or set Settings → Camera → Formats to Most Compatible.',
      type: 'Choose a PNG, JPEG, WebP or PDF file.',
      size: 'This file is over 5 MB. Choose a smaller file, or take a screenshot of the certificate.',
      read: 'Kotak could not read this file. Choose it again.'
    }
  }
}

const ms: typeof en = {
  card: {
    prove: 'Buktikan Langkah Ini',
    proveLabel: (skill: string, weeks: string) => `Buktikan langkah ${skill}, ${weeks}`,
    whatCounts: 'Muat naik sijil atau skrin tamat kursus. Kopi akan menyemaknya sebelum langkah dikira selesai.',
    lockedLabel: 'Selesaikan langkah ini selepas tempoh pelan untuk membuktikannya',
    judging: 'Kopi sedang membaca fail anda…',
    proven: 'Terbukti',
    completedOn: (date: string) => `Selesai pada ${date}`,
    notProven: 'Belum terbukti',
    notProvenNote: 'Anda menandakan langkah ini sebelum Kotak meminta bukti.',
    failed: 'Tidak diterima',
    tryAnother: 'Cuba Fail Lain',
    unclear: 'Kopi memerlukan fail yang lebih jelas',
    unclearHint: 'Tunjukkan keseluruhan sijil, termasuk tarikhnya.',
    tryAgain: 'Cuba Lagi',
    errorTitle: 'Kopi tidak dapat menyemak fail anda',
    errorBody: 'Langkah anda kekal terbuka. Semak sambungan anda dan cuba lagi.',
    undo: 'Buat Asal',
    undoLabel: (skill: string) => `Buat asal bukti untuk ${skill}`,
    announcePass: (skill: string) => `${skill} telah terbukti. Langkah seterusnya dibuka.`,
    announceFail: (reason: string) => `Tidak diterima. ${reason}`,
    announceUnclear: (hint: string) => `Kopi memerlukan fail yang lebih jelas. ${hint}`,
    announceError: 'Kopi tidak dapat menyemak fail anda. Langkah anda kekal terbuka.'
  },
  sheet: {
    title: 'Buktikan Langkah Ini',
    intro: (skill: string) => `Tunjukkan bahawa anda telah menamatkan kursus dalam ${skill}.`,
    countsHeading: 'Perkara yang dikira',
    examples: {
      certificate: 'Sijil PDF',
      completion: 'Skrin tamat kursus',
      badge: 'Halaman lencana'
    },
    dropTitle: 'Lepaskan fail anda di sini, atau tampal',
    dropTypes: 'PNG, JPEG, WebP atau PDF, sehingga 5 MB',
    choose: 'Pilih Fail',
    change: 'Pilih Fail Lain',
    remove: 'Alih Keluar Fail',
    previewLabel: (name: string) => `Pratonton ${name}`,
    pdfFirstPage: 'Kopi membaca halaman pertama PDF.',
    privacy: 'Kotak membaca fail anda sekali untuk menyemaknya, kemudian memadamkannya. Hanya keputusan yang disimpan.',
    submit: 'Semak Bukti Saya',
    cancel: 'Batal',
    errors: {
      heic: 'Foto iPhone disimpan sebagai HEIC, yang tidak dapat dibaca oleh Kopi. Ambil tangkapan skrin sijil sebagai gantinya, atau tetapkan Seting → Kamera → Format kepada Paling Serasi.',
      type: 'Pilih fail PNG, JPEG, WebP atau PDF.',
      size: 'Fail ini melebihi 5 MB. Pilih fail yang lebih kecil, atau ambil tangkapan skrin sijil.',
      read: 'Kotak tidak dapat membaca fail ini. Pilih sekali lagi.'
    }
  }
}

const zh: typeof en = {
  card: {
    prove: '证明此步骤',
    proveLabel: (skill: string, weeks: string) => `证明${skill}步骤，${weeks}`,
    whatCounts: '上传证书或课程完成画面。Kopi 会在步骤计为完成前进行检查。',
    lockedLabel: '在计划期后完成此步骤以进行证明',
    judging: 'Kopi 正在读取你的文件…',
    proven: '已证明',
    completedOn: (date: string) => `完成于 ${date}`,
    notProven: '尚未证明',
    notProvenNote: '你在 Kotak 要求提供证明之前勾选了此步骤。',
    failed: '未被接受',
    tryAnother: '尝试其他文件',
    unclear: 'Kopi 需要更清晰的文件',
    unclearHint: '显示完整证书，包括日期。',
    tryAgain: '重试',
    errorTitle: 'Kopi 无法检查你的文件',
    errorBody: '你的步骤保持开启。检查网络连接后重试。',
    undo: '撤销',
    undoLabel: (skill: string) => `撤销「${skill}」的证明`,
    announcePass: (skill: string) => `${skill}已证明。下一步已开放。`,
    announceFail: (reason: string) => `未被接受。${reason}`,
    announceUnclear: (hint: string) => `Kopi 需要更清晰的文件。${hint}`,
    announceError: 'Kopi 无法检查你的文件。你的步骤保持开启。'
  },
  sheet: {
    title: '证明此步骤',
    intro: (skill: string) => `证明你已完成${skill}的课程。`,
    countsHeading: '计入的内容',
    examples: {
      certificate: '证书 PDF',
      completion: '课程完成画面',
      badge: '徽章页面'
    },
    dropTitle: '将文件拖到这里，或直接粘贴',
    dropTypes: 'PNG、JPEG、WebP 或 PDF，不超过 5 MB',
    choose: '选择文件',
    change: '选择其他文件',
    remove: '移除文件',
    previewLabel: (name: string) => `${name} 的预览`,
    pdfFirstPage: 'Kopi 读取 PDF 的第一页。',
    privacy: 'Kotak 读取你的文件一次进行检查，然后将其删除。仅保留判断结果。',
    submit: '检查我的证明',
    cancel: '取消',
    errors: {
      heic: 'iPhone 照片会保存为 HEIC，Kopi 无法读取。可以改为截取证书的屏幕截图，或将设置 → 相机 → 格式设为兼容性最佳。',
      type: '选择 PNG、JPEG、WebP 或 PDF 文件。',
      size: '此文件超过 5 MB。选择较小的文件，或截取证书的屏幕截图。',
      read: 'Kotak 无法读取此文件。请重新选择。'
    }
  }
}

export const evidenceText = defineText(en, ms, zh)
