# RunPod batch

Kotak drafts every O\*NET occupation's 6 skill corners and 18 can-do statements once, before the demo, on a RunPod serverless GPU (#77). This folder holds the deploy notes; the workload code is [`scripts/corners/run-batch.ts`](/scripts/corners/run-batch.ts).

Contents:

1.  [Workload](#workload)
1.  [Handler](#handler)
1.  [Model and GPU](#model-and-gpu)
1.  [Endpoint settings](#endpoint-settings)
1.  [Environment variables](#environment-variables)
1.  [Run the batch](#run-the-batch)
1.  [Example requests](#example-requests)
1.  [Cost and runtime estimate](#cost-and-runtime-estimate)
1.  [Proof for the declaration](#proof-for-the-declaration)
1.  [Test without a key](#test-without-a-key)
1.  [See also](#see-also)

## Workload

One chat request per occupation, 923 in all (#74):

1.  **Input.** The occupation's title, description and candidate groups from `data/generated/corner-groups.json`: its O\*NET tasks grouped by work activity (IWA) into at most 6 groups by fixed rules, with no AI. `bun run build:corner-groups` rebuilds that file.
2.  **Ask.** The prompt in [`packages/shared/src/corners/prompt.ts`](/packages/shared/src/corners/prompt.ts) asks the model to split or merge the groups into up to 6 corners, using only the occupation's own task IDs, and to draft for each corner a name, 3 yes/no can-do statements (basic, working, advanced), milestone hours, 1 to 3 SDG targets and free-resource search queries.
3.  **Constrain.** A JSON schema goes in `response_format`. vLLM's structured outputs make every token follow it, and its `task_ids` field only accepts that occupation's task IDs.
4.  **Check.** The post-validator in [`validate.ts`](/packages/shared/src/corners/validate.ts) rejects any task ID or IWA outside the occupation's lists, a corner without three tiered statements, an SDG tag or hours, an SDG code that is not a real target, and any resource that is not a search link. Code, not the model, builds corner IDs, IWA lists and the `https://www.google.com/search?q=` links.
5.  **Retry.** A rejected answer goes back to the model with its errors, up to 3 tries. HTTP 429, 5xx and timeouts back off and retry.
6.  **Write.** `data/generated/role-corners.json` (`quality: "auto-generated"`, `generated_by: "runpod"`) and the run summary `data/generated/role-corners-run.json`.

The batch makes no title embeddings: the job match route in #43 searches titles and asks Claude, and never reads embeddings.

## Handler

The stock RunPod vLLM worker, image `runpod/worker-v1-vllm:v2.28.0` (vLLM 0.30.0), is enough, so there is no custom handler. Its handler forwards the endpoint's OpenAI-compatible route (`/openai/v1/chat/completions`) to `vllm serve`, which accepts `response_format` JSON schemas. Pin that image tag so the run matches these notes.

## Model and GPU

- **Model:** `Qwen/Qwen3.8-27B-FP8`, open weights under Apache 2.0, a 31 GB FP8 checkpoint published by Qwen. A dense 27B model follows the grouping rules and writes short grounded statements well, and fits one GPU with room for 32 parallel requests.
- **Thinking off:** Qwen3.8 thinks by default. Each request sends `chat_template_kwargs: {"enable_thinking": false}`, and the JSON schema applies from the first token.
- **GPU:** `80 GB PRO` (H100) first, `80 GB` (A100) as the fallback. Both hold the weights plus the cache for 32 requests. A 48 GB card would leave little memory for the model's per-request state.
- **Fallback model:** if answers keep failing validation, redeploy with `Qwen/Qwen3.6-35B-A3B-FP8` (Apache 2.0, a mixture-of-experts model with 3B active parameters) and rerun. The runner keeps occupations that already passed.

## Endpoint settings

In the RunPod console, create a **Queue-based** serverless endpoint from the vLLM worker:

| Setting               | Value                                                            |
| --------------------- | ---------------------------------------------------------------- |
| Container image       | `runpod/worker-v1-vllm:v2.28.0`                                  |
| Model (cached models) | `Qwen/Qwen3.8-27B-FP8`, so the download is cached and not billed |
| GPU configuration     | `80 GB PRO`, then `80 GB`                                        |
| GPUs per worker       | 1                                                                |
| Active workers        | 0                                                                |
| Max workers           | 1, so GPU time equals the runtime in the summary                 |
| Idle timeout          | 5 s (default)                                                    |
| Execution timeout     | 600 s (default); one request takes well under 2 minutes          |
| FlashBoot             | On (default)                                                     |

## Environment variables

On the endpoint (**Manage**, **Edit Endpoint**, **Public Environment Variables**):

```shell
MODEL_NAME=Qwen/Qwen3.8-27B-FP8
MAX_MODEL_LEN=16384
MAX_NUM_SEQS=32
MAX_CONCURRENCY=32
VLLM_EXTRA_ARGS=--language-model-only
```

`MAX_MODEL_LEN` covers the longest prompt (about 3,000 tokens), a retry turn and 4,096 output tokens. `MAX_CONCURRENCY` lets one worker take the runner's 32 parallel requests. `--language-model-only` skips the vision encoder. The model is public, so no `HF_TOKEN`.

On your machine, in `.env` (names in `.env.example`; never commit values):

```shell
RUNPOD_API_KEY=...
RUNPOD_ENDPOINT_ID=...
```

## Run the batch

1.  Smoke test on the 3 demo roles in [`data/demo-roles.json`](/data/demo-roles.json), about US$0.50 with the cold start:

    ```shell
    bun run batch:corners --codes 15-1254.00,15-1255.00,43-3031.00
    ```

    Read their corners in `data/generated/role-corners.json` before spending more.

2.  Full run. It skips occupations already in the output, so it also resumes a stopped run:

    ```shell
    bun run batch:corners
    ```

3.  Codes that still fail are in `missing_codes` in `data/generated/role-corners-run.json`. Run the batch again for them. The final run left none, so the planned Claude backup (#79) was never needed.
4.  Set **Max workers** to 0 when done, so nothing more can bill.
5.  Commit `data/generated/role-corners.json` and `data/generated/role-corners-run.json`.

Options: `--codes` (comma-separated subset), `--concurrency` (default 32; keep it at `MAX_CONCURRENCY`), `--attempts` (default 3), `--force` (regenerate the given codes; an earlier answer stays until a new one passes), `--model` (default: the endpoint's served model), `--out` and `--summary` (file paths).

The first request waits for a worker to load the model; the runner polls `/openai/v1/models` for up to 30 minutes before sending the batch. Sampling is greedy (`temperature: 0`), but batched GPU runs are not bit-for-bit repeatable, so the committed file, not a rerun, is the record.

## Example requests

List the served model, which also wakes a worker:

```shell
curl https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/openai/v1/models \
  -H "Authorization: Bearer $RUNPOD_API_KEY"
```

A chat request with a JSON schema, the same shape the runner sends:

```shell
curl https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/openai/v1/chat/completions \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3.8-27B-FP8",
    "messages": [{"role": "user", "content": "Name one skill of a graphic designer as JSON."}],
    "temperature": 0,
    "max_tokens": 50,
    "chat_template_kwargs": {"enable_thinking": false},
    "response_format": {"type": "json_schema", "json_schema": {"name": "skill", "schema": {
      "type": "object", "properties": {"skill": {"type": "string"}},
      "required": ["skill"], "additionalProperties": false}}}
  }'
```

## Cost and runtime estimate

The sponsor credit is US$25 ([brief][brief-credits]). Serverless prices from the [RunPod pricing page][pricing] on 22 October 2026: `80 GB PRO` US$4.79 an hour, `80 GB` US$2.72 an hour, billed per second from worker start to stop; cached-model downloads are not billed.

- **Tokens:** prompts average about 4,900 characters, or about 1,200 tokens (measured over all 923 prompts); an answer of 6 corners is about 1,100 tokens. With 10% retries, which resend the rejected answer, that is about 1.5 million input and 1.1 million output tokens.
- **Runtime on an H100:** decoding 32 requests at once reads the 27 GB of weights per step, about 20 ms a step, or about 1,600 output tokens a second. That gives about 12 minutes of output, 3 minutes of prompt processing and up to 5 minutes of cold start: about 20 minutes, about 20 seconds per request.
- **Cost:** about US$1.60 for the full run, plus about US$0.50 for the smoke test. At 3 times slower than estimated, about US$5. An A100 runs about 1.7 times slower at 57% of the hourly price, so it costs about the same.

The run summary records the real runtime and token counts; the RunPod billing page records the real cost.

[brief-credits]: /docs/BRIEF.md#support-and-contacts
[pricing]: https://www.runpod.io/pricing

## Proof for the declaration

#70 compiles `submission/SDC2026_T010NG_Runpod_POU.pdf`. Capture during or right after the full run:

- The endpoint page, with the endpoint ID, the GPU type and the worker image.
- The **Workers** or **Logs** tab while the batch runs, showing vLLM serving requests.
- The **Metrics** or **Requests** tab with completed jobs and execution time.
- The billing page with the spend for the run.
- `data/generated/role-corners-run.json`: endpoint ID, GPU types, model, runtime, tokens and failures for every run.

## Test without a key

[`scripts/corners/stub-server.ts`](/scripts/corners/stub-server.ts) imitates the endpoint locally with placeholder answers, so the runner, parser and validator can be checked for free. `--plant-foreign` makes the first answer for a code carry a foreign task ID, which the validator must reject:

```shell
bun scripts/corners/stub-server.ts --plant-foreign 27-1024.00 --fail-first 2 &
RUNPOD_API_KEY=stub RUNPOD_ENDPOINT_ID=stub bun run batch:corners \
  --api-url http://localhost:8787/v2 --rest-url http://localhost:8787/v1 \
  --codes 27-1024.00,15-1252.00 --out /tmp/stub/role-corners.json --summary /tmp/stub/run.json
```

Never commit output from the stub.

## See also

- [RunPod vLLM worker](https://github.com/runpod-workers/worker-vllm) and its [configuration reference](https://github.com/runpod-workers/worker-vllm/blob/main/docs/configuration.md)
- [RunPod OpenAI compatibility](https://docs.runpod.io/serverless/vllm/openai-compatibility)
- [RunPod endpoint settings](https://docs.runpod.io/serverless/endpoints/endpoint-configurations) and [cached models](https://docs.runpod.io/serverless/endpoints/model-caching)
- [RunPod serverless pricing](https://docs.runpod.io/serverless/pricing)
- [vLLM structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html)
- [Qwen3.8-27B-FP8 model card](https://huggingface.co/Qwen/Qwen3.8-27B-FP8)
