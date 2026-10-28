# Workshop 3 meeting chat

What attendees typed in the Zoom meeting chat during SDC Hackathon 2026 Workshop 3, Runpod's "From Text to Decisions: Building AI Applications with Structured Outputs" with Jessica Garson Beauchemin, on 21 October 2026, with answers to the questions they asked. It's the chat export in the workshop's [Drive folder](https://drive.google.com/drive/folders/1qOaWdgpXpzrra9jWBZNN4GW63zskvWQk). The [transcript](transcript.md) covers what was said, the [slides](slides.md) what was shown, and [Workshop 3 resources](resources.md) the handouts. Answers are synthesised from the transcript (cited by time from the start of the recording, about 9:23 PM), the slides (cited by number), and the organisers' and Jessica's replies in this chat.

Messages are in time order by Zoom's timestamps, in MYT, with thread replies straight after the message they answer. The prompt and shell commands Jessica pasted are kept verbatim as code blocks. Emoji reactions to messages are left out; nothing else is removed, as the chat has no meeting links, passcodes or codes. "SDC Hackathon Admin" and "Jason_SDC Hackathon Admin" are the same organiser, Jason, who changed his Zoom name during the session. The recording's start time comes from Jessica's posts: her link to the workshop code arrived at 10:04:43 PM, as she said she was sharing it at 00:41:46 in the recording, and the deploy prompt at 10:26:58 PM, as she said she was pasting it, about 20 seconds into her turn at 01:03:37.

Contents:

1.  [Messages](#messages)

## Messages

**[9:51 PM] Jessica Garson Beauchemin:** Hi all! Excited to be here!

**[9:52 PM] SDC Hackathon Admin:** Hi Jessica!

**[9:53 PM] Jessica Garson Beauchemin:** No worries! Excited to be here

**[10:02 PM] LIM XIN JIE:** yes _(Jessica had asked whether everyone could see her screen, 00:39:37)_

**[10:02 PM] XIANGYU CHEN:** yes

**[10:03 PM] KitaHack:** my first time _(Jessica had asked who had heard of Runpod before, 00:40:24)_

**[10:03 PM] LIM XIN JIE:** same

**[10:03 PM] Meir:** same

**[10:03 PM] XIANGYU CHEN:** same

**[10:04 PM] Jessica Garson Beauchemin:** https://github.com/runpod/openjev-serverless/blob/main/examples/article_review.py

**[10:05 PM] Jessica Garson Beauchemin:** https://www.runpod.io/blog/how-to-deploy-openjev-on-runpod-serverless

**[10:07 PM] LIM XIN JIE:** no _(Jessica had asked who had heard of Runpod Serverless, 00:44:13)_

**[10:07 PM] Eya Hia:** Not yet

**[10:07 PM] SDC Hackathon Admin:** i do!

**[10:10 PM] LIM XIN JIE:** jev _(Jessica had asked who had heard of decision models, 00:46:44)_

**[10:10 PM] SDC Hackathon Admin:** jev!

**[10:10 PM] KitaHack:** yesss especially jev

**[10:10 PM] YieXianTan:** jev

**[10:17 PM] SDC Hackathon Admin:** https://github.com/runpod/openjev-serverless/blob/main/examples/article_review.py https://www.runpod.io/blog/how-to-deploy-openjev-on-runpod-serverless just to reshare today's resources for newcomers

**[10:18 PM] LIM XIN JIE:** for one team only have 25 doller for runpod it is enough run until competition end?

**[10:20 PM] SDC Hackathon Admin (thread reply to LIM XIN JIE):** Should be, depending on how you manage it. i'd suggest to not leave pods running when you dont use it, so ensure to terminate a pod before going to sleep.

- **Answer:** Yes, if you manage it: terminate pods when you aren't using them (the admin's reply in this chat, 10:20 PM). Jessica added that a team that needs more can tell the admins, and Runpod is happy to provide more credits (00:59:33). The workshop's H100 80 GB endpoint costs about $4.79 an hour while a worker runs, and "A few dollars covers this tutorial" (slide 18).

**[10:21 PM] LIM XIN JIE:** ok thanks

**[10:22 PM] Lian Xin Yi:** do I need to leave the pods running during the judging session??

- **Answer:** Only if your project needs Runpod running to work; otherwise Jessica terminates hers (01:00:15). She added that Serverless, the subject of the workshop, is a different product from pods (01:00:15): its workers scale to zero when no requests arrive, so you pay only while they run (slide 11).

**[10:22 PM] Jessica Garson Beauchemin:** https://github.com/runpod/runpod-mcp _(the Runpod MCP server, 00:58:32)_

**[10:26 PM] Jessica Garson Beauchemin:** _(the deploy prompt she pasted into Claude Code, 01:03:37; also on slide 31)_

```text
Deploy OpenJev on Runpod Serverless using the image ghcr.io/brandonbondig/openjev-worker@sha256:1f95a727a3de6d0a29808f59d89b49424f4d4bc78c871f5080052abb4105424d (use this exact digest, not the latest tag). Create a load-balancer endpoint (not queue-based) named openjev with:
- One H100 80 GB per worker (OpenJev's measured setup is one 80 GB GPU with native FP8, so no A100 fallback). Look up the H100 GPU pool ID from the Runpod catalog rather than guessing it.
- Environment variables PORT=3000, PORT_HEALTH=3001 and HEALTH_CHECK_PATH=/
- A 60 GB container disk
- Expose HTTP ports 3000 and 3001 in the container configuration
- Active workers 0, maximum workers 1, and an idle timeout of 300 seconds
- Request count scaling (load balancer endpoints don't support queue delay scaling)
- FlashBoot on (the API defaults it to off, unlike the console)
Tell me the hourly price before you create anything. When it's done, give me the endpoint URL and a curl command that sends a test request to `/v1/systemone`.
```

