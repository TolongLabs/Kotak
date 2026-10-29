// What Kotak's tools are and the rules every agent follows (#184 "Agent layer"). Dependency-free, so the web's
// Connect page can list the same tools the MCP server and Kopi's chat serve. Each description is a prompt for the
// model: its first sentence says what the tool does, the rest says when to call it and how to use the result.

/**
 * The rules every Kotak agent follows: the MCP server's instructions, Kopi's system prompt and the kotak-checkup
 * skill. Claude Code cuts server instructions at 4,096 characters, so keep it short.
 */
export const AGENT_RULES = `Kotak checks how AI is changing the skills of a job in Malaysia. Data decides, the AI explains: Kotak's tools compute every result from fixed rules over dated, sourced data, and your job is to explain those results.

1. Call a Kotak tool for every level, target, verdict, fit score, ranking, hour count and date, and quote it as the tool returned it. Never estimate, recompute or fill a gap from your own knowledge. If no tool gives it, say Kotak doesn't have it.
2. Cite the source and vintage date behind each verdict or figure, from the result's sources, and name the data snapshot (for example May 2026).
3. Label uncertainty plainly: a level that is self-reported or estimated from other answers, a target level (always an estimate), a Split verdict (say what each AI pace gives) and an Unknown verdict (say which data is missing).
4. Ask one question at a time and wait for the answer. Ask Kotak's can-do statements as written, in the order given, and ask the follow-up the answer picks before moving on.
5. Suggest, never dictate. Show the options and the evidence (the ranked roles, the roadmap, the AI dividend's weekly hours), let the user decide, and end with one step they can take this week.`

