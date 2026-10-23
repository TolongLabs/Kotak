// Kopi's fixed lines: every text the app sends to POST /api/tts along the demo walk in docs/demo/video.md, for the
// sample profile in data/demo-roles.json (Web Developers, "Show Me Where I Could Go", level 1 on every corner: Not
// Yet to each corner's first question, Yes to its second). They were recorded from the running app's /api/tts request
// bodies on 22 October 2026, after voice.ts cleans them, through Check-Up, Radar, Roles, Roadmap, Home and What
// Changed (April, then May). A pre-generated file is used only when the app sends exactly the same text, so record
// the walk again when a screen's copy changes (#150). After them come the literal lines the screens pass to Kopi for
// empty, error and landing states, which the walk doesn't reach, and the intake's fixed lines (#284). Other
// templated lines are spoken live.
export const KOPI_FIXED_LINES = [
  'Hi, I’m Kopi. Let’s open the box on your job.',
  'Opening the box on your job…',
  'I can write detailed test plans and procedures independently.',
  'I can record simple test results with guidance.',
  'I can write detailed descriptions of web site specifications.',
  'I can maintain knowledge of web technologies through reading.',
  'I can write supporting code for web applications independently.',
  'I can build simple web pages using authoring tools with guidance.',
  'I can evaluate code for browser and device compatibility.',
  'I can perform basic web site tests with a checklist.',
  'I can develop databases that support web applications.',
  'I can analyze user needs to list basic technical requirements.',
  'I can collaborate with teams to resolve web site issues.',
  'I can respond to user email inquiries with guidance.',
  'Your biggest rising gap is Technical documentation. Try this: I can write detailed test plans and procedures independently.',
  'Finding roles that fit your work…',
  'Document Management Specialists is your best fit at an estimated 51%.',
  'Your plan is ready. 4 hours a week gets you there by Week 105.',
  'Your biggest rising gap is Technical documentation. Start with the next step below.',
  'Comparing the dated job data…',
  'New data landed. Six skills changed, and your roadmap moved with them.',
  'You are viewing April data. Select After (May) to apply the newer snapshot across Kotak.',
  'Hmm, I couldn’t find that job. Try a simpler title?',
  'Tell me your job first, then I can show how it is changing.',
  'Tell me your job first, then I can ask about it.',
  'Tell me your job first, then I can map its skills.',
  'The AI is resting. Your verdicts still stand. I’ll explain them when it’s back.',
  'Tell me your job first, then I can make a roadmap for it.',
  'Tell me your job first, then I can find roles that fit.',
  'Tell me your job first, then I can compare its snapshots.',
  'Choose a job to open your check-up.',
  'Kopi is opening the Web Developers example…',
  'Have you reviewed AI-written code before merging it?',
  'Choose a job before opening a check-up.',
  // The intake and the roles it suggests (#284).
  'Hi, I’m Kopi. Tell me where you are, and I’ll find the roles worth checking.',
  'No job to test yet? No problem. I’ll suggest roles first, then test you on the one you pick.',
  'Let’s open the box on your work.',
  'Not sure yet? Tell me what you enjoy, and I’ll suggest roles to try.',
  'Looking for roles that suit you…',
  'I need a little more to go on.',
  'Pick a role to check first, then I can show how it is changing.',
  'Pick a role to check first, then I can ask about it.',
  'Pick a role to check first, then I can map its skills.',
  'Pick a role to check first, then I can make a roadmap for it.',
  'Pick a role to check first, then I can find roles that fit.',
  'Pick a role to check first, then I can compare its snapshots.'
]