**[10:29 PM] YieXianTan:** So the runpod is more like a company hosting the GPU to end-user then the end-user can use any LLM model inside the runpod is my understanding correct?

**[10:35 PM] SDC Hackathon Admin (thread reply to YieXianTan):** yes, pods is that! you can run any open source models inside, and there's also public endpoints on runpod which mostly hosts closed source models readily accessible as an API

- **Answer:** Broadly yes. Runpod is a cloud compute company focused on GPUs: you can host new open models yourself, on Serverless or on a pod, and for some of the bigger models Runpod runs public endpoints (01:10:07). Reading out the admin's reply, Jessica added that whether a model gets a public endpoint is mostly a question of its size (01:11:53).

**[10:34 PM] Jessica Garson Beauchemin:** _(setting the environment variables and running the repository's cURL example, slide 33)_

```shell
export RUNPOD_API_KEY="YOUR_API_KEY"
export ENDPOINT_ID="YOUR_ENDPOINT_ID"
bash examples/curl.sh
```

**[10:34 PM] Jessica Garson Beauchemin:** _(the readiness check, 01:08:22; slide 34)_

```shell
ready=0
deadline=$(( $(date +%s) + 1200 ))
while [ "$(date +%s)" -lt "$deadline" ]; do
  resp=$(curl -s -m 130 -w '\n%{http_code}' \
    -H "Authorization: Bearer $RUNPOD_API_KEY" \
    "https://$ENDPOINT_ID.api.runpod.ai/v1/version")
  code=${resp##*$'\n'}
  body=${resp%$'\n'*}
  if [ "$code" = "200" ]; then ready=1; echo "Worker ready."; break; fi
  if [ "$code" = "401" ] || [ "$code" = "403" ]; then echo "HTTP $code: check RUNPOD_API_KEY and its endpoint permissions."; break; fi
  echo "Not ready yet (HTTP $code): ${body:-(no response)}"
  sleep 10
done
[ "$ready" = "1" ] || echo "Worker not ready. Check the messages above and the endpoint's logs before sending requests."
```

**[10:34 PM] Jessica Garson Beauchemin:** _(the cURL request, 01:09:11; slide 35)_

```shell
curl -sS -m 60 https://$ENDPOINT_ID.api.runpod.ai/v1/systemone \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openjev","state":"Review: The sound is great, but the battery barely lasts a day.","questions":{"likes_sound":{"type":"noul","instructions":"Does the reviewer like the sound quality?"}}}' \
  -w "\n"
```

**[10:35 PM] YieXianTan:** thank Jessica and hackathon admin

**[10:36 PM] Jessica Garson Beauchemin:** https://github.com/runpod/openjev-serverless/blob/main/examples/article_review.py _(the Python example, 01:12:54; slide 37)_

**[10:39 PM] Jason_SDC Hackathon Admin:** https://discord.com/invite/runpod _(Runpod's community Discord, 01:15:40; slide 40)_

**[10:40 PM] Hussein Al-manifi:** Can i train my own model within the serveless/pod ?

- **Answer:** Use a pod for training. The Runpod blog has articles on it, and Brendan from the Runpod team, Finley on Discord, has videos about it; bring-your-own-model projects have worked well at other hackathons (01:18:09). Jason's 10:46 PM message in this chat also puts training under pods.

**[10:41 PM] jh:** I dont really get the idea but is it like I can deploy an AI using runpod and integrate it to my website?

- **Answer:** Yes (01:19:03). That's what the workshop did: it deployed an open model, OpenJev, as a Runpod Serverless endpoint with its own URL, then called it over HTTP with cURL and Python (slides 35 to 38).

**[10:42 PM] jh:** aww alright thankss!

**[10:43 PM] Jessica Garson Beauchemin:** https://www.runpod.io/blog

**[10:44 PM] Jessica Garson Beauchemin:** https://www.youtube.com/channel/UCrrgg7pwLmCfpF4nlj1cg0Q _(Runpod's YouTube channel, 01:19:36)_

**[10:44 PM] Jason_SDC Hackathon Admin:** You mentioned about the extra credits request, what is the requirement we could get another set of credits?

- **Answer:** It's case by case, depending on the project: tell the hackathon admins, who are in touch with Runpod. Runpod doesn't want credits to be the issue (01:21:23; 00:59:33).

**[10:45 PM] Jason_SDC Hackathon Admin:** alright got it, thanks!

**[10:45 PM] XIANGYU CHEN:** Sorry, but what’s the difference between Pods and Serverless when I signed up my account.

**[10:47 PM] XIANGYU CHEN (thread reply):** Oh, I see, thank you!

- **Answer:** Serverless is pay-as-you-go compute: an endpoint whose workers start when requests arrive and scale to zero when idle (slides 10 and 11). Pods are more fixed, come with templates, and let you choose CPU or GPU (01:22:56). Jason, in this chat at 10:46 PM: pods are generally for experiments, batch inference and training, and Serverless is probably what you want if you're using open-source models and just want to run one and integrate it with your app.

**[10:46 PM] Jessica Garson Beauchemin:** https://github.com/viktorinkov/HackMIT-2026 _(the recent hackathon project that used Runpod, 01:19:36 and 01:22:42)_

**[10:46 PM] Jason_SDC Hackathon Admin:** pods generally is for experiments, batch inference, training, serverless is probably what you're looking for if you're using open source models and just want to run it and integrate with your app

**[10:47 PM] Jason_SDC Hackathon Admin:** We're going to have a photo session after the Qna Session ya 😄👍

**[10:50 PM] YieXianTan:** Thank Jessica and admiin
