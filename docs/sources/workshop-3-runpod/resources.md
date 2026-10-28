# Workshop 3 resources

The two handouts from SDC Hackathon 2026 Workshop 3, which Jessica Garson Beauchemin, who leads Developer Relations at Runpod, presented on Zoom on 21 October 2026 from 10 PM MYT: a two-page resource sheet for her deck, "Deploying Open Source Models on Runpod Serverless", and "Runpod Getting Started Resources", a two-page list of Runpod guides. The organisers uploaded both PDFs to the workshop's [Drive folder](https://drive.google.com/drive/folders/1qOaWdgpXpzrra9jWBZNN4GW63zskvWQk) at 11:14 PM that night. The workshop itself is in the [slides](slides.md), the [transcript](transcript.md) and the [meeting chat](chat.md).

The resource sheet prints its addresses as plain text, wrapped mid-word to fit its table; here they're joined and linked. The getting-started PDF's links keep their targets.

Contents:

1.  [Resource sheet](#resource-sheet)
    1.  [Essential links and repositories](#essential-links-and-repositories)
    1.  [Prerequisites checklist](#prerequisites-checklist)
    1.  [Serverless endpoint configuration](#serverless-endpoint-configuration)
    1.  [Decision2 Pod template](#decision2-pod-template)
    1.  [Key commands and technical tips](#key-commands-and-technical-tips)
1.  [Runpod getting started resources](#runpod-getting-started-resources)
    1.  [Core architecture and concepts](#core-architecture-and-concepts)
        1.  [Serverless GPU explainer](#serverless-gpu-explainer)
    1.  [Quickstarts and deployment guides](#quickstarts-and-deployment-guides)
        1.  [Hello World on Runpod Serverless](#hello-world-on-runpod-serverless)
        1.  [What's new in Runpod Serverless](#whats-new-in-runpod-serverless)
    1.  [AI assistant and agentic development](#ai-assistant-and-agentic-development)
        1.  [Your first Claude Code project within Runpod](#your-first-claude-code-project-within-runpod)
    1.  [Video content and live demos](#video-content-and-live-demos)
        1.  [Runpod official YouTube channel](#runpod-official-youtube-channel)
    1.  [Community and next steps](#community-and-next-steps)

## Resource sheet

**Deploying Open Source Models on Runpod Serverless**

One-Pager Reference Guide & Workshop Resources

### Essential links and repositories

| Resource Type       | Description                       | Link / URL                                                                                  |
| ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------- |
| Workshop Repository | Code and files for the workshop   | [github.com/runpod/openjev-serverless][repo]                                                |
| Python Example      | Example script for article review | [github.com/runpod/openjev-serverless/blob/main/examples/article_review.py][article-review] |
| Tutorial Article    | Article inspiring this workshop   | [runpod.io/blog/how-to-deploy-openjev-on-runpod-serverless][openjev-article]                |
| Hosted MCP Server   | Runpod MCP connection endpoint    | [mcp.getrunpod.io][mcp]                                                                     |
| Developer Discord   | Runpod developer community        | [discord.com/invite/runpod][discord]                                                        |

[repo]: https://github.com/runpod/openjev-serverless
[article-review]: https://github.com/runpod/openjev-serverless/blob/main/examples/article_review.py
[openjev-article]: https://www.runpod.io/blog/how-to-deploy-openjev-on-runpod-serverless
[mcp]: https://mcp.getrunpod.io
[discord]: https://discord.com/invite/runpod

### Prerequisites checklist

- **Runpod Account & Billing:** Active account with H100 80 GB GPU availability.
- **Runpod API Key:** Generated under _Console Settings > API Keys_.
- **Local Tools:** `npm` installed, Terminal with `cURL` support, Text editor.
- **Python Environment:** Python 3 with `requests` installed (`pip install requests`).
- **AI Coding Assistant:** Claude Code or equivalent assistant recommended.

### Serverless endpoint configuration

| Setting            | Recommended Value          | Reason / Description                                               |
| ------------------ | -------------------------- | ------------------------------------------------------------------ |
| **GPU Model**      | H100 80 GB ($4.79/hr flex) | Baseline benchmarked GPU for OpenJev deployment.                   |
| **Endpoint Type**  | Load Balancer              | Direct routing for synchronous HTTP API requests.                  |
| **Active Workers** | 0                          | Scale-to-zero when idle to minimize billing.                       |
| **Max Workers**    | 1                          | Controls burst costs during initial testing.                       |
| **Idle Timeout**   | 300 seconds                | Keeps worker warm during test iterations to prevent model reloads. |

### Decision2 Pod template

- **Pod Template Link:** [console.runpod.io/hub/listing/kodxana/decision2-serverless](https://console.runpod.io/hub/listing/kodxana/decision2-serverless)

### Key commands and technical tips

- **Runpod MCP Installer Command:** `npx @runpod/mcp-server@latest add`
- **Authentication Note:** The hosted MCP server (`https://mcp.getrunpod.io`) uses Runpod OAuth, eliminating long-lived API keys on disk.
- **Readiness Check Endpoint:** Poll `/v1/version` until returning status `200` before issuing requests.
- **Port Configuration:** Ensure ports 3000 and 3001 are properly exposed to avoid 502 bad gateway errors.
- **Model Licensing:** OpenJev weights use `CC BY-NC 4.0` (non-commercial use), while the worker code uses `Apache 2.0`.

## Runpod getting started resources

Welcome to the central developer hub for building, deploying, and scaling AI workloads on Runpod. Whether you are launching your first GPU pod, running serverless inference, or setting up agentic development environments, these core guides and media channels will help you get up to speed quickly.

### Core architecture and concepts

#### Serverless GPU explainer

Understanding how GPU infrastructure scales on demand is crucial for building cost-effective AI applications.

- [Read the Serverless GPU Guide](https://www.runpod.io/articles/guides/serverless-gpu)
- **What you'll learn:** The fundamental mechanics of serverless GPU compute, scaling to zero, pay-per-second billing execution, and how to structure production AI workloads to maximize throughput while minimizing compute costs.

### Quickstarts and deployment guides

#### Hello World on Runpod Serverless

The fastest path to getting code running on GPU infrastructure.

- [Read the Hello World Tutorial](https://www.runpod.io/blog/runpod-serverless-hello-world)
- **What you'll learn:** How to construct a lightweight handler, test your function locally, push to Runpod Serverless, and trigger your endpoint using cURL or Python.

#### What's new in Runpod Serverless

Discover modern features designed to streamline deployment and reduce latency.

- [Read the Serverless Feature Guide][whats-new]
- **What you'll learn:** How to leverage sub-second cold starts with FlashBoot, process high-volume requests with batch inference, and deploy serverless functions directly without writing custom Dockerfiles using Runpod Flash.

[whats-new]: https://www.runpod.io/blog/whats-new-in-runpod-serverless-faster-cold-starts-batch-inference-and-no-docker-deploys

### AI assistant and agentic development

#### Your first Claude Code project within Runpod

Combine the power of modern AI coding assistants with persistent cloud GPU instances.

- [Read the Claude Code Setup Guide][claude-code-guide]
- **What you'll learn:** Complete step-by-step instructions for installing and authenticating Claude Code directly inside a Runpod Pod, enabling an autonomous agentic workflow where your AI assistant can build, test, and run code directly in your cloud environment.

[claude-code-guide]: https://www.runpod.io/blog/your-first-claude-code-project-within-runpod-a-complete-setup-guide

### Video content and live demos

#### Runpod official YouTube channel

Prefer visual walkthroughs? The official YouTube channel covers everything from basic setup to advanced multi-node orchestration.

- [Visit the Runpod YouTube Channel](https://www.youtube.com/@runpod)
- **Featured Topics:**
  - Step-by-step visual setup guides
  - Live demo breakdowns from community Q&A sessions
  - Model deployment benchmarks and performance tuning

### Community and next steps

- [Runpod Documentation](https://docs.runpod.io): Full technical specs for REST APIs, SDKs, and CLI tools.
- [Runpod Discord Community](https://discord.gg/runpod): Join over 1 million developers, ask questions in `#general`, and share what you've built in `#built-on-runpod`.
