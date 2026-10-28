# SDC Hackathon 2026 GitHub submission template

The sample repository the organisers shared, now public at [michaelzhngg/SDC_Hackathon_Submission_Template](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template). It is a minimal Python project set up for Replit and RunPod, with a README template and a `submission/` folder for the required PDFs.

This page was cleaned from the zip the Drive first shared as "SDC Hackathon Submission Template (GitHub)" ([source zip](https://drive.google.com/file/d/1Atfzhuehpr6zYvM0oenDOzXeNymTHow_/view), which asked for sign-in on 29 October), matching the repository's commit [`1ad25e8`](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template/tree/1ad25e8) of 18 October. On 21 October 2026, `GitHub Link.pdf`, a one-page PDF holding only the repository link, replaced the zip. Every section but [Changes since the zip](#changes-since-the-zip) describes the zip: it lists every file, reproduces the small ones verbatim, and summarises the rest.

Contents:

1.  [File tree](#file-tree)
1.  [What each file is for](#what-each-file-is-for)
1.  [README template](#readme-template)
1.  [Configuration files](#configuration-files)
    1.  [Environment variables example](#environment-variables-example)
    1.  [Replit run configuration](#replit-run-configuration)
    1.  [Python requirements](#python-requirements)
    1.  [Git ignore rules](#git-ignore-rules)
1.  [Code files](#code-files)
    1.  [Application entry point](#application-entry-point)
    1.  [Helper functions](#helper-functions)
    1.  [RunPod serverless handler](#runpod-serverless-handler)
    1.  [Unit tests](#unit-tests)
1.  [Submission folder](#submission-folder)
    1.  [Proof-of-use sample PDFs](#proof-of-use-sample-pdfs)
    1.  [Older copy of the proposal template](#older-copy-of-the-proposal-template)
1.  [License file](#license-file)
1.  [Changes since the zip](#changes-since-the-zip)
1.  [See also](#see-also)

## File tree

The zip also contained a `.git` folder, which is left out here.

```text
.
├── .env.example
├── .gitignore
├── .replit
├── LICENSE
├── README.md
├── requirements.txt
├── docs/
│   └── .gitkeep
├── runpod/
│   └── handler.py
├── src/
│   ├── main.py
│   └── utils.py
├── submission/
│   ├── REPLIT PROOF OF USE.pdf
│   ├── RUNPOD PROOF OF USE.pdf
│   └── Submission Template SDC Hackathon.pdf
└── tests/
    └── test_utils.py
```

## What each file is for

- `README.md`: the project README template that teams fill in; see [README template](#readme-template).
- `LICENSE`: the standard Apache License 2.0 text; see [License file](#license-file).
- `.env.example`: lists the environment variables to copy into a local `.env` or into Replit Secrets.
- `.gitignore`: keeps Python caches, virtual environments, `.env` and editor/OS files out of Git.
- `.replit`: tells Replit to run `python src/main.py`.
- `requirements.txt`: Python dependencies; only `runpod` so far.
- `docs/.gitkeep`: empty file that keeps the `docs/` folder (for screenshots and diagrams) in Git.
- `src/main.py`: placeholder entry point that prints a greeting and summary statistics for a hard-coded list.
- `src/utils.py`: the two helper functions `format_greeting` and `summarize`.
- `runpod/handler.py`: placeholder RunPod Serverless handler that echoes the prompt back.
- `tests/test_utils.py`: `unittest` tests for the two helpers.
- `submission/REPLIT PROOF OF USE.pdf`: one-page placeholder for the team's proof of Replit use.
- `submission/RUNPOD PROOF OF USE.pdf`: one-page placeholder for the team's proof of RunPod use.
- `submission/Submission Template SDC Hackathon.pdf`: a 6-page older copy of the Phase 1 proposal template.

## README template

The full `README.md`, with its wording unchanged. Two of its sections are marked _(Required)_: "How We Use Replit" and "How We Use RunPod", each linking a proof-of-use PDF in `submission/`. Its closing checklist also asks for the completed submission template in `submission/`, slide deck and demo video links, verified run steps, and no committed secrets.

````markdown
# Project Name

> A one-sentence description of what your project does and who it is for.

---

## Team Information

| Field                 | Details                                          |
| --------------------- | ------------------------------------------------ |
| **Team Name**         | Your Team Name                                   |
| **Team Domain**       | Domain 1 / Domain 2 _(choose one)_               |
| **SDG Track (1–17)**  | e.g. SDG 11 — Sustainable Cities and Communities |
| **Team Leader**       | Leader Name                                      |
| **University**        | University Name(s)                               |
| **Number of Members** | e.g. 4                                           |

## Links

| Resource          | Link                                           |
| ----------------- | ---------------------------------------------- |
| GitHub Repository | https://github.com/your-username/your-project  |
| Replit Project    | https://replit.com/@your-username/your-project |
| Live Demo         | https://your-project.replit.app                |
| RunPod Endpoint   | https://api.runpod.ai/v2/your-endpoint-id      |
| Slide Deck        | https://example.com/slides                     |
| Demo Video        | https://example.com/demo-video                 |

---

## Overview

### Problem

Describe the real-world problem you are solving in 2–4 sentences. Who is affected, and why does it matter?

### Solution

Explain how your project uses AI to solve the problem and what makes it valuable.

### Key Features

- **Feature 1** — Short description.
- **Feature 2** — Short description.
- **Feature 3** — Short description.

### Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| Frontend      | e.g. HTML, React             |
| Backend       | e.g. Python, Flask / FastAPI |
| Database      | e.g. PostgreSQL, SQLite      |
| AI / Compute  | RunPod (GPU)                 |
| Hosting / Dev | Replit                       |

---

## Project Structure

```
.
├── docs/                    # Screenshots, diagrams
├── runpod/
│   └── handler.py           # RunPod serverless handler (GPU workload)
├── src/
│   ├── main.py              # Application entry point
│   └── utils.py             # Helper functions
├── submission/              # Required submission documents
│   ├── REPLIT PROOF OF USE.pdf
│   ├── RUNPOD PROOF OF USE.pdf
│   └── Submission Template SDC Hackathon.pdf
├── tests/
│   └── test_utils.py        # Unit tests
├── .env.example             # Example environment variables
├── .gitignore
├── .replit                  # Replit run configuration
├── LICENSE
├── requirements.txt         # Python dependencies
└── README.md
```

### Architecture

```
User ──► Replit (App / API) ──► RunPod Endpoint (GPU model)
                │
                └──► Response returned to user
```

---

## How to Run

### Option 1 — Run on Replit (Recommended)

1. Open the [Replit Project](https://replit.com/@your-username/your-project), or import this repository via **Create Repl → Import from GitHub**.
2. Open the **Secrets** tab (🔒) and add the variables listed in `.env.example`:
   - `RUNPOD_API_KEY`
   - `RUNPOD_ENDPOINT_ID`
3. Click **Run**. Replit uses the `.replit` file to start `python src/main.py`.

### Option 2 — Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-project.git
cd your-project

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env            # then fill in your values

# 5. Run the app
python src/main.py
```

### Run Tests

```bash
python -m unittest discover tests
```

---

## How We Use Replit _(Required)_

Describe how your team used Replit. For example:

- **Development:** Collaborative coding in a shared Repl using Multiplayer.
- **Hosting:** The app is deployed with Replit Deployments at the Live Demo link above.
- **Secrets:** API keys are stored in Replit Secrets, never in the code.

📄 Proof of use: [`submission/REPLIT PROOF OF USE.pdf`](submission/REPLIT%20PROOF%20OF%20USE.pdf)

## How We Use RunPod _(Required)_

Describe how your team used RunPod. For example:

- **Workload:** Model inference (e.g. text generation, image processing) runs on a RunPod GPU.
- **Setup:** `runpod/handler.py` is deployed as a **RunPod Serverless Endpoint**.
- **Integration:** The Replit app sends requests to the endpoint using `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID`.

Example request:

```bash
curl -X POST https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "Hello"}}'
```

📄 Proof of use: [`submission/RUNPOD PROOF OF USE.pdf`](submission/RUNPOD%20PROOF%20OF%20USE.pdf)

---

## Challenges & Learnings

- What challenges did you face, and how did you overcome them?
- What did your team learn?

## Future Improvements

- [ ] Improvement 1
- [ ] Improvement 2

## Team

| Name        | Role                | GitHub                                   |
| ----------- | ------------------- | ---------------------------------------- |
| Member Name | Team Lead / Backend | [@username](https://github.com/username) |
| Member Name | Frontend            | [@username](https://github.com/username) |
| Member Name | AI / RunPod         | [@username](https://github.com/username) |

---

## Submission Checklist

- [ ] Team name, domain (Domain 1 / Domain 2) and SDG track filled in
- [ ] Slide deck link added
- [ ] Demo video link added
- [ ] Replit used, with proof of use in `submission/`
- [ ] RunPod used, with proof of use in `submission/`
- [ ] Submission template completed in `submission/`
- [ ] "How to Run" steps verified
- [ ] No API keys or secrets committed to the repository

## License

This project is licensed under the [Apache License 2.0](LICENSE).
````

## Configuration files

### Environment variables example

`.env.example`:

```shell
# Copy this file to .env (local) or add these to Replit Secrets.
# Never commit your real .env file.
PROJECT_NAME="Project Name"
RUNPOD_API_KEY=your-runpod-api-key
RUNPOD_ENDPOINT_ID=your-endpoint-id
```

### Replit run configuration

`.replit` (TOML):

```toml
run = "python src/main.py"
entrypoint = "src/main.py"

[nix]
channel = "stable-24_05"
```

### Python requirements

`requirements.txt`:

```text
# Add your project dependencies here, one per line.
runpod
```

### Git ignore rules

`.gitignore`:

```gitignore
# Python
__pycache__/
*.py[cod]
venv/
.venv/

# Environment
.env

# OS / Editor
.DS_Store
.vscode/
.idea/
```

## Code files

All four are placeholders meant to be replaced with the team's own code.

### Application entry point

`src/main.py`:

```python
"""Application entry point.

Replace this file with your project's main logic.
"""

import os

from utils import format_greeting, summarize


def main() -> None:
    project_name = os.getenv("PROJECT_NAME", "Project Name")
    print(format_greeting(project_name))

    sample_data = [12, 7, 3, 21, 9]
    print(f"Result: {summarize(sample_data)}")


if __name__ == "__main__":
    main()
```

### Helper functions

`src/utils.py`:

```python
"""Helper functions used across the project."""


def format_greeting(name: str) -> str:
    """Return a welcome message for the given project name."""
    return f"Welcome to {name}!"


def summarize(values: list[float]) -> dict:
    """Return basic statistics for a list of numbers."""
    if not values:
        return {"count": 0, "min": None, "max": None, "average": None}
    return {
        "count": len(values),
        "min": min(values),
        "max": max(values),
        "average": round(sum(values) / len(values), 2),
    }
```

### RunPod serverless handler

`runpod/handler.py`:

```python
"""RunPod serverless handler.

Deploy this file as a RunPod Serverless Endpoint.
Replace the placeholder logic with your model inference.
"""

import runpod


def handler(job: dict) -> dict:
    prompt = job["input"].get("prompt", "")
    # TODO: load your model and run inference here
    return {"output": f"Echo: {prompt}"}


runpod.serverless.start({"handler": handler})
```

### Unit tests

`tests/test_utils.py`:

```python
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from utils import format_greeting, summarize


class TestUtils(unittest.TestCase):
    def test_format_greeting(self):
        self.assertEqual(format_greeting("Demo"), "Welcome to Demo!")

    def test_summarize(self):
        result = summarize([1, 2, 3])
        self.assertEqual(result["count"], 3)
        self.assertEqual(result["average"], 2.0)

    def test_summarize_empty(self):
        self.assertEqual(summarize([])["count"], 0)


if __name__ == "__main__":
    unittest.main()
```

## Submission folder

### Proof-of-use sample PDFs

`submission/REPLIT PROOF OF USE.pdf` and `submission/RUNPOD PROOF OF USE.pdf` are one-page placeholders. Each page holds only two lines of text: the title ("REPLIT PROOF OF USE" or "RUNPOD PROOF OF USE") and "EXAMPLE ONLY". Neither says what the proof should contain (screenshots, logs, billing pages or anything else); the README links both by their exact file names.

### Older copy of the proposal template

`submission/Submission Template SDC Hackathon.pdf` is a 6-page Microsoft Word export, dated 18 October 2026, of the Phase 1 preliminary project proposal template. Its questions, word limits and file-name rule (`SDC2026_TeamName_Preliminary.pdf`) match the 14-page Canva version shared separately on Drive; the layout differences are listed in [Phase 1 preliminary project proposal template](submission-template.md#differences-from-the-older-copy-in-the-github-template). The repository has since replaced it with the Canva version; see [Changes since the zip](#changes-since-the-zip).

## License file

`LICENSE` is the standard, unmodified Apache License, Version 2.0 text, including the appendix with its `[yyyy]` and `[name of copyright owner]` placeholders. The README's last section says the project is licensed under it.

## Changes since the zip

Checked on 29 October 2026 against commit [`d748202`](https://github.com/michaelzhngg/SDC_Hackathon_Submission_Template/tree/d748202), the repository's last push, on 24 October. Only the `submission/` folder and the README changed; the code, configuration files, tests and `LICENSE` are the same as in the zip.

- **Submission file names** (19 October): the PDFs follow the `SDC2026_TeamName_*.pdf` pattern, and a technical tools declaration joins them:
  - `REPLIT PROOF OF USE.pdf` became `SDC2026_TeamName_Replit_POU.pdf`, otherwise unchanged.
  - `RUNPOD PROOF OF USE.pdf` became `SDC2026_TeamName_Runpod_POU.pdf`, otherwise unchanged.
  - `Submission Template SDC Hackathon.pdf` became `SDC2026_TeamName_Preliminary.pdf`.
  - `SDC2026_TeamName_TechDeclaration.pdf` is new.
- **Templates** (21 October): `SDC2026_TeamName_Preliminary.pdf` and `SDC2026_TeamName_TechDeclaration.pdf` are now the 14-page [Phase 1 preliminary project proposal template](submission-template.md) and the 16-page [Technical Tools Declaration template](technical-tools-declaration-template.md), with the same text as the Canva PDFs on Drive.
- **README** (19 October, except where noted):
  - A callout at the top links the [participant Drive folder](https://drive.google.com/drive/folders/1xw7c2aN8N-at8hPEULzkcU76e_FFb0Ef): "All required submission templates are in the Google Drive folder below. Download them before you start."
  - The project structure tree and both proof-of-use links use the new file names.
  - The checklist replaces "Submission template completed in `submission/`" with three items: "Preliminary submission completed (`SDC2026_TeamName_Preliminary.pdf`)", "Technology declaration completed (`SDC2026_TeamName_TechDeclaration.pdf`)" and "Submission files renamed with your team name (replace `TeamName`)".
  - The Links table no longer has the "Replit Project" row (24 October).

## See also

- [Phase 1 preliminary project proposal template](submission-template.md)
- [Technical tools declaration template](technical-tools-declaration-template.md), which asks for the live prototype URL and the code repository URL
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