export const TOOL_CATALOG = {
  find_role: {
    title: 'Find a Role',
    description:
      "Find the O*NET roles that match a job title, best first. Call it first in a check-up, then confirm the role with the user; never guess an O*NET code. It searches O*NET's English titles and alternate titles, so translate a Malay or local title to English first (for example jurutera perisian to software engineer). A role with questions_ready false can't be checked up yet: say so and offer the next match."
  },
  get_checkup_questions: {
    title: 'Get the Check-Up Questions',
    description:
      "Get a role's can-do questions in Kotak's asking order, Rising corners first. A corner is one skill area of the job. Call it once the user confirms their role (with the target goal, the target role). For each corner, ask the basic statement, then the advanced one, one question per message; the user rates each from 1 (Not yet) to 4 (Yes, on my own). Keep each corner's two ratings as { corner_id, basic, advanced } for run_checkup."
  },
  suggest_roles: {
    title: 'Suggest Roles',
    description:
      "Suggest roles to check up on before any question, from who the user is: their situation, highest qualification, field of study, the areas they picked, the roles they named and the activities they enjoy. Call it when the user has no job title, doesn't know what they want, or wants to change field; ask about their study and interests first, one question at a time, and use the field and area ids the result lists. Each role says why it is there, its outlook, and its access. Qualification Needed means a regulated profession in Malaysia that needs a qualifying degree and admission to practise: say so, name the regulator from access.profession, and never steer the user away for it; their check-up answers show whether the work suits them, which helps them decide whether the degree is worth it. Let the user pick one, then check them up on it with the target goal."
  },
  run_checkup: {
    title: 'Run the Check-Up',
    description:
      "Run a Kotak check-up: each corner's level, target level and verdict with its reason and sources, the user's role and its related roles ranked by fit with the two biggest gaps, and a roadmap of free learning steps with weekly hours and a finish date. Call it once the user has answered every corner, and call it again for each what-if (weekly hours, the fast scenario, another plan role, the April snapshot) instead of working the answer out yourself. Kotak saves nothing, so pass every answer each time. Pass the user's profile when you know it: the ranking then adds the roles their study, areas and targets lead to, and each role and the roadmap carry an access rule. Its situation, years_experience and education_level also pace the roadmap: roadmap.pace gives the factor, an estimate, with its three inputs, and a returner's refresher step, which comes before the steps. When roadmap.access.status is qualify, register or check_licence, say the qualification or admission comes before the steps, with the regulator and the route from access.profession. Defaults are the Kotak app's: the May 2026 snapshot, the slow scenario, 4 hours a week, the explore goal and a start date of today in Malaysia."
  },
  what_changed: {
    title: 'What Changed Between Snapshots',
    description:
      "Show what changed for the user's answers between two data snapshots, April 2026 to May 2026 by default: each corner's verdict before and after, the verdict flips, and whether the roadmap order and the role ranking moved. Call it when the user asks why their result or plan changed, or what the newest data changed. Pass the same answers and goal as run_checkup."
  },
  national_skill_gaps: {
    title: 'National Skill Gaps',
    description:
      "Get Kotak's national view: the average level, from 0 to 3, that people in Malaysia reached on each corner of a role in their Kotak check-ups, with the corner's name and its verdict in the latest data snapshot. Call it when the user asks which skills workers in Malaysia, in an occupation group or in a role lack, for example which Rising corners have the lowest averages. Filter by occupation_group (15-0000) or onet_role_code, or leave both out for every role. A role shows real averages only from 10 or more real check-ups, counted in blocks of 10, so quote checkup_count_label (20+), never an exact count. Every other row is built-in sample data (is_sample true, and every row when database_available is false): call it sample data every time and never present it as what Malaysian workers reported."
  },
  job_market: {
    title: 'Job Ads in Malaysia',
    description:
      "Get what Malaysian job ads say about up to 5 roles: active ads and employers, an estimate of how many JobStreet ads match the role and its rank by that among the roles with an estimate (popularity), advertised monthly pay in ringgit (median and middle half, overall and for junior, mid-level and senior ads by the experience they ask for), the states the jobs are in, remote and hybrid counts, work types, the tools, languages and AI skills the ads mention, the benefits employers name in the ads' selling points, and weekly ad counts. Call it when the user asks about pay, demand, locations, benefits or the skills employers ask for in a role, or to compare roles they are weighing. The figures come from JobStreet ads that Kotak's admins approved for the role's O*NET occupation: quote them as given, with the source and its vintage date, and say how many ads a figure rests on (pay.ads_with_pay, skills.ads_checked, benefits.ads_checked). They set no verdict. When database_available is true, a role missing from markets has no approved ads yet, so say Kotak has no job-ad data for it. When it is false, the figures in markets may be up to an hour old, and a role missing from them is unknown rather than without ads."
  },
  list_sources: {
    title: 'List the Data Sources',
    description:
      'List the data sources behind every Kotak result with their vintage dates, licences and credit lines, and the data snapshots with the default one. Call it when the user asks where the data comes from or how current it is.'
  }
} as const satisfies Record<string, { title: string; description: string }>

export type ToolName = keyof typeof TOOL_CATALOG

/**
 * What a tool does: the first sentence of its description. By convention that sentence stands alone, and the rest
 * tells the model when to call the tool and how to use its result. The Connect page and /llms.txt list tools by it.
 */
export const toolSummary = ({ description }: { description: string }): string =>
  /^.*?\.(?=\s|$)/.exec(description)?.[0] ?? description

// Where an assistant gets Kotak: the build publishes the skill zip and /llms.txt from these, and the Connect page shows
// them. The kotak plugin (plugins/kotak) repeats the live URLs, and the build fails if any of them drifts.

/** The live site. */
export const LIVE_SITE = 'https://kotak.tp073654.workers.dev'
/** The MCP server's path on any Kotak origin. */
export const MCP_PATH = '/api/mcp'
/** The kotak-checkup skill as a zip for claude.ai, on any Kotak origin. */
export const SKILL_ZIP_PATH = '/kotak-checkup.zip'
/**
 * The GitHub repository whose .claude-plugin/marketplace.json lists the kotak plugin. The plugin moves to a public
 * repository before submission, so every install instruction takes the slug from here.
 */
export const MARKETPLACE_REPO = 'TolongLabs/Kotak'
/** Claude Code commands that install the kotak plugin: the kotak-checkup skill plus the MCP server. */
export const PLUGIN_INSTALL_COMMANDS = [
  `claude plugin marketplace add ${MARKETPLACE_REPO}`,
  'claude plugin install kotak@kotak'
] as const
