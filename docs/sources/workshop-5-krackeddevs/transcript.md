# Workshop 5 transcript

What was said at SDC Hackathon 2026 Workshop 5, run by KrackedDevs, on Google Meet on 23 October 2026 from about 4:11 PM to 5:39 PM MYT by the clock on the speaker's screen. It was [announced](/docs/sources/discord.com/announcements.md#workshops-on-22-and-23-october) as "AI Builder Foundation: Introduction to Vibe Coding", "beginner-friendly" and "hands-on", for 4:00 PM to 7:00 PM, by Fadli Khalid, Co-founder & CAIO of KrackedDevs; his title slide says "Fadli Khalid (Pali), Co-founder, KrackedDevs". He showed two ways to build with AI, the KD Sandbox shortcut and the KrackedDevs Build Method (KDBM) Lite, built a lunch picker live with KDBM Lite and his GCCOV prompt pattern, showed games made the same way, and left attendees to build their own.

Times count from the start of the organisers' recording, "Workshop 5 Recording.mp4" in the workshop's [Drive folder](https://drive.google.com/drive/folders/16aRDcC7A4zOZ_Qm0PXZO-ZvbXNGz9tO3), which opens with the emcee's introduction. The recording skips about 13 minutes at about 00:11:25, while everyone waited for more attendees: the on-screen clock reads 16:22 at 00:11:00 and 16:36 at 00:12:20. The text merges two machine transcriptions, an OpenAI gpt-transcribe pass and a whisper-1 pass, checked against each other and the screen. Doubtful words are marked _(as heard: "...")_, and fillers and false starts are trimmed. Malay phrases are kept in italics with an English gloss. Fadli presented a 24-slide web deck he made with AI, [fadlikhalid.github.io/vibe101-deck](https://fadlikhalid.github.io/vibe101-deck/); it isn't in the Drive and has been edited since, so slide text here is quoted from the recording, in italic stage directions at each slide change. He says the deck's "GCCOV" as one word, which both passes misheard ("GCOP", "G-Cog", "GCOF"); it is spelled here as on the slides. The Meet chat isn't in the recording, but his screen share shows the chat panel at 00:44:35 and 01:09:40, and the chat messages quoted here come from those frames. The meeting link is left out.

Contents:

1.  [Speakers](#speakers)
1.  [Messages](#messages)

## Speakers

- **Emcee** (Rana Al-meazab, the Meet host): an organiser who opens the workshop and answers Fadli's questions about attendance and timing, 00:08:24 to 00:08:49 and at 00:11:17. Fadli calls her "Miss Rana".
- **Fadli** (Fadli Khalid, "call me Pali"): co-founder of KrackedDevs, a trainer at The AI Builder School and a mentor at the SDC Hackathon. A first run-through of his introduction and the KD Sandbox, 00:00:41 to 00:11:21; the talk from the start, with the KD Sandbox demo, KDBM Lite, GCCOV and the live lunch picker build, 00:11:32 to 00:59:20; his own games and the deploy, 00:59:27 to 01:14:08. The emcee introduced him as "co-founder and CIO".

## Messages

**[00:00:00] Emcee:** Hello, everyone, and welcome to the fifth SDC 2026 hackathon workshop. Today we have our speaker, Fadli Khalid. He is the co-founder and CAIO _(as heard: "CIO")_ of KrackedDevs. He's going to share with us today the topic on how to vibe code, the foundation. So I'd like to welcome him to start whenever he's ready.

**[00:00:41] Fadli:** All right, so I should start now, right?

**[00:00:45] Emcee:** Yes, please.

**[00:00:46] Fadli:** All right, let me share my screen. If you can see from the chat, there's a link to the slides that I'm going to present right now. So first of all, good afternoon, everyone, and happy Friday to you guys. Today I will give a small talk about introduction to vibe coding. You guys can hear me, right?

_From about 00:00:50, the screen share shows the deck in Chrome. Title slide, "Introduction to Vibe Coding": "AI Builder Foundation · #1STSDGHACK", "Fri 23 Oct 2026 · 4:00 to 7:00 pm · Google Meet", "Fadli Khalid (Pali), Co-founder, KrackedDevs · SDC Hackathon, Xiamen University Malaysia"._

**[00:01:25] Emcee:** Yes, it's clear.

**[00:01:27] Fadli:** So, my name is Fadli Khalid. You can just call me Pali. For now, I'm the co-founder at KrackedDevs; I build AI-native products end to end. A little bit of background for me: I've been six-plus years in systems engineering, service delivery and project leadership. For my study background, I studied computer science at UTM, then security, and then I took a master's in IT entrepreneurship. As for teaching experience, I'm the trainer for KrackedDevs at the AI Builder School, and also one of the mentors in the SDC Hackathon.

_Slide "Hi, I'm Fadli Khalid. Call me Pali.", with four cards: Now, Before, Studied ("UTM: Computer Science (Network & Security), then a Master's in IT Entrepreneurship") and Teaching ("Trainer at The AI Builder School, and a mentor at the SDC Hackathon")._

**[00:02:09] Fadli:** All right, these are the notable things that I shipped or worked on at KrackedDevs. First of all, the KrackedDevs website itself, where we have around 3.5K builders and around 500 projects shipped. I think from the slide itself you can click on the links. Then we have the AI Builder School, where we teach online or physical classes. All of our syllabus is inside there; it's open to everyone. Every Monday we should have, like, three classes for foundation. Give me a moment.

_Slide "Notable things I shipped or worked on at KrackedDevs": KrackedDevs ("3,573 builders and 576 projects shipped", [krackeddevs.com](https://krackeddevs.com)), AI Builder School ("Live classes for Malaysia's future builders", [theaibuilder.school](https://theaibuilder.school)), Lembah Bintang ("A Malaysian village game in the browser", [lembahbintang.app](https://lembahbintang.app)) and Kuntum & Embun ("AI hiring partners inside WhatsApp and Telegram", [kuntum.app](https://kuntum.app)). From about 00:02:55 to 00:03:20 the screen share is off while he takes a phone call._

**[00:03:04] Fadli:** All right, sorry for the interruption, there was a call just now. So then there's the latest app that I created, a simple game called Lembah Bintang, a Malaysian village game in the browser. You don't have to download anything; just play directly in your browser. And the more AI-related stuff that works with our system is Kuntum and Embun, where you can hire top talent or land your next job, everything inside a single chat. And here you can see, like I said just now, I'm the trainer for the AIBS, the AI Builder School.

**[00:03:53] Fadli:** Then let's move forward. For today, I think the session is from 4 to 7, right? So within these three hours, I will show you guys two ways to build, the shortcut and the proper way; then KDBM Lite, which is a tool that we use for the development; then the GCCOV method, how you're going to talk to the AI; and then a simple project that you can build and showcase on our website. If I'm speaking too fast, do let me know, because I tend to speak fast when nobody is stopping me.

_Slide "Today, in three hours": "01 Two ways to build: the shortcut and the proper way", "02 KDBM Lite: tools, files and work cards", "03 GCCOV: how to talk to the AI", "04 A sample project, then your own build"._

**[00:04:37] Fadli:** All right, this is the KD Sandbox, which is the shortcut. How to access it? You can just click on this link here. It will bring you to the KD Sandbox, where first you need to sign in, then you pick an idea, then you get your build prompt, and then you build and publish. Why do we use this one? Because it is fast: a working app that you can share by link. It's not really a working app; it's more like a prototype or MVP, if you call it. And it's a guided approach, where a coach writes the build prompt for you, and after that you can paste the prompt into any of the tools, like Lovable.

_Slide "KD Sandbox" (01 · The shortcut): "From an idea to a working app in one sitting. No setup, no code editor." Cards: Fast ("A working app you can share by link"), Guided ("A coach writes the build prompt for you") and Small ("A single-page app. Great for a first win"). "Try it later: [krackeddevs.com/sandbox](https://krackeddevs.com/sandbox)"._

**[00:05:28] Fadli:** Let me show you how it works. This is the shortcut I told you about just now. Since I'm already signed in, I open the idea wall. Here I can just pick any idea that I want; these are the sample ideas that we use. Let's say I'm going with this typing speed test. It will open the coach, and it will ask you these questions here. Just answer all the questions that the AI asks you. It's a simple one: you can click yes, yes, yes, and start.

_The demo is on krackeddevs.com/sandbox: a "Four steps, one sitting" page (Sign in, Pick an idea, Get your build prompt, Build and publish), the idea wall, then the coach page, "From idea to build prompt"._

**[00:06:51] Fadli:** So this is what's meant by a build prompt: everything is in a single prompt. Just copy this and then open something like Lovable. Not sure if Lovable is accessible or not. Okay, let me log in first. Here I can just paste it, and let the AI build for me. Within 10 to 15 minutes, you will get a working MVP.

_Lovable starts building the app; the screen then shows the Meet window._

**[00:08:08] Fadli:** While we wait: there are only 14 people here. Miss Rana, may I know how many people we are expecting for this session?

**[00:08:24] Emcee:** Actually, for the number of participants, it depends on who logs in, so it might be about 50 or 30.

**[00:08:34] Fadli:** Okay, so do you want me to wait first, or do you want me to just proceed with the class?

**[00:08:42] Emcee:** Maybe wait five minutes.

**[00:08:45] Fadli:** All right, so let's just wait first, then I will start again.

**[00:08:49] Emcee:** Yeah, maybe you can give them instructions, if there's something they should prepare.

**[00:08:55] Fadli:** Okay. If they're going to build with me, they can go through the slides up until this slide, which is slide 10, and then go to this GitHub page and download the setup file: for Windows you can use setup.exe, and for Mac you can use the DMG file. Oh, do any of you already have an IDE on your laptop? Please raise your hand if you have any IDE, so you can skip all those things and just work on this one only, which is Git.

_The screen shows the "Download KDBM Lite" slide, the installer's GitHub release page and "The AI Builder School installer" slide, slide 10; both slides are covered at 00:25:35 and 00:26:36._

**[00:09:59] Fadli:** You guys can just chat here if you have any question or anything that's not clear. But since we're waiting for everyone, just get these three things: Git, VS Code, Node and npm. Just try to install these three things, and then you guys can build with me together. Or, to make it simpler, you can also use Antigravity or Codex or any of the subscriptions that you have; I think most of them also have a free plan. I'm just going to stop presenting for now, and let's wait for the others. If you have any question, please let me know.

**[00:11:17] Emcee:** Okay, maybe we start at 4:30.

**[00:11:21] Fadli:** Okay, that works for me.

_The recording skips about 13 minutes here. During the wait, at 4:36 PM, Fadli posted in the chat: "while we wait, those who already joined can register on krackeddevs.com, since sandbox will be using KD account", followed by the deck link._

**[00:11:32] Fadli:** So, we have 20 people now. Okay, let me start again from the beginning. If you can see in the chat, there's already a link there; the first chat is the slides for today. I will just reshare it again. I will be sharing my entire screen now. Can you guys see my screen? Since nobody answered, I assume everyone can see my screen. It will be a short session; I'll try to finish it before 7, and then everyone can also access this site at home or wherever you go and practise it, so no issue.

_The title slide again from about 00:12:00, then "Hi, I'm Fadli Khalid. Call me Pali." at about 00:12:40._

**[00:12:27] Fadli:** So today's session is an introduction to vibe coding. This is where you learn how to use AI to build something. A little bit of background for me: my name is Fadli Khalid. Some of you already know, since I already did the introduction previously, but you can call me Pali. For now, I'm a co-founder at KrackedDevs; I build AI-native products end to end. Previously I worked in the systems engineering, service delivery and project leadership field. I studied computer science, network security, at UTM, and then took a master's in IT entrepreneurship. And right now I'm the developer for KrackedDevs and also a trainer at AI Builder School, which is one branch of KrackedDevs.

**[00:13:26] Fadli:** Let me close this one. Okay, these are a few of the things that I shipped or worked on at KrackedDevs. The first one is KrackedDevs itself. The next one is the AI Builder School, where our syllabus also lives. It's open to the public: there's a paid class, there's an online class, there's a physical class, so you can choose whatever you want. Just sign up on KrackedDevs _(as heard: "Replit")_, and then you can log in yourself to the AI Builder School. And the latest thing for me is Lembah Bintang; I tried to venture into game development, so you can try this. All the websites shown here have a link, so on the slide you can just click on the link. And the other product that we do that's related to AI is Kuntum and Embun, where Kuntum is the place for people to look for jobs, and Embun is the platform for companies to look for staff.

**[00:14:37] Fadli:** Another part, like I said just now: I'm a trainer, where I teach Foundation as an AIBS trainer. Okay. Today, within these three hours, I think two and a half hours, so we're already halfway there, I'm going to show you two ways to build: the shortcut and the proper way. Then I'm going to show you KDBM Lite: the tool, files and work cards that we're going to use for building. Then the GCCOV approach on how to talk to AI, then a sample project, and then you can build on your own.

_"Today, in three hours" again at about 00:14:40, then "KD Sandbox" at about 00:15:20._

**[00:15:16] Fadli:** For now, the shortcut is the KD Sandbox. If you are on slide 5, I mean, if you open the slides on your own laptop, you can click on the link. It will bring you to this page, where you can sign in, pick an idea, get your build prompt, and then build and publish. So why the Sandbox? It is the fastest way to make a working app or MVP that you can share by link. It is a guided approach, where a coach will write the build prompt for you. Your job is to answer simple questions, and then you can copy the build prompt and paste it into an AI builder tool like Lovable, v0 and other tools that are out there. For this shortcut, you don't need any code editor or setup. You can just create a free account on the apps that I just mentioned.

**[00:16:29] Fadli:** How the Sandbox works: you open KrackedDevs, go to Sandbox, and sign in. Then you pick an idea from the idea wall. From there you get your prompt, where the coach will interview you and then write a blueprint. You copy that blueprint to your Lovable, and then you publish it.

_Slide "How the Sandbox works": "01 Sign in: Use your KrackedDevs account", "02 Pick an idea: Browse the idea wall, or bring your own", "03 Get your prompt: The coach asks a few questions and writes one build prompt", "04 Build and publish: Paste it into an AI app builder. Publish and keep the link". Below: "AI app builders: Lovable, v0, ILMU Chat, Hostinger Horizons. A free account is needed. Then submit it to the showcase, and it lives on your KrackedDevs profile. Open it: krackeddevs.com/sandbox"._

**[00:16:54] Fadli:** I'm going to demo the Sandbox a bit. I already did it just now, so I'm going to skip this one. I'm already signed in, because this is my account. So you can open this idea wall, which I'm going to open in a new tab. This is the idea wall; we have around 36 ideas, so you can pick any that you like. Once you pick an idea, it will bring you to the coach. When you pick an idea, it will give you something like this, a starter, and the AI will ask you questions here. Your job is to answer the AI. Once you answer, it will give you something like this: the blueprint. Here it tells you that you can use Lovable, v0, ILMU Chat or Hostinger Horizons. These are the tools out there that you can use, up to you, but this is the easiest to use.

**[00:18:05] Fadli:** So you just copy the build prompt, open your Lovable, paste it into the chat, and press enter. This is the thing that I copied just now: "Build a single page", blah blah blah, until "a working preview". You can see "Build a single page" until "a working preview" down here. Based on this, Lovable will do it for you, and in the output here you can see something like this. Your task is just to test it, and if you're okay with the output, you can publish it. Here you can also see the code, which I think you can export later: this is all the code for the app that has been built. To make sure it works, you can just test it here.

_Lovable's preview shows "Typing Speed Test", which times you typing a passage set in Malaysia. From about 00:19:15 to 00:19:58 he types a passage without speaking._

**[00:19:58] Fadli:** So my speed is 60 words per minute, accuracy is 99%, time is 34 seconds. This is how you test your own app. And like I said just now, this is the shortcut. When you click on Publish, it will ask for the domain and everything, and later you will get a shareable link that you can pass to your friends or family or anyone you want to review your app. I will share the link here, so you guys can open it and play around with it. This is how you improve your app: give it to people, let people give feedback, and then work on it.

_Lovable shows "Your website is live". The link he posted in the chat at 4:45 PM is [pixel-perfect-screenshot-revival-13.lovable.app](https://pixel-perfect-screenshot-revival-13.lovable.app)._

**[00:20:53] Fadli:** If you click on Share here... If you want to download this code so that you can work on it on your local machine, you can just click Download here. Download files; but I'm not sure if it's going to download the whole project or not. It's supposed to download the whole project code. I'm not sure about Lovable, but with Hostinger _(as heard: "Stinger")_ you can export the code itself. I need to check more on that. Okay, let's stop talking about that.

**[00:21:45] Fadli:** So this is how the shortcut works: from the idea, you get your prompt, and then you build and publish. If you don't want to build from the ideas in the idea wall, you can just click New and say something like "I want to build a calculator online". The AI will help you do it: you just need to answer the questions, then you get the blueprint, and with the same method you paste it into the builder and get the result here.

**[00:22:29] Fadli:** All right, enough with the shortcut. I'm going to show you the two ways to build, and the one that we always use in our class is KDBM Lite. We call it the proper way because it is more detailed. KD Sandbox is the shortcut; KDBM is the proper way. For KD Sandbox, you write the idea and answer the coach, but for KDBM Lite we're going to have the planning files and then small work cards. For KD Sandbox, there's one prompt, one page; KDBM Lite is more focused on a project that you can build on your own. So KD Sandbox fits if you want a quick project or quick output; KDBM Lite is for something that you want to build continuously. For today's session we're going to use KDBM Lite, which you can download later; there's a link inside the slides.

_Slide "Two ways to build", KD Sandbox against KDBM Lite: style "The shortcut" or "The proper way"; you write "An idea, then answer the coach" or "Planning files, then small work cards"; you get "One prompt, one page" or "A project you can grow and own"; best for "A first win in one sitting" or "Anything you want to keep building". "Today we follow KDBM Lite for the whole 3 hours. You can use any other method you prefer."_

**[00:23:31] Fadli:** Here you see, this is KDBM Lite, the KrackedDevs Build Method: one loop that you can repeat for every build. We will follow this method for the whole three hours. In this method we have Spec, where you say to the AI what you're building; Build, where the AI writes it in small steps; Check, where you test the result; and Ship, where you put it live and own it. Today we'll try to cover Spec, Build and Check. For Ship, we'll see whether we have the time or not.

_Slide "KDBM Lite" (02 · The proper way): "KrackedDevs Build Method Lite: one loop you repeat for every build." Spec ("Say what you're building"), Build ("AI writes it in small steps"), Check ("You test the result"), Ship ("Put it live, own it"). "Today we cover Spec, Build and Check. Ship comes in the Build & Ship cohort."_

**[00:24:15] Fadli:** The tools that you need for KDBM Lite are VS Code, Node and Git, and the starter folder. So, have you guys ever heard of VS Code or an IDE before? Right. All right, if you're familiar with VS Code, then good. This is the basic IDE that we use. You can use Kilo Code to connect all your AI agents or API keys there. Otherwise you can use something like Antigravity IDE, or Claude Desktop, or even Codex, or even OpenCode; there are a lot of options out there. But you definitely need Node and Git: Node is to run your app, and Git is to save snapshots of it. And the last one is the starter folder.

_Slide "Your tools for KDBM Lite": "01 VS Code + Kilo Code: Your editor and your AI agent. Cursor works too", "02 Node + Git: Node runs your app. Git saves snapshots of it", "03 Starter folder: `START_HERE.md`, prompts, templates and work cards". "Use your own laptop, not a work one. An AI agent reads your files and runs commands." Two attendees answered "yes" in the chat, and Muhaimin Juhari asked "can use claude code?" (answered at 00:58:54)._

**[00:25:35] Fadli:** Let's talk about the installer first. In our class, we usually have an installer here. If you click on this link, there will be installers, and you can find the one that fits your own machine, whether EXE or DMG; for Linux you need to use DEB. Once you install it, you should have something like this: Visual Studio Code that already has Kilo Code connected to it. See here, this is the extension. I'm not going to use Kilo Code for now; I'm just asking you to install Kilo Code so that you can use it. But if you have other IDEs, then go for it, no issue.

_Slide "The AI Builder School installer" (Faster setup): "One click installs VS Code, Git, Node.js and Kilo Code." Windows: "Download `aibs-setup_windows_x64.exe` and double-click it"; macOS and Linux: "Paste the one line from the release page" into a terminal. Link: [github.com/ar-Raqmi/ai-builder-school-installer/releases/tag/v0.1.4](https://github.com/ar-Raqmi/ai-builder-school-installer/releases/tag/v0.1.4). "Prefer to do it by hand? The setup steps on the previous slide still work." He then shows the release page and VS Code with the Kilo Code extension._

**[00:26:36] Fadli:** And then I need you guys to download this: the KDBM Lite Foundations zip, which is the zip file that we're going to use for today's class. Just click on it, and I'm going to rename it to "SDC class 101". Then I'm going to unzip it. Here: unzip, rename. I already renamed it, so when I unzip, it already uses that name. Then here it says VS Code, open, and then open the folder. Since I'm not using VS Code, I'm just going to use my Claude.

_Slide "Download KDBM Lite" (Get the starter pack): "The same pack the AI Builder School uses. Download it now so you can follow along." Link: [learn.theaibuilder.school/kit/kdbm-lite-foundations.zip](https://learn.theaibuilder.school/kit/kdbm-lite-foundations.zip). Steps: "1 · Unzip: In Downloads. On Windows, right-click and choose Extract All", "2 · Rename: Small letters with dashes, like my-first-app", "3 · Open: VS Code, then File, then Open Folder". "You should see `START_HERE.md` in the sidebar. If you see DOWNLOADS instead, you opened the wrong folder." From about 00:27:20 he opens the folder in Claude Code in the Claude desktop app, his coding agent for the rest of the session._

**[00:27:38] Fadli:** When you open the folder, it will have something like this. Oh, this is the updated version. Wow. Okay. Wait, why is it like that? Okay, so let's create a new session. Open folder, Downloads, SDC class, open. Trust workspace. All right.

**[00:28:45] Fadli:** If you open the folder, you will see something like this. There's a prompts directory, a templates directory, a work-cards directory, and there's build-status and START_HERE. What are these things? These are the things that the AI will read. You will start from the START_HERE file. You see here: if you open START_HERE, you will have something like this: Spec, Build, Check and Ship, and then the description. What this will create is a project brief, architecture, a build blueprint, a build status, and work cards. Since we are using the Lite version, there will only be four work cards at the end of the interview. And normally we copy this and paste it into the chat.

**[00:29:58] Fadli:** I will go through this first. Once you complete START_HERE, there will be a project-brief file, which covers who the system is for, the scope and the goal. Then there's the architecture file, which records the stack and structure of the app; design.md, which is for the look, mobile, and the rules for the system; the build blueprint, the full build spec for the system; the build status, which keeps track of where the system is right now and what's next; and then the work cards, one small step at a time, where we work on one card at a time. Your task is to make sure that you verify every output the AI produces for you, so you stay the owner. The AI only helps with speed. You are the one deciding the goal, confirming the plan and testing the result.

_Slide "The files are the truth, not the chat", each file and what it holds: `project-brief.md` ("Who it's for, scope, goal"), `architecture.md` ("Stack and structure"), `design.md` ("Look, mobile, rules"), `build-blueprint.md` ("The full build spec"), `build-status.md` ("Where we are, what's next"), `work-cards/` ("One small step at a time"). Beside it: "You stay the owner. The AI helps with speed. You decide the goal, confirm the plan, test the result and own what ships."_

**[00:31:00] Fadli:** Like I said just now, there will be four work cards when the prompts are complete. The first work card is the project skeleton: your app's name on a page, on your laptop. Then the first visible version: it looks like your design, with sample data. The third card is the core behaviour, how the app behaves. And the last card is save or polish: whether the actual system works the way you intended or not. So there's a cycle: you build one card, you test, and then you reply "continue" or "fix". If, let's say, you come to card 3 and you see that the app doesn't work, you need to check what doesn't work and then fix it. Then go to card 4 and repeat the same thing.

_Slide "Build in four work cards": "01 Project skeleton: Your app's name on a page, on your laptop", "02 First visible version: It looks like your design, with sample data", "03 Core behaviour: The main thing it is for works", "04 Save or polish: It survives a refresh, or it's finished on a phone". "The cycle: build one card, test it yourself, then reply "continue", or "fix" with the exact error. Card 02 is a good session. Card 03 is an excellent one. Card 04 is the stretch."_

**[00:31:58] Fadli:** So what approach are we going with today? We call it the GCCOV approach. It is a way to write every message to the AI. It works in any method, for a whole build or one feature. So what GCCOV is... "is" or "are"? I think "is" is good. Depends. G is goal: what should exist when this is done, in one sentence. As for C, the first C is for context: who is it for, and what already exists? The second C is for constraint: you set the limits so that it doesn't go overboard or drift. For example, limit it to browser only, no login, no database and no complicated stuff. O is the output, the shape that you want back: the files, the steps, the code. The output is the one that you determine; you decide what you want the output to look like. And V, the last one, is verify: you test everything and see whether it works or not.

_Slide "The GCCOV approach" (03 · Talking to the AI): "A way to write every message to the AI. It works in any method, for a whole build or one feature." G Goal ("What should exist when this is done? One sentence"), C Context ("Who it's for and what already exists"), C Constraint ("Limits: browser-only, no login, time"), O Output ("The shape you want back: files, steps, code"), V Verify ("How you will test that it works")._

**[00:33:07] Fadli:** For GCCOV inside KDBM Lite, KDBM Lite already covers some of it: it covers the constraint and output. For the Spec, there are only the planning files, no code, no installs, so you write who it's for and what it looks like. As for Build, one card at a time, so you verify that the card works: either continue, or fix if there's an error. And then your own method: you choose. But for GCCOV, you write all five letters in every message.

_Slide "GCCOV inside KDBM Lite", what KDBM already fixes (Constraint, Output) and what you write: Spec ("Planning files only. No code, no installs" / "Goal and Context: who it's for, what "done" looks like"), Build ("One work card at a time" / "Verify: the card's test, then "continue" or "fix" with the error"), Your own method ("You choose" / "All five letters, in every message"). "KDBM's stage limits win. Never ask for the whole app in one message. Nothing is built until you say "Start Work Card 01"."_

**[00:33:48] Fadli:** This is talking to AI, before and after. The normal way, people will ask: "Make me a lunch app." So the AI has to guess everything: who it's for, how big it is, what to build, what "done" means. With GCCOV, we have the goal, the context, the constraint, the output and verify. Let's see. For the goal: "I want a page that picks what to eat for lunch." The context: "For me and friends who can never decide." The constraint: "One page, browser only, no login, no database." As for the output: "Planning files only, no code yet." And for verify: "Five taps give different meals. My list survives a refresh." So with five short lines, the AI knows what to build and what not to build, and you will check it.

_Slide "Talking to the AI: before and after": "Vague: Make me a lunch app." beside "With GCCOV", the five lines he reads. "Five short lines. The AI knows what to build, what not to build, and how you will check it."_

**[00:34:33] Fadli:** So, your first message to the coach. This is the part where we start to build. We copy this part here, then open your IDE, then copy the second part, which is combined with the GCCOV, and press enter. I'm not going to use Opus, because it's overkill; let's just use Sonnet.

_Slide "Your first message to the coach", two boxes with Copy buttons. "1 · From `START_HERE.md`, as is": "Read `START_HERE.md` and `prompts/00-run-kdbm-lite-coach.md`. Run the KDBM Lite Coach exactly as instructed. Planning phase only", with no app code, packages or source edits yet, "Start with the Setup Gate. Ask me one question at a time." "2 · Your idea, in GCCOV": the lunch picker's goal, context, constraint, output ("Planning files first: brief, architecture, design, blueprint and four work cards. No code until I say "Start Work Card 01"") and verify lines. "Copy-paste text: [fadlikhalid.github.io/vibe101-deck/first-message.txt](https://fadlikhalid.github.io/vibe101-deck/first-message.txt)"._

**[00:35:05] Fadli:** Okay, this is what happens after you send it. What the coach does: it will run the Setup Gate and check that Node, npm and Git are installed. What you need to do is click Allow for the permission, and paste the versions if it asks. Then it will ask you about your idea, one question at a time; it won't ask you more than one question at a time, to keep it structured. Normally you can answer in one line, like "choose for me and move on", or you can answer however you like. For step three, it says what kind of app it is: a content site or a browser tool. What you do is reply "yes" or correct it; it's up to you, depending on what you want to build.

**[00:35:58] Fadli:** Then the AI will write the project brief, architecture, design and blueprint. You read each one; your task is to verify it. You read it and see if you need to change anything. If you need changes, you tell the AI. If not, just move on. Finally, it will write you the four work cards, the ones we talked about just now, the project skeleton and so on. Then you check if the four cards make sense or not. And then it waits, since there's no code writing involved yet in the first step, until you write "Start Work Card 01", which is working on the first card.

_Slide "What happens after you send it", what the coach does and what you do: 1, Setup Gate checks Node, npm and Git ("Click Allow on "Permission required". Paste the versions if it asks"); 2, asks about your idea one question at a time ("Answer in one line. Stuck? "choose for me and move on""); 3, says whether it's a content site or a browser tool ("Reply "yes", or correct it once"); 4, writes `project-brief.md`, `architecture.md`, `design.md` and `build-blueprint.md` ("Read each one. Ask for changes before it moves on"); 5, writes four work cards and updates `build-status.md` ("Check the four cards make sense"); 6, waits, with no code written yet ("Type "Start Work Card 01" to begin building"). "If it writes code early, reply: "Planning phase only, no code yet.""_

**[00:36:45] Fadli:** Okay, let's go back here. The tool is ready. If you can see here, it checked the Setup Gate and everything. It ran the Node, npm and Git version checks, so it printed out the versions of my Node, npm and Git, but it doesn't start anything yet. The first question is whether I need to change anything; if not, I can just skip. Here we've already answered all the questions of the first step, because our first prompt already has this kick-off part. This is the first part that the AI asks you: what are you building, who is it for, what should that person be able to do, what is done enough today, and what must it not become today. Because I think it is enough for today, I just reply "keep", and then the AI reads other files. There will be a lot of files that it reads.

**[00:38:03] Fadli:** Here it says: "I read this as a browser-local tool because you add your own meals and they must still be there after a refresh. Is that right?" So yeah, I want it to stay upon refresh. So, yep, right. You can see here, one new file has been created: a project brief. If you can see from this file, there's a one-sentence concept here, the target user, the user goal, the build shape, the shape confirmation, version-one success, and then the Now, Later, Never section: Now is what we need to do, Later is what we need to do later, and Never for tonight is what we're not supposed to do.

**[00:39:05] Fadli:** So here the project brief is saved, and this is the architecture it proposes. If you are okay with this architecture, just reply "yes". If you want to change something, let's say you don't want Vite, you want something like Next.js, ask the AI to change it. But if you're okay with it, just reply "yes". Later you will see a new file here, architecture.md. Here, see? architecture.md has been created. This is the file that the AI will refer to later on when it starts building, so that it doesn't go astray or drift.

**[00:39:55] Fadli:** Now it asks for the design: I need to pick a style by number, or describe it in my own words. Since this is going to be a fun app, I'm going to go with 3, playful student dashboard. Later it will create one more file, which is the design. Okay, one more: "What makes it yours? Give me one thing: a colour, a word, how it should feel, or who it should feel made for." For this one, I usually don't have any idea what it should look like, so I just leave it to the AI: "You help me decide." "I want a chilli-orange accent, a hungry and cheerful feel." I'm not sure what a hungry and cheerful feel looks like, but then again, I'm just going to go with "yes". Later it will write another file for me, which is the design file. If you can see here, it's creating the design.md file.

**[00:42:27] Fadli:** This slide is the one we already went through just now. So the project I'm going to go with for this evening... is it already evening, or still afternoon? Whatever it is, this is the project: Makan Picker. This is the goal that we actually just pasted in here, so I've already gone through a few of these. Later it will create these four work cards. See here: if you open this work-cards directory, there are four cards here: Project Skeleton, First Visible Version, Core Behaviour, Save or Polish. They match these four work cards that we expect to have.

_Slides "Inside KDBM: what you actually type" (Spec: "Your first message"; Build: "Start Work Card 01"; Check: "continue or fix + the exact error"; "Short messages, one step at a time. The files remember the rest."), "Makan Picker" (Sample project · KDBM step 1: Spec: "A new project, started live from an empty folder. The GCCOV prompt becomes `project-brief.md`.", with the five GCCOV lines) and "Makan Picker, in four work cards" (KDBM steps 2 and 3: "01 Project skeleton: "Makan Picker" on a page", "02 First visible version: A sample meal list and a Pick button", "03 Core behaviour: Pick shows a meal. Five taps, different meals", "04 Save or polish: Add my own meals. They survive a refresh". "Each card ends with a test. You run it yourself, then say "continue" or "fix".")._

**[00:43:27] Fadli:** Here the AI has already asked: if you want to proceed, just type "Start Work Card 01". So here is where the building begins. See here, it reads the build status first, because this is your checkpoint file. Then it starts scaffolding the app: setting the title and name, installing packages, and writing the header and everything. Later it will start the dev server for us to test.

**[00:44:17] Fadli:** At this point, if you have any question, do let me know, because I haven't looked at this page much, so I'm not sure if there's any question or anything. Someone do let me know, or ask me using voice, so that I don't ignore you guys. Sorry, English is not my mother tongue.

_At 00:44:35 he opens the Meet window with the chat panel, which shows the messages quoted at 00:11:21, 00:19:58 and 00:24:15._

**[00:45:03] Fadli:** Okay, so here you see, work card 1 is done. What we should expect, based on this one, is "Makan Picker" on a page. If I open this one in Chrome, see: Lunch Picker. It's about the same. This is the basic scaffolding, so everything should be okay. I just click Continue here, and it starts building work card 2. You can actually see the live update here; if there's an error, it will show an error. It's supposed to hot-reload for you guys if there's an update.

**[00:46:07] Fadli:** If you go to the slide just now, the first visible version is a sample meal list and a Pick button. Here you can see a sample meal list and a Pick button. But of course, nothing works yet: see, I cannot add or pick. So I just click Continue here.

_The app, at localhost:5173: "Lunch Picker", "What are we eating?" with a Pick button, an "Add a meal" field and sample meals (nasi lemak, chicken rice, mee goreng, roti canai, laksa, burger), each with Delete._

**[00:47:00] Fadli:** Right, it says work card 3 is done: pick, add and delete work in memory, and it tested them. Okay, so my part is to test and verify. Let's say we add malatang. Add. It shows here. If I click Pick, it's supposed to pick something. Yeah, it works. So all four tests work. Then let me test deleting the malatang just now, and add satay. So yeah, the basic code works: we can add, we can delete, we can pick. So let's continue.

**[00:48:00] Fadli:** The last card is to see whether we can actually save this thing. Let's see: I add pisang goreng. If I refresh, pisang goreng should still be here. Yep, still here, so the persistent local storage works. Okay, so you can just click Continue here. Once we click Continue, all four cards should be built. If you click on the build status here, it shows work cards 1 to 4 already ticked. So there's nothing left for you guys to do here.

**[00:49:16] Fadli:** So this is where we actually start vibing, as the name implies: vibe coding. Let's say I want to make it more interesting. My prompt here is to make the system look more interesting, so that when we pick something, there will be some animation on it. See, that's the animation just now.

**[00:50:20] Fadli:** One thing I like about the latest AI versions is that you can use Ask Gemini, or if you already have Claude on your laptop, you can just open Claude and do something. For example, I'm going to click Ask Gemini here, and here I can say: "Go through this page and tell me what else I can improve to make it more fun and lively. You suggest for me." So what I do is click Copy response here, and paste it here. From the output that Gemini gave me, I can use it in Claude to improve the overall system in terms of look and functionality.

_Ask Gemini is the Gemini side panel in Chrome. Its three ideas, as the coding agent lists them: a "Fate Decider" spinner, a "Food Judge" comment under the picked meal, and "Vibe Packs" of preset meals._

**[00:52:16] Fadli:** All right, so if we refresh here and click Pick, there's confetti down here. So, what change next? Let's add the food judge commentary. From this output just now, there are three ideas; we're working on the second idea, since the first idea is the confetti.

_From about 00:53:00 to 00:53:54 the agent makes the change._

**[00:53:54] Fadli:** All right, let's test. Let's see: "Roti canai: heavy carbs detected. Prepare for a 3 PM food coma." So that's one thing, and that's good. Then go for the next change, which is the third one here, the vibe packs _(as heard: "white pack")_.

**[00:54:58] Fadli:** Okay, let's see. Click here: Mamak & Local, Quick & Casual. Yeah, it works: it adds sandwich and Maggi goreng. So everything still works, but then again, I don't like the UI. Okay, let's change the UI: "The UI looks plain and boring."

**[00:56:17] Fadli:** You guys can actually try it yourselves, because slide 22 is your turn. You can use the same method that I used just now: download the file, and then make your own app. For example, here we have a pantun maker, a reaction game and a habit tracker. You can start with the spec: write your goal in one sentence, and then run GCCOV. So please help yourselves and start building. Maybe within half an hour, everyone can do show and tell: show your own project, and everyone can give feedback.

_Slide "Your turn: build something small and fun": "Keep it browser-only: no login, no database. A safe first build." Pantun maker ("Pick a theme, get a four-line pantun"), Reaction game ("Tap fast, beat your best score"), Habit tracker ("Tick off today's goals, see your streak"). "Start with Spec: write your Goal in one sentence, then run GCCOV."_

**[00:57:31] Fadli:** Also, I love to use this Responsive Viewer. It can show a preview on a phone, on an iPad, which is a tablet, and on Windows. With this extension, you can see how your app looks on mobile, tablet and desktop. So you can try adding this extension, Responsive Viewer, on your laptop or machine.

**[00:58:54] Fadli:** _[Muhaimin Juhari asked in the chat at 4:49 PM: "can use claude code?"]_ Can, can, can, Muhaimin. You can use Claude Code, you can use Codex, you can use Antigravity IDE; it's up to you. There's no restriction, actually. But if you're going to go with the sandbox, which is the shortcut way, just use our sandbox. I think you can go to the last page... oh no, the second-last page. There's a link; you can click on the first link, which is krackeddevs.com/sandbox.

**[00:59:27] Fadli:** Okay, while we wait, I'm just going to do a shameless plug here. This is my app that I created. I think I created this one maybe this Monday; it's not even a week old. This is how it looks. Yeah, this is fully vibe coded; even the assets were generated using AI. So here, this is my character, this is my home, this is my field. Yeah, that's quite a sexy way to plant a seed. The _baldi_ (bucket) is empty, so let's take a _baldi_. So how many seeds do I have?

_The game is Lembah Bintang, a pixel-art farming game in a Malaysian village, at lembahbintang.app. He plays without speaking until 01:02:01._

**[01:02:01] Fadli:** Wow. Okay, this is new. So this is the new look of our app. Okay. So this is the basics of vibe coding, or coding using AI. Okay, just keep this one.

_The restyled Lunch Picker: a dark page with "Today's lunch" and "What are we eating?", shown in Responsive Viewer at phone and tablet sizes._

**[01:02:41] Fadli:** The next part is to push this into Git. I can just say: "Help me push to Git and deploy on Git." If you use tools like Lovable or v0, you can publish directly and get the link. But if you work on it locally, once you've created your Git and everything, you can just prompt this: "Help me push and deploy on Git." Deploying on Git is optional; you can deploy anywhere, on Vercel or other places. Up to you. Or you can just say "deploy online", or GCP or AWS, up to you. But the easiest is to deploy on Git, Vercel or Cloudflare.

**[01:04:26] Fadli:** This is also another app developed with vibe coding: MyFM 27 _(as heard: "my MM27")_. If you love Football Manager or Championship Manager, you can try playing this game. The most crucial thing in building something is that you need to know what you want to build, and from there you start climbing bit by bit: you start building the foundation, you start building the framework, up until you have the first look of your app.

_The game is at [myfm27.app](https://myfm27.app); he plays a match as Melaka Homeboys against KL Rovers._

**[01:06:05] Fadli:** Ah. Okay, this is bad. I think the developer hates me. Okay, let's go with Park the Bus. Go attacking by custom. Ah. Yeah, my team is pretty much useless at this point. So let's see. Yeah, that's good. Let's continue first until it deploys.

_By 01:08:05 the coding agent has declined to deploy: "The coach rules for this lab say publishing is taught in Build & Ship, the paid cohort, so I won't start Git, GitHub or Vercel here." He types back "this is outside of the class, so you can skip it and deploy"._

**[01:08:03] Fadli:** _[Fatima Khaled asked in the chat at 5:32 PM: "how many hours it took you to build it?"]_ How many hours did it take you to build it? Which one, for MyFM or for Lembah Bintang, Fatima? For MyFM, I think my friend here took three to four days. Actually, the developer is the one above you, Muhaimin Juhari. But for my game, it took me around three to four days also.

**[01:08:56] Fadli:** Oh, _empat kosong, tipu sangat_ (four-nil, such a cheat). _Asal lemah sangat_ (why so weak)? _(as heard: "Ni ada oso-oso tipu ni. Eh, unlock tak ke mana?")_ Fine. Skill issue.

_"Skill issue" was Hanif Danial's chat message at 5:33 PM._

**[01:09:25] Fadli:** Hanif, can you share your game also? I forgot the Congkak link. I mean, you can share it here. _[Hanif Danial posts [chongkak.desainep.my](https://chongkak.desainep.my) in the chat.]_ Yeah. So this is also another game created by the KrackedDevs team. You can play it.

_From 01:09:45 to 01:11:00 he plays the Congkak game, with a few Malay exclamations._

**[01:11:00] Fadli:** Yeah, my own traditional game, and I also cannot win. Okay, later. So that's the kind of game or system that can be created using AI itself. There are a lot of possibilities that you can venture into using AI. So don't limit yourself; just limit your credit.

**[01:11:59] Fadli:** Right now the AI is trying to help me push my project into Git and then try to deploy it. If I open my GitHub, see, it's already being pushed here, and the AI is trying to deploy it. So you guys can try based on these slides; they have all the information. Please create something and explore how to build with AI. It should be easy enough, since this is a basic class: it doesn't require authentication or any database connection.

_By 01:12:20 the agent has pushed a lunch-picker repository to his GitHub account and is enabling GitHub Pages._

**[01:13:34] Fadli:** Oh yeah, even these slides I created using AI, and I host them in my Git. If you can see here, it's under this one, vibe101-deck. See, updated one hour ago, so I created it specifically for this class. So there's a lot that you can do with AI. I'll leave it to you guys for now. Feel free to explore and create something fun.

_He shows his GitHub repositories, including vibe101-deck ("SDC Vibe 101: Introduction to Vibe Coding (slide deck)"), and the deck's second-last slide, "Visit these later": KD Sandbox (krackeddevs.com/sandbox), AI Builder School ([learn.theaibuilder.school](https://learn.theaibuilder.school)), KDBM Lite starter pack (learn.theaibuilder.school/kit/kdbm-lite-foundations.zip), Setup installer (github.com/ar-Raqmi/ai-builder-school-installer), KrackedDevs (krackeddevs.com), Lembah Bintang (lembahbintang.app) and Kuntum & Embun (kuntum.app). He stops presenting at about 01:14:10, and the recording ends at 01:14:18 with no closing from the emcee._
