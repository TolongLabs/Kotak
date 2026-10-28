# SDC Hackathon 2026 technical tools declaration template

The fill-in template where a team declares every API, cloud service, AI tool, dataset, model and sponsor resource used to build its project, shared on Google Drive as "2. SDC Hackathon: Technical Tools Declaration Template" ([source PDF](https://drive.google.com/file/d/1LBXfXrFblX-dHanSP8jhUOMGfGGxY2ew/view)). This page reproduces every section, field, table column, prompt, checkbox and word limit in the template's order, with the prompts quoted exactly.

Contents:

1.  [Cover page and submission rules](#cover-page-and-submission-rules)
1.  [1. Team and project overview](#1-team-and-project-overview)
1.  [2. Architecture & technology stack](#2-architecture--technology-stack)
    1.  [2.1. System architecture overview](#21-system-architecture-overview)
    1.  [2.2. Languages, frameworks & libraries](#22-languages-frameworks--libraries)
1.  [3. APIs & cloud services](#3-apis--cloud-services)
    1.  [3.1. External APIs](#31-external-apis)
    1.  [3.2. Cloud platforms & deployment](#32-cloud-platforms--deployment)
1.  [4. AI tools, models & datasets](#4-ai-tools-models--datasets)
    1.  [4.1. AI models used in the solution](#41-ai-models-used-in-the-solution)
    1.  [4.2. Datasets](#42-datasets)
    1.  [4.3. AI-assisted development tools](#43-ai-assisted-development-tools)
1.  [5. Sponsor-provided resources](#5-sponsor-provided-resources)
1.  [6. Security, privacy & responsible use](#6-security-privacy--responsible-use)
    1.  [6.1. Data handling & privacy](#61-data-handling--privacy)
    1.  [6.2. Known limitations & risks](#62-known-limitations--risks)
1.  [7. Compliance & readiness](#7-compliance--readiness)
1.  [8. Declaration](#8-declaration)
1.  [Finalist copy](#finalist-copy)
1.  [See also](#see-also)

## Cover page and submission rules

The cover page is titled "SDC Hackathon" with the subtitle "Technical Tools Declaration", and reads "Hosted by Xiamen University Malaysia (XMUM) AI Club" and "Submission Deadline: [Insert date]". It carries the same SDC logo, logo strip (Xiamen University, XMUM AI Club, Rotaract Club of Xiamen University Malaysia, Rotary Club of Kuala Lumpur Dynamics, Rotary Club of Tun Razak Exchange) and footer ("Instagram: @sdc_xmumhack", "Email: sdc.xmumhack@gmail.com") as the proposal template.

The instructions box on the cover says, verbatim:

> Instructions: Declare every API, cloud service, AI tool, dataset, model, and sponsor resource your team used to build the project. Complete every section; where a category does not apply, tick “No” or write “None” – do not leave it blank. Submit as a single PDF document named “SDC2026_TeamName_TechDeclaration.pdf” together with your project submission. Undeclared third-party resources discovered at judging may affect your score or eligibility.

What that means in practice:

- **File**: one PDF named `SDC2026_TeamName_TechDeclaration.pdf`, with your team name in place of `TeamName`, submitted together with your project submission.
- **Deadline**: not set. The cover still shows the placeholder "[Insert date]". The [finalist copy](#finalist-copy) sets 1 November 2026.
- **No blanks**: complete every section. Where a category does not apply, tick "No" or write "None".
- **Penalty**: undeclared third-party resources discovered at judging may affect your score or eligibility.
- **Secrets**: do not include API keys or secrets (section 3.1), and the section 7 checklist asks you to confirm none are exposed anywhere.
- **Word limits**: 200 words for 2.1, 100 words each for the 4.3 and section 5 follow-up questions, and 150 words each for 6.1 and 6.2.

The PDF is 16 pages: the unnumbered cover, then 15 numbered pages. Short fields have a blank answer line, open-ended questions have a large blank answer box, and the yes/no questions and checklist use tick boxes. Every table is an empty form with a fixed number of blank rows; none has an example row.

## 1. Team and project overview

Each field has a single blank answer line.

- Team Name
- Project / Solution Name
- Name (Leader)
- Email & Phone (Leader)
- University Affiliation(s)
- Live Prototype URL
- Code Repository URL (public / access granted to judges)

## 2. Architecture & technology stack

### 2.1. System architecture overview

Describe how the components declared in this document connect end-to-end (e.g., user interface → backend → AI model/API → database → cloud hosting). Attach a system block diagram as an appendix if available.

**[Maximum 200 words]**

Answer space: one large blank box.

### 2.2. Languages, frameworks & libraries

List the main programming languages, frameworks, and third-party libraries that your team did not create. Open-source use is permitted provided it is declared and properly licensed/attributed.

| Name & Version | Purpose in Project | License |
| -------------- | ------------------ | ------- |
|                |                    |         |

The template provides six blank rows.

## 3. APIs & cloud services

### 3.1. External APIs

List every external API your solution calls (GenAI, maps, payments, messaging, data feeds, etc.). Do not include API keys or secrets in this document.

| API and Provider | Purpose in Project | Access Tier (free / paid / sponsor-provided) |
| ---------------- | ------------------ | -------------------------------------------- |
|                  |                    |                                              |

The template provides seven blank rows.

### 3.2. Cloud platforms & deployment

List every cloud service used for hosting, storage, databases, authentication, or compute, and indicate how the prototype is deployed.

| Service & Provider | Purpose in Project | Plan / Region |
| ------------------ | ------------------ | ------------- |
|                    |                    |               |

The template provides seven blank rows. There is no separate field for how the prototype is deployed, so that has to go in the table.

## 4. AI tools, models & datasets

### 4.1. AI models used in the solution

List every AI model embedded in or called by your application, including pre-trained, fine-tuned, and self-trained models.

| Model & Version | Source / Provider | Usage (pre-trained / fine-tuned / self-trained) | License / Terms |
| --------------- | ----------------- | ----------------------------------------------- | --------------- |
|                 |                   |                                                 |                 |

The template provides seven blank rows.

### 4.2. Datasets

List all datasets used for training, fine-tuning, evaluation, or in the running application. State clearly if a dataset contains personal or sensitive data.

| Dataset Name | Source / URL | Type (public / private / self-collected / synthetic) | License | Personal Data? (Y/N) |
| ------------ | ------------ | ---------------------------------------------------- | ------- | -------------------- |
|              |              |                                                      |         |                      |

The template provides eight blank rows.

### 4.3. AI-assisted development tools

Tools used to help write code, design, content, or documentation (e.g., chat assistants, code completion tools, image generators). Declaring these tools does not reduce your score; undeclared use may.

Did your team use any generative-AI tool to help create code, design, text, or other project material?

- [ ] Yes
- [ ] No

If yes, list them below:

| Tool & Version | Used For | Extent of Use (minor / moderate / major) |
| -------------- | -------- | ---------------------------------------- |
|                |          |                                          |

The template provides four blank rows. The next page asks:

Briefly describe how your team reviewed, tested, and took responsibility for AI-generated output:

**[Maximum 100 words]**

Answer space: one large blank box.

## 5. Sponsor-provided resources

Declare any official SDC sponsor-provided GenAI API, cloud credits, tools, mentoring, or data that your team used.

Did your project use any official SDC sponsor-provided resource?

- [ ] Yes
- [ ] No

If yes, list them below:

| Sponsor | Resource (API / credits / platform / data) | How It Was Used in the Project |
| ------- | ------------------------------------------ | ------------------------------ |
|         |                                            |                                |

The template provides four blank rows. The next page asks:

Was the sponsor resource essential to the core functionality of the prototype, or could it be replaced? Explain briefly:

**[Maximum 100 words]**

Answer space: one large blank box.

## 6. Security, privacy & responsible use

### 6.1. Data handling & privacy

What user or personal data does your application collect, store, or send to third-party services (including AI APIs)? How is it protected, and how long is it kept? State “No user data is collected” if applicable.

**[Maximum 150 words]**

Answer space: one large blank box.

### 6.2. Known limitations & risks

Identify the main technical limitations of your AI components (e.g., hallucination, bias, rate limits, dependency on a single provider) and any mitigation you have implemented.

**[Maximum 150 words]**

Answer space: one large blank box.

## 7. Compliance & readiness

Tick all boxes that apply before submitting.

- [ ] All APIs, cloud services, AI tools, models, and datasets used in the project are declared in this document.
- [ ] All third-party code, datasets, and models are used in accordance with their licenses, and attribution is provided where required.
- [ ] No API keys, passwords, or other credentials are exposed in the code repository, prototype, or this document.
- [ ] Any use of generative-AI tools for development has been disclosed and reviewed by the team.
- [ ] Any use of official SDC sponsor resources has been declared in Section 5.
- [ ] The prototype described here is accessible to judges through the links provided in Section 1.
- [ ] All fields in this template have been completed within the word limits stated.

## 8. Declaration

By submitting this document, the team leader confirms that the information provided is complete and accurate to the best of the team’s knowledge, and that every API, cloud service, AI tool, dataset, model, and sponsor resource used in the project has been declared.

[Signature]

[Date]

The template leaves blank space under each placeholder. It does not say whether the signature must be handwritten or may be typed.

## Finalist copy

The Finalist Drive holds a finalist copy, "2. SDC Hackathon: Tech. Tools Declaration Template (Finalist)" ([source `.docx`](https://drive.google.com/file/d/1VrG2XqRfnl1_Sku-ZslEdrtZJG60dWcA/view)), added on 26 October 2026. Its text matches the `.docx` copy in the participant Drive, except that the deadline reads "Submission Deadline: 1st November 2026" and the cover background image is gone. The [Drive tour](finalist-drive-tour.md) asks finalists to submit a new copy for the final, alongside the [Phase 2 report](final-report-template.md).

## See also

- [Phase 1 preliminary project proposal template](submission-template.md), whose section 6 asks for an overlapping set of third-party and pre-existing-work declarations
- [GitHub submission template](github-submission-template.md), the sample repository for the code submission
- [SDC Hackathon 2026 official handbook](/docs/sources/sdchack.my/handbook.md), section 8, which sets the declaration requirement and the rules on AI tools
