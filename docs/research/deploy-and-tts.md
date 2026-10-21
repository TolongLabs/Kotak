# Deploy Access and ElevenLabs TTS

Vendor docs read on 22 October 2026. Brackets cite [Sources](#sources).

Contents:

1.  [Vercel Hobby](#vercel-hobby)
1.  [Cloudflare Workers](#cloudflare-workers)
1.  [Replit](#replit)
1.  [GitHub Actions](#github-actions)
1.  [Deploy Recommendation](#deploy-recommendation)
1.  [ElevenLabs Models](#elevenlabs-models)
1.  [Credits and Limits](#credits-and-limits)
1.  [Rights and Voices](#rights-and-voices)
1.  [TTS Recommendation](#tts-recommendation)
1.  [Sources](#sources)

## Vercel Hobby

- Private org repos fail: "You cannot deploy to a Hobby team from a private repository in a GitHub organization" [1].
- Only the owner ships: "the commit author must be the owner of the Hobby team" [1].
- Public repos: Not confirmed. "Collaboration is free for public repositories" [2]. A 16 October guide says "only the account owner can trigger deployments" [3].
- The official Actions guide uses a `VERCEL_TOKEN` secret [4]. It never mentions commit authors. Token deploys avoiding the block: Not confirmed.
- Hobby is "non-commercial personal use only" [5]. Hackathon use: Not confirmed.
- Hono needs "zero configuration" [6]. The Bun runtime is "in Beta on all plans" [7].

## Cloudflare Workers

- Deploy with `cloudflare/wrangler-action@v4`, using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets [8]. The token uses the "Edit Cloudflare Workers" template [8].
- One Worker serves the Vite build and the API with `not_found_handling = "single-page-application"` and `run_worker_first = ["/api/*"]` [9].
- The API runs on the Workers runtime, not Bun [10].
- Free plan: "100,000/day" requests and 10 ms CPU per request, excluding network waits [11].
- "Requests to static assets are free and unlimited" [12].
- Workers Builds deploys "every time you push a change," with no documented author check [13].

## Replit

- Apps grant "Publisher: Can edit and publish the app." and "Editor: Can edit the app, but can't publish it" [14].
- Starter "Includes 1 free published app. The deployment expires after 30 days" [15].
- Publish API, CLI or GitHub trigger: Not confirmed; the docs show none [16].

## GitHub Actions

- "Write access to the repository is required" to run a workflow manually [17].
- "Secrets are not passed to the runner when a workflow is triggered from a forked repository," except `GITHUB_TOKEN` [18].

## Deploy Recommendation

Use Cloudflare Workers with GitHub Actions. One Worker serves the React build and the Hono API. The workflow runs on push to `main` and on `workflow_dispatch`. Any member with write access ships by merging to `main` or clicking "Run workflow". One-time step: the Cloudflare account owner creates an "Edit Cloudflare Workers" token and saves it, with the account ID, as repository secrets.

## ElevenLabs Models

- `eleven_v4` launched on 28 September 2026 [19]. It is the "most emotive model yet" [20]. Create speech and Stream speech accept it [21].
- `eleven_v4_turbo` has "median inference latency of ~100 ms" [22]. Docs list it only on the dialogue WebSocket, with one voice [23][24].
- `eleven_flash_v2_5` is the "fastest speech synthesis model", at ~75 ms [24]. `eleven_v3` is older [24].
- v4 and v4 Turbo take audio tags such as `[whispers]` and `[laughs]` [22][24].
- v4 covers 90+ languages. Flash v2.5 covers 32. Both include English and Malay [24].

## Credits and Limits

- Text to speech costs "1 credit per character" [20]. v4 "uses the same credit pricing" [22]. Flash and Turbo API calls cost "between 0.5 and 1 credit per character" [20].
- Budget: 34,000 credits buy about 34,000 characters on v4. Flash or v4 Turbo buys 34,000 to 68,000 characters.
- Not confirmed: the API rate on the team's plan. The API price page bills "in US dollars, not credits" [25].
- Avoid voices with a 2x credit multiplier [26].
- Stream with `POST /v1/text-to-speech/{voice_id}/stream` and always send `model_id` [27].
- Formats include MP3, Opus and PCM. The default is `mp3_44100_128` [27].
- Concurrency: Starter 3 (Flash 6), Creator 5 (Flash 10) [24].
- v4 latency, v4 concurrency and rate limits: Not confirmed.

## Rights and Voices

- You "retain all rights" to your Output [28]. No clause forbids caching. Explicit permission: Not confirmed.
- Free plans need "elevenlabs.io" or "11.ai" in the title [29]. Paid plans include a commercial license [29].
- The key's plan: Not confirmed.
- Free-tier keys cannot use library voices via the API [26]. Malaysian or Southeast Asian English voices: Not confirmed.
- Voice Design returns three previews and charges only for preview text [30]. Its examples include "A cute little squeaky mouse" [30].

## TTS Recommendation

Design the cat voice with Voice Design. Pre-generate fixed lines with `eleven_v4` and audio tags, and serve the MP3s as static assets. Generate live lines in the Hono API with `eleven_v4_turbo` over the dialogue WebSocket. Fallback: stream `eleven_v4` over HTTP. Keep the key in a Worker secret [31], never in client code [32]. Scope it to text to speech with a credit quota [32].

## Sources

1.  [Vercel Git](https://vercel.com/docs/git), 2026-09-18
2.  [Vercel collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration), 2026-03-13
3.  [Vercel commits](https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel), 2026-10-16
4.  [Vercel Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel), 2026-10-16
5.  [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines), 2026-09-14
6.  [Vercel Hono](https://vercel.com/docs/frameworks/backend/hono), 2026-08-10
7.  [Vercel Bun](https://vercel.com/docs/functions/runtimes/bun), 2026-08-24
8.  [Workers Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), 2026-10-18
9.  [Workers SPA](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), 2026-10-12
10. [Workers Hono](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/), 2026-04-23
11. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), 2026-10-12
12. [Assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), 2026-04-23
13. [Builds GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/), 2026-10-15
14. [Replit access](https://docs.replit.com/teams/identity-and-access-management/groups-and-permissions)
15. [Replit costs](https://docs.replit.com/billing/deployment-pricing)
16. [Replit publishing](https://docs.replit.com/features/publishing/overview)
17. [Manual runs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
18. [GitHub secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
19. [Changelog](https://elevenlabs.io/docs/changelog), 2026-09-28
20. [Pricing](https://elevenlabs.io/pricing)
21. [v4 help](https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/what-is-eleven-v4)
22. [Eleven v4](https://elevenlabs.io/v4)
23. [Socket comparison](https://elevenlabs.io/docs/eleven-api/guides/how-to/websockets/tts-vs-ttd-websockets)
24. [Models](https://elevenlabs.io/docs/models)
25. [API pricing](https://elevenlabs.io/pricing/api)
26. [Voice Library](https://elevenlabs.io/docs/eleven-creative/voices/voice-library)
27. [Stream speech](https://elevenlabs.io/docs/api-reference/text-to-speech/stream)
28. [Terms](https://elevenlabs.io/terms-of-use), 2026-10-09
29. [Publishing rights](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)
30. [Voice Design](https://elevenlabs.io/docs/eleven-creative/voices/voice-design)
31. [Workers secrets](https://developers.cloudflare.com/workers/configuration/secrets/), 2026-10-15
32. [API keys](https://elevenlabs.io/docs/api-reference/authentication)
