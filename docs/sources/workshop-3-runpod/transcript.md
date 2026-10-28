# Workshop 3 transcript

What was said at SDC Hackathon 2026 Workshop 3, run by Runpod, a tech premium sponsor, on Zoom on 21 October 2026 from about 10:00 PM to 10:51 PM MYT. It was [announced](/docs/sources/discord.com/announcements.md#workshops-on-21-october) as "From Text to Decisions: Building AI Applications with Structured Outputs", for 10:00 PM to 11:00 PM. Jessica Garson Beauchemin, who leads Developer Relations at Runpod, explained Runpod Serverless and decision models, deployed OpenJev, an open decision model, as a Serverless endpoint by prompting Claude Code through the Runpod MCP server, and showed how to query it with cURL and Python for structured answers, then took questions from the chat. The deck is in [Workshop 3 slides](slides.md), the handouts in [Workshop 3 resources](resources.md), and what attendees typed in the [meeting chat](chat.md).

Times count from the start of the organisers' recording, "video1345945192.mp4" (1:27:59) in the workshop's [Drive folder](https://drive.google.com/drive/folders/1qOaWdgpXpzrra9jWBZNN4GW63zskvWQk). It started at about 9:23 PM, a time worked out by matching the links Jessica posted in the chat to the moments she says she's posting them. The first 37 minutes are a silent waiting screen and then a loop of sponsor videos, and the workshop proper starts at 00:37:19, about 10:00 PM. The text merges two machine transcriptions, an OpenAI gpt-transcribe pass and a whisper-1 pass, checked against each other and the screen. Doubtful words are marked _(as heard: "...")_, and fillers and false starts are trimmed. Attendees asked their questions in the Zoom chat, which isn't in the recording; Jessica read most of them out without the askers' names, and the [meeting chat](chat.md) has them with their askers and answers.

Contents:

1.  [Speakers](#speakers)
1.  [Messages](#messages)

## Speakers

- **Sponsor video**: the sponsors' promotional videos, which the organisers played in a loop before the start. Only the Runpod and Alpha Red Group videos are narrated.
- **Emcee** (Jason, Zoom name "SDC Hackathon Admin", later "Jason_SDC Hackathon Admin"): the organiser who hosted. House rules and introduction, 00:37:19 to 00:38:37; thanks and the group photo, 01:25:58 to 01:27:43. Jessica names him at 01:21:23 and 01:23:25.
- **Jessica** (Jessica Garson Beauchemin): leads Developer Relations at Runpod (slide 03), and also spoke for Runpod at the [opening briefing](/docs/sources/opening-briefing/transcript.md). Talk and live demo, 00:38:39 to 01:17:10, then questions from the chat until 01:25:55. Both transcriptions misheard her surname, as "Garson-Boshman" and "Garson-Bosherman", and Jason introduced her as Jessica Garson.

## Messages

_From 00:00:00 to about 00:18:00 the recording shows only the organisers' camera-off tile, "SDC Hackathon Admin", with no sound. The organisers then shared a Drive folder named "Sponsor Promotional Video" and, from about 00:22:00, played its four videos in a loop: Runpod, Aiversecity, Alpha Red Group and KrackedDevs. The sound starts at 00:24:23, partway into the Runpod video, and the loop runs until about 00:37:00._

**[00:24:23] Sponsor video (Runpod):** ...model? You need GPUs. Serving it? You need an inference pipeline. Scaling it? That's a whole other problem. Most teams use three or four platforms just to go from idea to production. Runpod replaces all of that. The GPUs you need, on demand, by the hour, running in seconds, not days. Pick your config and you're building. Deploy models as serverless endpoints. Autoscale to meet demand, scale to zero when idle. Cold starts under 200 milliseconds. Your users don't wait. You don't pay for downtime. Clusters, instant or reserved. Run distributed training across GPUs at scale. One account, one platform. Dev to production without replatforming. One million plus developers. 30 plus regions worldwide. SOC 2 Type 2, HIPAA and GDPR compliant. Runpod, the AI developer cloud. Start building at runpod.io.

**[00:25:44] Sponsor video (Alpha Red Group):** Across travel, hospitality and finance, millions of digital interactions depend on systems working together. But fragmented platforms and legacy dependencies can make connected, seamless services difficult to deliver. Alpha Red Group helps enterprises bring these complex digital ecosystems together. ... Alpha Red Group, connecting complex systems, powering what's next.

_The full Alpha Red Group narration is in the [opening briefing transcript](/docs/sources/opening-briefing/transcript.md), where the same video played. The Aiversecity video has music only, and the KrackedDevs video played silently._

**[00:37:19] Emcee:** Okay, hi everyone. Good evening, and welcome to tonight's SDC Hackathon 2026 workshop with Runpod. A few quick rules for this Zoom. Please stay muted unless you're invited to speak. Second, please keep the chat strictly for questions and discussions about the workshop. And lastly, please have your Runpod account ready and open. If your team has received a Runpod credit code from our website portal, please redeem it at Runpod before the demo starts, so you are ready to build.

**[00:37:56] Emcee:** Tonight's session is about from text to decisions: building an AI application with structured output. Most AI apps break at the same point, when your model writes a nice paragraph and your code can't do anything with it _(as heard: "without it")_. So tonight you will learn how to get answers back in a fixed format, so your app can act on it. Our speaker today is Jessica Garson, developer relations lead for the community at Runpod. So please give her a warm welcome. Jessica, the floor is yours.

**[00:38:39] Jessica:** Hi, thank you so much for being here. A couple of things. One thing that I should note is that I typically live in New York City, but I'm actually in San Francisco today. So I am in a hotel room and my Wi-Fi isn't as stable, so this may be more slide decks; my style is usually live demo. But I'm really excited to be here with y'all. Hold on one second while I try to share my screen.

**[00:39:07] Jessica:** Sorry, this always takes a second. Okay, cool. Hi. So today I'm going to be talking about deploying open source models on Runpod Serverless, and really this is just an example of what you could do with Runpod using our serverless endpoint. I was really excited about the Jev endpoints that came out recently, and I'm using that as the framing for today's workshop.

_Slide 02, "Agenda"._

**[00:39:37] Jessica:** So the agenda at a high level: we're going to get started, we're going to talk through what Runpod is, we're going to talk about what we need to get started. Also, can everybody see my screen and everything? Let me know if you can in the chat. I'm seeing some stuff come through, but maybe not as much as I would like. Okay, you all could see my screen. Great. Thanks, everybody.

**[00:40:03] Jessica:** So we'll be talking about what Runpod is, setting up, what Runpod Serverless is. We'll also be talking about what a decision model is, and what you need before you deploy, really just avoiding any mistakes. We'll spend some time deploying, then from there we'll make some requests, and then in the next steps we'll talk about what you could build.

_Slide 03, "Hi, I'm Jessica Garson Beauchemin"._

**[00:40:24] Jessica:** So, hi, I'm Jessica Garson Beauchemin. I lead developer relations here at Runpod, and my focus is on the community. So how many people here have heard of Runpod before? If you want to just type in the chat if you have, let me know. Okay, cool. Someone's first time. I tend to be very interactive and very conversational, so feel free to type in the chat.

_Slide 04, a video embedded in the deck, stayed paused on screen._

**[00:40:51] Jessica:** But Runpod is the AI developer cloud, and it is the platform that provides the infrastructure that AI developers need across the full life cycle: you could experiment, train, fine-tune and scale. Over one million developers, including myself, are building on Runpod, and it's a cloud platform specifically built for AI workloads. So Runpod is, for me, the fastest path from AI experiment to production.

**[00:41:23] Jessica:** So, what you need to get started today. Before we get into that, a couple of different things. Code from the workshop can be found here, at github.com/runpod/openjev-serverless. It is the same code from an article, so let me just share that in the chat, just so that you have it here. And then also, it is inspired by an article, runpod.io/blog/how-to-deploy-openjev-on-runpod-serverless, so I'm going to drop that in here too. I'm actually Google searching for my own blog post. Cool. All right, found it. I'm going to drop the link in there. So this should be helpful for getting started today.

_Slides 05 to 07. Both links went into the [meeting chat](chat.md) as she spoke, at 10:04 and 10:05 PM._

**[00:42:38] Jessica:** Dropping that in here as well. Awesome. So before we get started... hello? All right, sorry, I think there's some background noise that just came up. But if everybody can keep their phone muted. Cool, thanks so much.

**[00:43:03] Jessica:** Before we get started, what you're going to need is a Runpod account. Today we're going to be running an endpoint on an H100 80 GB, and you're only billed while the worker is running. You all should have gotten a Runpod account; if you didn't, make sure that you talk to the hackathon admins. You will also need an API key, and you can create one in the Runpod console under Settings, API Keys. From there, you're going to need npm installed, because we're going to be using the AI coding assistant. You can use Claude Code; I use Codex and Claude Code interchangeably, you could use either one. You can also use Python 3 with the requests library installed; install it with `pip install requests`. You'll also need a terminal for sending requests and running examples; we're going to be using cURL for some quick tests. You will also need a text editor of your choice for editing a Python code sample. And this workshop assumes that you have basic familiarity with JSON and HTTP requests.

_Slide 08, "Prerequisites"._

**[00:44:13] Jessica:** How many people have heard of Runpod Serverless? If you have, if you could type it into the chat. Okay, I'm not seeing anybody typing, so I'm going to assume that nobody here is familiar with Runpod Serverless, which is totally okay. Cool. All right. If somebody is familiar with it, and you want to type what it is into the chat, that would be cool.

**[00:44:37] Jessica:** But really, the way that I think about Runpod Serverless is that it is a cloud computing platform that lets you serve AI models for inference and run other compute-intensive workloads without managing servers. You really only pay while the workers run, and workers scale down to zero after a short idle timeout when there are no requests. A couple of different things to think about with Runpod Serverless: it serves AI models for inference, and you can also run other compute-intensive workloads without provisioning or managing servers. Workers scale to zero when no requests arrive; startup and model loading are also billed; and Runpod starts workers when requests arrive and stops them when they're idle. So at a high level, the way that I like to think about it is that it's compute without servers to manage, you pay only while the workers run, and workers run code in a container.

_Slides 09 to 11._

**[00:45:39] Jessica:** And then from here, think about endpoints as the access point. Really what you're doing is setting up an endpoint, and an endpoint is what you talk to. It gives a URL for sending requests, and each one has its own GPU, scaling and settings. There are two endpoint types. A queue-based endpoint uses a handler function and a request queue, and a load balancer endpoint routes requests straight to your own HTTP server. So this is kind of like FastAPI or Flask, if you've ever used those; that's where I come from personally. So the choice is to write a handler or bring a server. And cold starts are the trade-off. If a request arrives and no worker is free, it waits while one starts and loads the model. There's this thing called a cold start that we'll talk about, and it takes a little bit of time at some points, but you can reduce it with things like cached models, FlashBoot, or setting active workers above zero.

_Slide 12, "Serverless core concepts"._

**[00:46:44] Jessica:** So today we're going to be talking about OpenJev. This is based on the Jev models that were a little bit popular about a month ago. They came out and everybody was talking about them, and this was around the time I was asked to do this workshop, so this was the thing that I was most excited about at the time. OpenJev is a 27 billion parameter decision model, and it runs on a single GPU. How many people here have heard of decision models? Put it in the chat if you have. Okay, a couple of people have. Yeah.

_Slides 13 and 14._

**[00:47:22] Jessica:** So OpenJev is a variant of Jev. But at the end of the day, a decision model is an AI or analytical system that evaluates a decision, or a given situation rather, and returns a structured, predefined choice, score or probability distribution rather than generating freeform text. These models are built for fast tasks like routing support tickets, flagging safety risks, or selecting tools. When you think about it, they have a couple of different things. They have an input state: the software hands the model a specific block of context, like an email, a user command or a transaction record. From there, there are some bounded questions: the model will answer fixed questions using shapes like yes or no, and it creates this gate, so you have a choice of options or a numeric score. And then you have calibrated probabilities: instead of outputting just prose, it returns a selected answer along with a confidence percentage for each potential outcome.

**[00:48:30] Jessica:** Previously, chat models would answer in prose; they would just answer things. If you asked a chat model for a star rating, you would get a different shape of answer every time, and this is the problem that decision models are aiming to resolve. Each question that you send has a type, and the answer always comes back matching the same shape, so there's no long text to parse. Every question carries a type. Output tokens are always zero, because the model returns probabilities, not text.

_Slides 15 and 16: a chat model answers the same rating question three ways, while a decision model answers in the shape asked for, a `choice`, a `noul` (yes or no as a probability) or a `score`._

**[00:49:07] Jessica:** So let's talk a little bit about what you need before you deploy. When you click deploy, billing starts when the worker starts, and so we'll use loading minutes for the next two slides. One of the things that you want to think about is leaving FlashBoot on and then clicking deploy as well. What you'd want to have is zero active workers, so you only pay while one is running. So I usually set that to be one max worker, active workers, 300 seconds, and then usually this should be about 4.75 _(as heard: "475"; slide 18 gives $4.79 per hour for an H100 80 GB)_. I think that was run at the end of September, when I first started prepping for this.

_Slides 17 and 18._

**[00:49:51] Jessica:** And then you pay from the worker's start, including model load. So billing will include the setup and model load, not just the time spent answering questions, and this is why idle timeout matters. A 300 s idle timeout _(as heard: "B300's idle timeout")_ keeps the worker warm for the cURL and Python to run on one cold start. And one of the things that I think about when I'm doing this type of thing is cold starts. They take a couple of minutes, and usually our documentation recommends that you check the readiness first. So that's definitely something to think about. And FlashBoot is on; it doesn't speed up the first boot.

_Slides 19 and 20._

**[00:50:39] Jessica:** And then there are a couple of different places where mistakes can cost real GPU time. One: a lot of times you'll set the ports, but they're not exposed, so it'll return a 502 and you'll pay for more time than you need. The fix is that you can expose the ports, set the three environment variables, and then deploy. Then: the endpoint is created as a queue, and the readiness check says "not allowed for QB API", but waiting never really fixes it; you can stop the loop and create a new endpoint with the load balancer type. And there have been some issues that I've faced while creating this with the default timeout, so setting and increasing that has really helped me as well.

_Slide 21, "Three mistakes cost real GPU time, each with a fix"._

**[00:51:32] Jessica:** There are two different types of endpoints that you can use: a load balancer for a sync API, and a queue for jobs. With the load balancer type, requests go straight to your web server. One call returns the answer; it errors _(as heard: "answers are")_ after about two minutes if no worker is ready, and you can poll `/v1/version` before you send. And then there's also a queue-based endpoint, where you submit a job and get a job ID, and a second call returns the result. A queued job waits for the worker to start, and you poll the status with the same job ID.

_Slide 22._

**[00:52:14] Jessica:** There are a couple of different things that are important to note about OpenJev in general. The benchmark that was given is based on its authors' 10,000-question benchmark. It has a non-commercial licence, so you might want to verify both before you're shipping, especially depending on what you're doing, just because of the licence type.

_Slide 23: OpenJev scored 84.2% on its authors' benchmark, and its weights are licensed CC BY-NC 4.0._

**[00:52:51] Jessica:** So let's talk about deploying and getting started. I think this is a great point: if you haven't logged into Runpod with the credits that you got, we can do that now, and I can show you a little bit of the console while we're all doing that. I'm trying to add in some interactivity; it's a little bit harder with a remote workshop. But let's go in and get started. You should have received a link from the hackathon organisers that has Runpod credits.

_Slide 24, "Deploying". From 00:53:20 to 00:54:40 the screen showed the Runpod console: the home page and the Serverless page, with an endpoint named openjev._

**[00:53:23] Jessica:** So let's go into the terminal. So I'm in here, and you can actually see my OpenJev endpoint here, and that I have some stuff running. If everybody wants to log in, I think this is the time where we will log in. I'm trying to make this interactive, just so you could follow along. Cool. Awesome. I'll give you all a minute. Let me know when it's a good time to continue on. And this is also a great time for any questions, if you have any.

**[00:54:28] Jessica:** Cool. Well, you should be in, so let's go on to the next. So, inside deploying. Now, from here, there are a couple of different settings if you were going to do it from the console. We're going to be doing it today using our MCP server, but if you are doing it from the console, there are a couple of settings that determine how OpenJev works. The endpoint type: you want to make sure that it is a load balancer and not a queue; a queue endpoint will fail. The container image that you're going to want to use is the OpenJev worker, pinned by the SHA-256 digest, which pins the tested version. Then there's the container disk: you want to set that to be 60 GB, and the model weights are about 30 GB in general. You want to also expose the HTTP ports; if you skip that, the worker will never receive the traffic, and that was an error that I made very early on. And then make sure you have the right environment variables: PORT 3000, PORT_HEALTH and HEALTH_CHECK_PATH. This tells the load balancer what ports to serve and does a health check.

_Slide 25, "Five settings decide whether the OpenJev deploy works"._

**[00:56:09] Jessica:** There are a couple of different hardware options available. The best way to do it is to use an H100 80 GB, and this is what's measured by the model card. I've used an A100 as well, but it's a little bit testy, and there are a couple of other options, but they have less memory, so that's just something to think about.

_Slide 26, "The H100 80 GB is the setup OpenJev measured"._

**[00:56:33] Jessica:** And you can do this, as I mentioned, inside the console. I've been liking using the MCP server a lot lately, just because it gives us a more agentic way of working, and it really allows for some more flexibility in what you can build. For the most part these days, I'm slowly moving over to being more agentic-first in my approach: instead of just using the console, I'll try to do everything from a more agentic-first workflow. And it's getting better every time I use it. When I first started working with Runpod in particular, I would point my agent at the MCP server and it was really hard; it would just spin around. That's a problem that we are really working on improving.

_Slide 27._

**[00:57:32] Jessica:** There are a couple of different ways that you can connect to the MCP server. You could do it locally, so it runs on your machine, and it can use an API key that you create and store. Or you can have it hosted, at https://mcp.getrunpod.io: you point your client at the URL and you can sign in with Runpod. I really like that, because there's nothing to install and no API key on disk. It's just really smooth and seamless, and I've really enjoyed working with it in that way. So we host it for you, and you can do all the authentication: you point your client at that URL, sign in with Runpod, and there's nothing to install, no API key on disk or anything like that.

_Slides 28 and 29._

**[00:58:32] Jessica:** From here, the easiest way to do this is to use the guided installer, which will detect what you have installed, ask you to configure, and write the config for you: `npx @runpod/mcp-server@latest add`. This offers the two connection methods, but I do encourage you, for this workshop, to use the one that's hosted. I can give you all a minute to catch up there, and I can drop into the chat some information on how to get started with that: the Runpod MCP server. I tend to use Claude for it.

_Slide 30 shows the installer command; she posted the [Runpod MCP server repository](https://github.com/runpod/runpod-mcp) in the chat. From about 00:59:20 the shared screen was blank, until she stopped sharing at about 01:01:00._

**[00:59:33] Jessica:** And then somebody asked a question about whether they need to keep all of the pods running during the judging session. I'm actually seeing a couple of questions, so I'm just going to answer all of them as you are all getting set up here. Somebody asked: for one team we only have $25 for Runpod; is that enough until the competition ends? Yeah, it should be, depending on how you manage it. If you need more, I'm in touch with your admin, so if there's a team that's like, "Oh my God, we're doing more", just let us know, and we're happy to provide more credits if needed. So thank you for that question.

**[01:00:15] Jessica:** Another question that came in: do I need to leave the pods on during the judging session? If you are using Runpod as part of your project and it needs it for that, then you do. If you're like, "I don't need that"... I always terminate my pods, and I actually tend to do it during this. One thing that's important to note is that serverless, what I'm talking about today, is a little bit different from pods; they're two different products. Serverless just allows you to create an endpoint that you can host your own off of. So that's something to think about and consider.

**[01:00:55] Jessica:** So I'm actually going to stop sharing my screen for a second; I'm actually just going to do it live for you. As always, live demos can be a little bit wild, but I think this one should be fun. At this point I'm going to start sharing my terminal. Let me just pull that up. All right, and now you should be seeing my terminal. Let me just make this a little bit bigger.

_From 01:01:20 to 01:06:00 Jessica shared her terminal, running Claude Code. Its MCP view listed 90 tools for runpod, such as list-endpoints, run-endpoint, get-job-status and stream-worker-logs._

**[01:01:31] Jessica:** From here, I'm just going to type `claude` in here, so we're going to enter into Claude, and then I'm going to check to see if the MCP server is installed, and it is. Let's take a look through a couple of the different options that we have with the MCP server. We have listing the endpoints, we can run endpoints, we have a lot of different options here: we could read the guides, read the journals. There are just a lot of options here. What I really like about our MCP server is it just allows me to connect in a more agentic way and really just get stuff up and running. The first time I did this, it was actually really fun for me, because I was like, "I want to play with OpenJev, can you deploy it for me?" And it's very similar to the prompt that I'm going to be using.

**[01:02:32] Jessica:** Of course, live demo: I think I have to log in again. So I'm going to log in one more time, because that's the way it always goes with live demos. Cool, so I'm just continuing in here. I don't think you should see this, but it's funny, I did rehearse this before. All right, I'm continuing back on. Yay for live demos. And I actually have to log in through my phone for my two-factor authentication. We can also use Codex if needed. Okay, I think I should be logged in. All right, cool, that did work.

**[01:03:37] Jessica:** All right, so from here, I'm going to go into the article and paste the prompt, and I'll paste that into the chat as well, just so that you all have the prompt. Now you can see Claude's up and running. You can see that it's finding the H100 pool right now: it's currently $4.79 _(as heard: "749")_ per worker, currently low stock. It's creating the endpoint right now. I'm actually interested to see, because I have a similar endpoint with the same name. Yay for live demos; it's going to be fun to see if it works.

_The prompt is on slide 31, and she pasted it into the [meeting chat](chat.md) at 10:26 PM. Claude Code found the H100 pool at $4.79/hr per worker and reported that an endpoint named openjev already existed._

**[01:04:36] Jessica:** Okay, so it was able to create that, and it gives me a test request. And then from here, it's like, "Oh, you already have one." So yeah, let's do a second one. So from here, it's calling Runpod, and we can see that it's going through things. This is also a great time for you to play around as well and try it on your own. And then if I wanted to delete it or run it... we can actually see that it created everything. It created a load balancer, it used the right image, it had one worker. And from here you can see everything up and running: you can see the cost and the endpoint ID. And then you can go in and create a new API key as well.

_After she typed "Lets do a second one", Claude Code created openjev-2 with the same settings and read them back in a table: load balancer type, the pinned image, one H100 80 GB per worker and the port variables. It hadn't sent the endpoint a test request._

**[01:06:06] Jessica:** Cool, so I'm going to stop sharing my screen that way, and go back into the slide deck.

**[01:06:30] Jessica:** So that was it: we deployed OpenJev on Runpod Serverless using a specific image, and we asked it to use the exact one, because that was the one I tested, and to name it openjev. From there, we asked for one H100 GPU per worker, rather than guessing it, and had the environment variables: PORT 3000, PORT_HEALTH and HEALTH_CHECK_PATH. It asked for a 60 GB container disk and exposed HTTP ports 3000 and 3001 in the container configuration. It set the active workers to zero, the maximum workers to one, and an idle timeout of 300 seconds, and requested count scaling, since load balancer endpoints don't support queue delay scaling. Then it made sure FlashBoot was on, and it had to tell me the hourly price before it created anything.

_Slides 30 and 31._

**[01:07:28] Jessica:** So that's a little bit about how you would go about getting everything up and running. If everything looks good, you can see here that I have this openjev that's starting, the openjev-2 that's starting, and this is the one we just created.

**[01:07:45] Jessica:** So from here, let's talk a little bit about how to start making some requests. The first thing that I usually do is set up my environment variables, so I can export the API key to be the API key. An easy way to do this is I can type in "API keys", and from there I can be prompted to create my own. So that's a little bit about how you can get started with that.

_Slides 32 and 33; at about 01:08:00 she searched the Runpod console for "API keys"._

**[01:08:22] Jessica:** So let's go back into the slide deck, and from there we can check the readiness. This is something that I typically do just to make sure: basically it creates a loop and allows me to see if everything is up and running. There's this concept of cold starts with Runpod, and it takes a while for things to get up and running, so I usually do this in the background while I'm doing something else, so that I can be like, "Oh, okay, cool, this is what's happening," and know when it's ready. So I don't have to make requests before my endpoint is ready to start accepting requests. I usually just check the readiness first, and I learned that from the Runpod documentation.

_Slide 34, "Checking readiness"._

**[01:09:11] Jessica:** And then from there, I can make a cURL request. From here I'm going to say: use OpenJev; review... I do a lot of sound art stuff, so the review is "The sound is great, but the battery barely lasts a day" _(as heard: "the battery lasts later")_; these are headphone reviews, I was thinking. And then you could do the questions, like `likes_sound`: the type can be `noul` _(as heard: "null")_, and the instructions are "Does the reviewer like the sound quality?" And then the response you should get back should look something like this. So let me actually send you all that cURL command.

_Slides 35 and 36: the cURL request, and a response giving `likes_sound` a `noul` of 0.9801 with zero output tokens._

**[01:10:07] Jessica:** Somebody asked a really good question: so Runpod is more like a company hosting the GPU to end users, and the end user can use any LLM inside Runpod; is my understanding correct? That's actually a really great question. For me, as I'm thinking about what Runpod is, that's one way of thinking about it. I use it a lot for that reason: whenever there's a new endpoint that comes out, I'm like, "Oh yay, I can host it." For some endpoints, I use serverless; for other ones, I could host it directly on my pod. There are some space configurations for other methods. For some of the bigger models, like Kimi K3 _(as heard: "Kimi 3, K3")_ that came out, and some of the other models, we actually have some public endpoints available. So it really just depends on the model and the size, and on the workflow that you're using. For Runpod, we're more of a cloud compute company that is focused on GPUs in general.

_From about 01:10:00 the screen showed the repository's README, then went blank until slide 37 came up at about 01:12:00._

**[01:11:21] Jessica:** So you should have a moment to start checking the readiness there, and after you've checked the readiness, to actually start going in. Let me make sure that you all have the readiness command in here, so you can play around with it, and let me put in the cURL request as well, so you all can follow along.

**[01:11:53] Jessica:** There's another way that we can get started, which is using Python code: you can combine both of those cURL commands into one Python script. So let's take a look at some Python code. I do see that there's something new coming in. And yes, I also see that someone responded: you can run any open source model, and there are also public endpoints, which are mostly closed source models. It really depends. For some of the newer open source models, our decision is all about size, when we think about it. And thank you to the hackathon admin too, because I'm learning some things as well here.

**[01:12:54] Jessica:** So let's go back in here, and let me at this point talk a little bit about the Python code. Inside our GitHub repository, if we go to examples, the article code can be found here. I'm just going to drop it into the chat as well. Basically we get started here by importing os, sys and time, and then we use the Python requests library; it's a favourite Python library of mine for making API calls. If you've set your environment variables, it picks those up, and if you don't have them, it's like, "Oh, I don't have that." From here, you can set your base URLs and pass in your API key. This is where we check the readiness to make sure that everything is available: this function, `wait_until_ready`, lets us go through and ask that. And then this `ask` function lets us send the text plus the typed questions to OpenJev, and that's the heart of where we're making the main API call.

_Slide 37, then from 01:13:20 to 01:15:00 `examples/article_review.py` in the [openjev-serverless repository](https://github.com/runpod/openjev-serverless/blob/main/examples/article_review.py)._

**[01:14:32] Jessica:** And then from there, the review is: "I bought these headphones for my commute. Sound is great, and the noise cancelling works really well on a train, but the battery barely lasts a day, and they hurt my ears after an hour." So you can set the questions in there, sentiment, recommends and rating, and then you get that back, and that creates the way that you get the results back. I've already dropped it into the chat, which is good.

**[01:15:15] Jessica:** If you run that in Python (for me, I actually have to type `python3`, depending on your setup), `python openjev_runpod.py` _(as heard: "openjev.py")_, what you get back is a more structured result. You'll get back "Worker ready", and that's just the initial readiness check. The sentiment is mixed, with a confidence of 98.71; for "recommends", it's going to be no, with the probability of yes; and then it gives you the rating back.

_Slide 38, "Python": "Sentiment: mixed (confidence 0.9871)", "Recommends: no (probability of yes 0.061)", "Rating: 3 stars"._

**[01:15:40] Jessica:** So there are a couple of next steps. I actually allowed for about 20 minutes for questions, and an extra five minutes just in case things went a little bit crazy. If anything comes up along the way, you have your hackathon... I think there's a Runpod channel, and your hackathon mentors can help you, but we also have our own Discord as well: discord.com/invite/runpod. That's a really great community; I'm a part of it, and I think one of the hackathon admins is a part of it as well. So if anything comes up along the way, or you want to talk or chat about things you're building, feel free to do that there.

_Slides 39 and 40._

**[01:16:26] Jessica:** Really an honour to be here today. One of the reasons I chose OpenJev in particular is that I think Jev models are really great for sustainability, and I know the theme of the hackathon is to build what matters. So I'm really excited to hear about what y'all are building, and to see what you build. This was just one example, one way that you could get started, and I hope that this is helpful today. I think we had 15 minutes allotted for questions and answers, and I think we're exactly there. So if anybody has any questions, please, please, please feel free to put them into the chat.

_For the rest of the Q&A the screen showed slide 38 or was blank, apart from the console tour at 01:24:20._

**[01:17:24] Jessica:** And I think we answered a couple that came through as we were going. One thing that I could talk about is the structured output. You might have noticed in my slides that there was a difference between the Python one and the Python code: it has this "Worker ready", the sentiment is mixed, and it's very structured, and that's a little bit different from the raw payload. The reason I did it that way was that I just sometimes like my output to be a little bit more structured, especially if I'm working with Python; it's really easy to parse the JSON. So that's one thing that somebody was asking me about.

**[01:18:09] Jessica:** And somebody asked: can I train my own model within serverless or a pod? I would probably use a pod for that. There are a couple of articles on our blog that get at that, and I think Brendan from our team, known as Finley on Discord, has a couple of videos about that too. A lot of people do that. I've actually seen at other hackathons in particular that a lot of people have used the bring-your-own-model approach, and it works really well. There was another project, from a hackathon at MIT in Boston, that used Runpod under the hood, which was pretty interesting.

**[01:19:03] Jessica:** Somebody also asked a really great question, and I always love the ones that are a little bit spicy: "I don't really get the idea, but is it like I can deploy an AI using Runpod and integrate it into my website?" Yeah: the example that I showed today was that I just used an open model and deployed it using Runpod, and that's just one of the examples. But yes, I think you do get the idea, because that is something that you can do with it. I really do appreciate that question; that was a great one. I hope I'm answering all these questions.

**[01:19:36] Jessica:** I can also drop a couple of resources into the chat. I'm really excited also to hear about what projects y'all are working on, so if you want to drop that into the chat too, that would be kind of cool; that's something else we could talk about. And I can send y'all a recent hackathon project that used Runpod, I think for CPU under the hood. We're usually known for GPU, but one hackathon project that I recently knew about actually used CPU instead, which is interesting. So I'm going to drop the blog in here, and I can also drop in our Runpod YouTube, which can give another set of resources. I'm not really seeing a ton of other questions. I'm personally looking right now for a recent hackathon project.

**[01:21:23] Jessica:** Jason said, actually: you mentioned extra credits by request; what's the requirement to get another set of credits? I think it's a case-by-case basis. Some of my favourite projects are hackathon projects; it's something we always enjoy. So just let the hackathon admin know, and we can be in touch. It really just depends. I know at one hackathon somebody came up to me with a robotic arm, and they were like, "Hey Jess, I want to train this robotic arm", and we did the math together, and I gave them enough credits to do that. So it really just depends on the project and on what you're working on, but we're definitely interested in that. If that is something that you all are building, we definitely don't want credits to be the issue.

**[01:22:42] Jessica:** And I'm going to drop one recent project into the chat. But thank you so much for having me.

**[01:22:56] Jessica:** Oh yeah, somebody actually asked a really great question: what is the difference between pods and serverless? Serverless is pay-as-you-go compute. Pods tend to be a little bit more fixed; it's a more fixed set of thinking. That's how I think about it. Jason, I know that you also think about this a lot, so I'd love to hear how you think about it too. It really just depends on my workflow and what I'm doing. A lot of times, if I'm working with smaller sets of data, pods are all I need. We also have a lot of really great templates with pods, so a lot of times, for me, that's a really great place to get started. I can show you a little bit about some of those resources really quickly.

**[01:24:06] Jessica:** Let me go in here. If I go into Serverless, these are just some endpoints that I've created. I'm actually going to be talking at a murder-mystery-themed event this week, in honour of Halloween, so I made a queue-based _(as heard: "key-based")_ endpoint for that. I use these a lot for open models, and I can build on top of them using ComfyUI or vLLM; I tend to use vLLM a lot. And for pods, there are some other options as well. If I wanted to deploy a pod, I can do it straight from my agent, or I can use a template. My colleague Roman created a DAW, so that's one that I've used too. And then I can select between CPU and GPU. It really just depends on the project, but that's a little bit about how I think about that difference.

_From 01:24:20 to 01:26:20 the screen showed the Runpod console: the Serverless page with its ready-to-deploy repos, such as ComfyUI, vLLM and Faster Whisper; the "Deploy a Pod" page with a DAW template and the GPU and CPU options; and her pods._

**[01:25:17] Jessica:** And they're going to have a photo session after the Q&A session. So, cool, thanks, everybody. I think that's all I really have; there are no other questions. So thanks, everybody, and thanks for having me. This has been really cool to be a part of. As I think I mentioned in the opening keynote, hackathons have been a big part of my journey, so I really appreciate being here. I can't wait to see what y'all are building. I'll probably be at the closing ceremony too. Just really excited to be here.

**[01:25:58] Emcee:** All right. Thank you, Jessica. We really appreciate you giving _(as heard: "being")_ an insightful workshop with us, especially...

**[01:26:09] Jessica:** Oh, and I'll send you the PDF of the slides too, just so that you can send them around.

**[01:26:14] Emcee:** Okay, got it. I will share it with participants later. Especially thanks while you are travelling and tuning in from your hotel. So now we have some time for the group photo. Please, participants, turn on your camera, and we'll have a quick photo session after this. Okay, hi. I see some have opened their camera. Anyone else want to open their camera? Right, we're going to take a photo in five, four, three, two, one. Again: three, two, one. All right. Thank you, everyone, for being with us today in this hackathon and workshop. And good night. Good luck on your hackathon.

_From about 01:26:40 the recording shows the attendees' cameras for the group photo._

**[01:27:44] Jessica:** I can't wait to see what you all build. Bye. Thanks.
