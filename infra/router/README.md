# Model router

One address for every tool, which picks the cheapest model that is up and moves to the next tier by itself when one is not. It uses [LiteLLM](https://github.com/BerriAI/litellm), an open-source (MIT) OpenAI-compatible proxy. Nothing here is a secret: keys and addresses come from environment variables.

| Name callers ask for | What it is | When it is used |
|---|---|---|
| `coder` | Your own small model, for example Qwen coder on one rented GPU | First, always |
| `coder-cheap` | A hosted open model with a free or low-priced tier | If `coder` is down, rate-limited or slow |
| `reviewer` | A stronger model | Only if you ask for it by name, or if `coder-cheap` fails |

## Run it

```bash
python3 -m venv .venv && .venv/bin/pip install "litellm[proxy]==1.110.2"
export LOCAL_BASE=http://127.0.0.1:11434/v1  LOCAL_KEY=…       # your tunnel to the small model
export CHEAP_BASE=https://…/v1               CHEAP_KEY=…       # the hosted model's address and key
export REVIEW_BASE=https://…/v1              REVIEW_KEY=…      # optional
export ROUTER_KEY=…                          # anything you choose; callers send it
.venv/bin/litellm --config infra/router/config.yaml --port 4000
```

Edit the three `model:` lines in `config.yaml` to the names your servers use. Remove the `reviewer` tier and its fallback line if you do not use one. Bind it to localhost, and do not put it on the internet without a proxy in front.

## Use it from the decision maker

```bash
LLM_BASE_URL=http://127.0.0.1:4000/v1 LLM_API_KEY=$ROUTER_KEY LLM_MODEL=coder \
LLM_BASE_URL_DEEP=http://127.0.0.1:4000/v1 LLM_MODEL_DEEP=reviewer \
node factory/decision-maker/server.mjs
```

The decision maker's second look only means something when it is a different model from the first. `reviewer` has no fallback to `coder`, so that holds; keep it that way.

## What was tested (20 November 2026)

With a small local model standing behind every tier and the first tier pointed at a dead address on purpose: a request for `coder` was answered by `coder-cheap` after one fallback (`x-litellm-attempted-fallbacks: 1`), a JSON-mode request passed through, and a request with no key got 401. **Not tested:** a real hosted model, a real second-tier rate limit, or the Vast.ai tunnel. Those need keys and your computer.

## Why a router, in plain words

Most of the work (boilerplate, tests, strings) can go to the cheap model, and only the hard or risky choices need the strong one. A router means no tool has to know which is which, and a model going down does not stop the factory.
