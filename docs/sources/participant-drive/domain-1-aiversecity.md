# Domain 1: Aiversecity Future-Ready Workforce

The problem statement and preliminary-round marking rubric for Domain 1 of SDC Hackathon 2026, _The Aiversecity Future-Ready Workforce Domain_, sponsored by Aiversecity ([source PDF](https://drive.google.com/file/d/1x6Nvjl_1Gc-v3SsTnf44HVEJZQsbWVRA/view)). The cover also carries the Replit and Runpod logos.

Contents:

1.  [Domain overview](#domain-overview)
1.  [The problem statement](#the-problem-statement)
1.  [1. Background](#1-background)
1.  [2. Who you are building for](#2-who-you-are-building-for)
1.  [3. What to build](#3-what-to-build)
1.  [4. Must-have features](#4-must-have-features)
1.  [5. Good-to-have features (optional)](#5-good-to-have-features-optional)
1.  [6. Rules and boundaries](#6-rules-and-boundaries)
1.  [7. What success looks like](#7-what-success-looks-like)
1.  [8. Marking rubric – preliminary round](#8-marking-rubric--preliminary-round)
    1.  [How judging works](#how-judging-works)
1.  [Contact](#contact)

## Domain overview

- **Domain sponsor**: Aiversecity
- **Difficulty**: Intermediate
- **Main SDG**: SDG 4 (Quality Education)
- **Relevant SDGs**: SDG 5 (Gender Equality), SDG 8 (Decent Work and Economic Growth), SDG 9 (Industry, Innovation and Infrastructure), SDG 10 (Reduced Inequalities)
- **Targets**: 4.4 relevant skills for decent jobs · 4.3 lifelong technical and vocational learning · 8.2 productivity through innovation · 8.5 full and productive employment

## The problem statement

How might we build an AI-powered solution that continuously tracks AI advancement to predict which skills and jobs will emerge or decline, matches today’s workforce and tomorrow’s talent to the right future roles, and generates personalised reskilling pathways, while showing how each role and skill connects to the 17 UN Sustainable Development Goals?

## 1. Background

AI is changing which jobs exist faster than training programmes and skills frameworks can be updated. In Malaysia, 56% of professionals already use AI tools at work, yet only 26% have received formal training (Hays Asia Salary Guide 2025). The Ministry of Science, Technology and Innovation has said that more than 600,000 workers will need reskilling within three to five years.

Aiversecity believes AI should be a partner to people, not a replacement for them. Today, workers do not know which AI skills to learn, employers cannot tell which roles to train their people for, and learning pathways are usually static lists that are out of date by the time they are published. Because AI progress is unpredictable, a one-time skills assessment is not enough: we need a system that keeps learning as the technology moves.

Future-ready skills are also sustainability skills. Many of tomorrow’s jobs, in clean energy, health, smart agriculture and responsible AI, are the ones that will help deliver the 17 UN Sustainable Development Goals.

## 2. Who you are building for

- **Working adults** at risk of job displacement
- **Fresh graduates and career switchers** deciding where to go next
- **HR and learning-and-development managers** planning how to reskill their teams
- **TVET and university career centres** advising students

## 3. What to build

Build a working web app or dashboard (a proof of concept is acceptable) that takes a user from “who I am today” to “where I can be in the AI era”. A typical journey looks like this:

1.  **Tell us about yourself.** The user enters their skills, experience and interests through a CV upload, form or short questionnaire.
2.  **See the Future Skills Radar.** The system shows which skills and roles are rising or declining, based on identifiable AI-trend and job-market signals.
3.  **Get matched.** The system recommends best-fit future roles, each with a match score and a skills-gap breakdown.
4.  **Follow a pathway.** The user receives a step-by-step reskilling plan, with every recommended role and skill linked to one or more of the 17 SDGs.

## 4. Must-have features

Your final product must include all of the features below. In the preliminary round, your proposal should explain how you will deliver each one, and your demo should show the most important one working.

1.  **Skills profile intake**: Capture a person’s current skills and potential through a CV upload, form or questionnaire.
2.  **AI-trend signal layer**: Use at least one updatable source of AI and job-market trends (e.g. public job-posting data, news or research feeds, open datasets). Show the source and its date. Hard-coded lists alone do not count.
3.  **Future-role matching**: Rank suitable future roles with an explainable match score and a clear skills gap.
4.  **Personalised reskilling pathway**: An ordered learning plan with estimated time, using free or low-cost resources (online courses, HRD Corp-claimable programmes, etc.).
5.  **SDG mapping**: Tag each role and skill to at least one SDG, and show the user how their chosen career path contributes to the goals.
6.  **Handling uncertainty**: Show more than one future scenario (e.g. moderate vs fast AI disruption) instead of a single prediction, and make clear that predictions are estimates.

## 5. Good-to-have features (optional)

These are not required and are not scored separately. They strengthen your score under Innovation & Creativity or Problem-Solution Fit.

- **Employer / HR view**: a workforce-level skills-gap heatmap and reskilling plan for a whole team or company.
- **Automatic re-planning** when new AI-trend data changes the recommendations.
- **Inclusive design**: multi-language support (English, Bahasa Malaysia, Chinese) and a low-bandwidth, mobile-friendly experience.
- **Learner motivation**: progress tracking, skill badges and similar features.
- **Fairness checks** so recommendations do not discriminate by age, gender or background.
- **SDG contribution view** aggregated for a person, a company or a region.

## 6. Rules and boundaries

- **Data**: use public, open or synthetic data only. Do not use real personal data or real CVs; create sample profiles for your demo.
- **AI disclosure and guardrails**: if you use a language model, say which one. Every recommendation must cite a source, and the system must not invent jobs, courses or statistics.
- **Human-centred**: position your solution as AI that supports human career decisions, not one that replaces human judgement or makes final hiring decisions.
- **Technology**: free choice of stack.
- **Out of scope**: creating full course content, payment systems and real recruitment integrations.

## 7. What success looks like

> A new user can get from profile to ranked future roles and an actionable pathway in minutes. Every recommendation is transparent about its source, the output visibly changes when the trend data changes, and the SDG link is meaningful rather than decorative.

— Aiversecity

## 8. Marking rubric – preliminary round

The preliminary round judges your proposed idea and a first proof that you can build it. You do not need a finished product, but you do need a rough, working version of your single most important feature, shown live and backed by your GitHub repository.

| Criterion               | Weight   | What judges look for in this domain                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Innovation & Creativity | 30%      | A sharply framed slice of the workforce problem (a specific user and moment of need), and an approach that goes beyond “upload a CV and ask a chatbot for jobs”. Originality can come from how trend signals become skill forecasts, how scenarios are modelled, or how SDG links change a user’s choices.                                                            |
| Problem-Solution Fit    | 25%      | The proposal covers the whole chain in the problem statement: tracking AI advancement, predicting emerging and declining skills and jobs, matching people to future roles, personalised reskilling pathways, and the SDG connection. It explains how all six must-have features will be delivered and keeps humans in charge of career decisions.                     |
| Feasibility of Build    | 25%      | A rough, working version of the most important feature shown live and backed by the GitHub repo. For this domain that is usually the trend signal layer feeding role matching. The team names its hardest risk (e.g. reliable, updatable trend data; matching quality; AI inventing jobs or courses) and has a plan or fallback, using only public or synthetic data. |
| Clarity of Proposal     | 20%      | The proposal follows problem → approach → expected outcome. Someone hearing it cold could explain it back, including who the user is and what they walk away with. It follows the submission format and length limits.                                                                                                                                                |
| **Total**               | **100%** |                                                                                                                                                                                                                                                                                                                                                                       |

### How judging works

- A criterion’s score is its weight multiplied by the band’s percentage.
- A GitHub repository link is required. Make sure it is public or accessible to judges and reflects what you demo.
- Your preliminary score does not carry forward. The final round uses a different rubric, which will be shared with finalists.

## Contact

Questions? Contact the organizers through the Discord.

- Instagram: [@sdc_xmumhack](https://www.instagram.com/sdc_xmumhack/)
- Email: [sdc.xmumhack@gmail.com](mailto:sdc.xmumhack@gmail.com)
