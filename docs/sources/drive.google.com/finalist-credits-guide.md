# Finalist credits guide

The organisers' "SDC Hackathon: Finalist Credits Guide (3-in-1)", shared in the Finalist Drive on 26 October 2026 ([source PDF](https://drive.google.com/file/d/1vGWBtLZrlMI-sEbCp6IHW0qizI2aCSYj/view)). It covers the sponsor credits every finalist team gets, up to US$225 in total, with one page per sponsor. The Replit promo code is left out here; copy it from the source PDF or the [team portal](/docs/sources/sdchack.my/team-portal.md#replit-core).

Contents:

1.  [Credits at a glance](#credits-at-a-glance)
1.  [1. Replit](#1-replit)
1.  [2. Runpod](#2-runpod)
1.  [3. KrackedDevs](#3-krackeddevs)

## Credits at a glance

| Sponsor     | Per team | What it is                                           |
| ----------- | -------- | ---------------------------------------------------- |
| Replit      | US$100   | Replit credits or Pro plan                           |
| Runpod      | US$25    | Runpod credits                                       |
| KrackedDevs | US$100   | AI API credits, as five US$20 keys, one per teammate |

## 1. Replit

US$100 in Replit credits or a Pro plan for your team. Redeem it with the hackathon promo code, then switch off auto-reload so nothing is ever charged to your card.

The three steps condense the [Replit Core subscription guide](/docs/sources/docs.google.com/replit-core-subscription-guide.md), and the [video guide](https://youtu.be/gwdVE5ReBJk) is the same walkthrough:

1.  **Redeem the subscription.** On the Replit dashboard, click **Upgrade your plan** and select the **Core** plan. At checkout, enter the promo code and click **Apply**. Check the total due is **$0.00**, then complete checkout with your preferred payment method.
1.  **Disable auto-reload (important).** On the **Auto-reload** screen of the onboarding that follows, switch auto-reload **off**, then click **Continue**. This prevents automatic top-ups and unexpected charges if you go over your plan’s limits.
1.  **Cancel auto-renewal.** Open **Settings** (gear icon) › **Billing**, scroll to the bottom, click **Cancel subscription**, choose a reason and confirm with **Cancel subscription** again. The Google Doc guide adds a **Continue to cancel** click before the reason. You keep the Core plan until the end of your billing cycle.

"Do steps 2 and 3 straight away. A card is needed at checkout, so switching off auto-reload and auto-renewal is what keeps the plan free."

## 2. Runpod

US$25 in Runpod credits for your team, for GPU compute: running or fine-tuning models, hosting an inference endpoint, or batch jobs your laptop can't handle.

**How to claim**: follow the [video guide](https://youtu.be/Z9n6hLEhMMQ), which walks through setting up Runpod and claiming the credit. Agree as a team whose account holds the credit before you start, so it is all in one place.

**Make it last**:

- **Pods charge for as long as they run.** Stop or terminate pods as soon as you finish a session, and before you sleep.
- **Storage keeps billing.** A stopped pod's volume disk is still charged. Terminate pods you no longer need, and keep only what you must in network volumes.
- **Pick the smallest GPU that works.** Prototype on a cheaper card, then move up only for the final run.
- **Consider Serverless** for a demo endpoint: you pay only while requests are being processed, not while it sits idle.
- **Keep your API key private.** Never commit it to your repository; use environment variables.

"Check your balance during the hackathon. Once credit runs out, running pods stop. Plan your heavy jobs early so a stopped pod doesn't break your live demo."

## 3. KrackedDevs

US$100 of AI API credit per team, as five personal US$20 keys, one for each teammate. Keys work with any OpenAI-compatible tool and stop when the budget or expiry runs out; the budget does not reset.

1.  **Sign up and join the guild.** Go to krackeddevs.com, click **Login** (GitHub, Google or email), choose your username and click **Continue**. Only then open the **guild invite link** from the organisers. You are in when the button reads **Leave guild**.
1.  **RSVP to the event (this is what gets you a key).** Open the hackathon event and click **RSVP to Event**. It should change to **Cancel RSVP**. Do not press it again. **All five teammates must RSVP.**
1.  **Find your key.** When it is issued, you get a notification. Open **Profile › API KEY**, click **Show key**, then **Copy**. Copy the Base URL and Model the same way.
1.  **Connect your key.**
    - **OpenCode**: add a `krackeddevs` provider to `~/.config/opencode/opencode.json` with the Base URL below, and keep your key in the `KD_API_KEY` environment variable.
    - **VS Code (Kilo Code)**: on your key card, click **Download setup file**, run it with Node.js, then restart VS Code.
    - **Anything else** (Cursor, Cline, Python): choose "OpenAI-compatible" and enter the three values below.

| Setting  | Value                                                       |
| -------- | ----------------------------------------------------------- |
| Base URL | `https://litellm.rapidscreen.io/v1`                         |
| API key  | Personal, starts with `sk-`. Shown only on your own profile |
| Model    | As listed under "What this key can use" on your key card    |

"Treat your key like a password. Never share it or commit it to a repo; if it leaks, tell the organisers." A **401** means a wrong or expired key, and a **400** means the model is not on your key.
