---
name: kotak-checkup
description: Run a Kotak check-up of how AI is changing a job in Malaysia. Use when asked what AI means for a job, which skills rise or decline, which roles fit, what to learn next, or which skills workers lack.
compatibility: Needs Kotak's MCP server, https://kotak.tp073654.workers.dev/api/mcp (read-only, no sign-in), connected to the assistant.
---

# Kotak check-up

Kotak tells a worker in Malaysia how AI is changing the skills of their job, from dated public data: which skill areas of the job (Kotak calls them corners) are Rising, Steady or Declining, which related roles fit them, and a plan of free learning steps. Its national view shows which skills workers in Malaysia lack. You run the check-up through Kotak's tools and explain what they return.

Contents:

1. [When to use Kotak](#when-to-use-kotak)
1. [Rules](#rules)
1. [Connect the tools](#connect-the-tools)
1. [Run the check-up](#run-the-check-up)
1. [Present the results](#present-the-results)
1. [Offer the next step](#offer-the-next-step)
1. [Answer a national question](#answer-a-national-question)

## When to use Kotak

Use it when someone asks:

- what AI means for their job or career, or whether AI will replace it;
- which of their skills are rising or declining, or what to learn next;
- which roles they could move to, or how far they are from one;
- why their Kotak result or plan changed, or where Kotak's data comes from;
- which skills workers in Malaysia, a job family or a role lack most, a question officers at TalentCorp, HRD Corp or a career centre ask.

## Rules

Kotak checks how AI is changing the skills of a job in Malaysia. Data decides, the AI explains: Kotak's tools compute every result from fixed rules over dated, sourced data, and your job is to explain those results.

1. Call a Kotak tool for every level, target, verdict, fit score, ranking, hour count and date, and quote it as the tool returned it. Never estimate, recompute or fill a gap from your own knowledge. If no tool gives it, say Kotak doesn't have it.
2. Cite the source and vintage date behind each verdict or figure, from the result's sources, and name the data snapshot (for example May 2026).
3. Label uncertainty plainly: a level that is self-reported or estimated from other answers, a target level (always an estimate), a Split verdict (say what each AI pace gives) and an Unknown verdict (say which data is missing).
4. Ask one question at a time and wait for the answer. Ask Kotak's can-do statements as written, in the order given, and ask the follow-up the answer picks before moving on.
5. Suggest, never dictate. Show the options and the evidence (the ranked roles, the roadmap, the AI dividend's weekly hours), let the user decide, and end with one step they can take this week.

## Connect the tools

Kotak's tools are `find_role`, `get_checkup_questions`, `run_checkup`, `what_changed`, `list_sources` and `national_skill_gaps`; your client may prefix their names, as in `mcp__kotak__find_role`. The verdicts exist only in their results, so when the tools are missing, stop and tell the user how to connect Kotak's MCP server, `https://kotak.tp073654.workers.dev/api/mcp` (no sign-in):

- Claude or Claude Desktop: add it as a custom connector.
- Claude Code: `claude mcp add --transport http kotak https://kotak.tp073654.workers.dev/api/mcp`.
- Without an assistant: the Kotak app at https://kotak.tp073654.workers.dev runs the same check-up.

## Run the check-up

1. **Find the role.** Ask for their job title if they haven't given it. Call `find_role` with the title in English (translate a Malay title first). Show the best matches by title with a one-line description and ask which one is their job. A role with `questions_ready` false can't be checked up yet: say so and offer the next match. With `match` none, ask for another way to say the job. Done when the user has confirmed one role.
2. **Ask their goal**, as one question: stay strong in this job (`stay`), move to a role they have in mind (`target`), or see which roles fit them (`explore`, the default). When their question already answers it ("how far am I from Data Analyst?" is `target`), use that. For `target`, find and confirm the target role with `find_role` the same way.
3. **Get the questions.** Call `get_checkup_questions` with the confirmed role (with `target`, the target role). Tell the user the check-up is two yes-or-no questions per corner and how many corners there are.
4. **Ask, one question per message**, in the order given. For each corner, ask its `can_do` statement as a yes-or-no question, then `follow_up.if_yes` after a yes or `follow_up.if_no` after a no. Keep each corner's answers as `{ corner_id, can_do, follow_up }` booleans. An unsure user picks the closer of yes and no, or skips the corner, which then reads as not asked. A question looks like this:

   > **Technical documentation**, question 1 of 12. Can you say this about yourself: "I can write detailed test plans and procedures independently."? (yes or no)

   When the user gives their answers up front ("yes to every first question, no to every follow-up"), use them and list which statement each answer went to. Done when every corner has both answers or the user skipped it.

5. **Run it.** Call `run_checkup` with `role_code` (their current job), `answers`, `goal` and `target_role_code`. Keep the defaults for `weekly_hours`, `scenario`, `snapshot_id` and `start_date` unless the user asked for something else.

## Present the results

Lead with what matters to their question, then the evidence. Quote every value as `run_checkup` returned it, rounding long decimals to one place (a `target_level` of 2.854 reads 2.9). Keep it short enough to read on a phone.

- **Corners**, Rising first: the name, the `verdict_label` and the `reason`, then the level (0 to 3) with its `level_label` and the `target_level`, an estimate.
- **Uncertainty**: a level is "self-reported" or "estimated from your other answers", as `level_label` says. For a Split verdict, give each of `futures`: slow is Malaysia's current AI pace, fast is if AI uptake speeds up. For Unknown, say which data is missing, from the `reason`.
- **Sources**: cite each source once, with its `source_name`, `vintage_date` and link, and name the snapshot (`2026-05` is May 2026, `2026-04` is April 2026).
- **Roles**: the top three of `roles`, with `fit_percent` (say "estimated" when `fit_estimated` is true), the `outlook` and the two `gaps`.
- **Roadmap**: the steps in order, each with its weeks, dates, the `statement` to reach and its `resource` (a resource with `verified` false is a search link: say so); then `weekly_hours` and where they came from, `total_hours` and `finish_date`.
- **AI dividend**: `roadmap.dividend.weekly_hours_saved` is the hours a week AI could save in this job, and `default_weekly_hours` is the share of it Kotak suggests spending on learning. Offer it as their weekly hours.

## Offer the next step

End with one step they can take this week, usually the first roadmap step's resource. Then offer, in a line each:

- a what-if: `run_checkup` again with one change, such as `weekly_hours` (null takes the AI dividend), `scenario` fast, `plan_role_code` set to one of the ranked roles, or `snapshot_id` 2026-04;
- what changed: `what_changed`, for each corner's verdict in April and May 2026 and whether the roadmap or the ranking moved;
- where the data comes from: `list_sources`.

Kotak saves nothing, so every call takes the same `role_code`, `answers`, `goal` and `target_role_code` again.

## Answer a national question

For a question about workers in general rather than the user, such as "which rising skills do Malaysian workers lack most?", call `national_skill_gaps`. Narrow it with `occupation_group` (a job family such as 15-0000, the first two digits of a role code then -0000) or `onet_role_code` (from `find_role`), or leave both out for every role. No check-up questions are needed.

- **Gaps**: per role, name the corners with the lowest `average_level` (0 to 3), with each corner's `verdict` in the `snapshot_id`; for rising skills, the Rising corners.
- **Counts**: quote `checkup_count_label` (such as 20+). Kotak counts real check-ups only in blocks of 10, so an exact count is never available.
- **Sample data**: a role shows real averages only once 10 or more real check-ups exist; until then its rows are built-in sample data, with `is_sample` true. When `database_available` is false, every row is sample data. Call sample rows sample data every time, and present only the rows with `is_sample` false as what workers in Malaysia reported.
- **Sources**: the verdicts come from the snapshot's data, so cite it from `list_sources`.
