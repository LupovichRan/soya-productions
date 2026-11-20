# Hosting, delivery and security — decisions

Written 20 November 2026. What Soya Productions needs to run, where each piece should live, and whether to build it, use open source, or pay. Free and open source are tried first.

## Where things stand

- **No cloud account is connected.** The session that wrote this had no working sign-in to AWS, Azure or Google Cloud, so nothing has been created in any of them and nothing here has cost anything.
- **Accounts must be opened by Ran.** A cloud account needs a real person's identity, a payment card and a phone check, and it carries legal terms. That is not something an assistant should do in someone's name. Sign-up links are at the end.
- **The cloud files in this repository have not been run.** `infra/model-server/Dockerfile` and the "Deploy model server" workflow are written to the plan below and are marked "NOT YET RUN" until a first deploy proves them.

## What needs hosting

| # | Piece | Needs | Decision | Cost |
|---|---|---|---|---|
| 1 | The front page and the films | Static files | **Use GitHub Pages.** Already in use. Nothing to build. | Free |
| 2 | Checks on every change | A runner | **Use GitHub Actions.** Free for public repositories. | Free |
| 3 | Secret scanning | A scanner | **Use open source: gitleaks**, in CI, plus GitHub's own secret scanning and push protection (free on public repositories). | Free |
| 4 | The model for the decision maker | A computer with a few GB of memory | **Use open source: llama.cpp's server**, with an open-weight model. Where it runs is the one real choice; see below. | Free to a few dollars a month |
| 5 | The decision maker itself | Node | Runs wherever Claude runs. Nothing to host. | Free |
| 6 | The daily factory run | A scheduler | Already a Claude scheduled task. Nothing to host. | Part of the Claude plan |

Only piece 4 needs a server at all.

## Build, borrow or buy

| Need | Build it | Use open source | Pay for a service | Verdict |
|---|---|---|---|---|
| Serving a model with an OpenAI-style endpoint | Weeks of work, worse result | llama.cpp server (MIT) or Ollama (MIT) | A hosted model API | **Open source.** llama.cpp checks an API key by itself, so no gateway has to be written. Ollama has no key check and would need one in front. |
| The model | Not realistic | Open-weight models. Default: Qwen2.5 1.5B Instruct (Apache-2.0) | A commercial model | **Open weights.** Check the licence of each size; not every size of every family is Apache-2.0. |
| Protecting the endpoint | A small proxy | llama.cpp's own key | A managed API gateway | **Built in.** One long random key, kept in the cloud's secret store. |
| Describing the cloud set-up as code | — | OpenTofu (the open-source fork of Terraform) | Terraform Cloud | **Neither yet.** One service is deployed by one command in one workflow. Add OpenTofu when there are three or more cloud resources to keep in step. |
| CI | — | — | GitHub Actions (free here) | **Use it.** Self-hosting a CI server would cost more than it saves. |
| The decision maker | Done: 400 lines, no dependencies | Agent frameworks exist | — | **Built.** The method is Ran's own, and a framework would add dependencies to hide a few HTTP calls. |

## Where to run the model

The workload is unusual: a handful of requests a day, each taking seconds to a minute of CPU, and nothing in between. That favours anything that **scales to zero** and bills by the second.

| Option | Fits free allowance? | Scales to zero | Notes |
|---|---|---|---|
| **Your own computer**, with a tunnel when a cloud session needs it | Yes, entirely | — | The most private and the cheapest. Works only while the computer is on. |
| **Google Cloud Run** | Yes at this volume: 180,000 vCPU-seconds and 360,000 GiB-seconds a month with request-based billing, counted per billing account | Yes | Idle time is not billed. The first request after a pause is slow while the model loads. **Recommended cloud option.** |
| Azure Container Apps | Believed to have a similar monthly free grant; not verified for this document | Yes | A sound second choice. Verify the allowance before relying on it. |
| AWS Lambda with a container image | An always-free monthly allowance exists | Yes | 15-minute limit and 10 GB memory are enough, but packaging a model server for Lambda is fiddly. AWS's new-account credits ($100 to $200) run out after six months, and the free-plan account then closes. |
| An always-on small virtual machine (the free ones on all three clouds) | Yes | No | The free sizes have about 1 GB of memory, too little for a useful model. |
| A GPU anywhere | No | Some | Not needed for a 1.5B model making a few decisions a day. |

**Recommendation:** start on your own computer if one is usually on; otherwise Google Cloud Run. Use the $300 Google trial credit as a safety margin, not as the plan: the design should stay inside the always-free allowance.

Rough size of the free allowance: with 2 vCPUs and 4 GB, 180,000 vCPU-seconds is about 25 hours of running time a month. How long one decision takes on that hardware is not known yet; measure it on the first deploy.

## Delivery (CI/CD)

In this repository now:

- **`.github/workflows/ci.yml`** — on every pull request and on `main`: the decision maker's tests, a syntax check of every script, a check that `films.js` is well formed and every listed film exists, a guard against build tooling creeping in, and a gitleaks secret scan over the full history.
- **`.github/dependabot.yml`** — weekly updates for the actions the workflows use.
- **Deploying the sites** — GitHub Pages publishes `main`. A merge is the deploy.
- **`.github/workflows/deploy-model.yml`** — manual only. Builds the image, pushes it, deploys to Cloud Run.

Practices these follow:

1. **Least privilege.** Workflows ask for read access only; the deploy asks for one extra permission, to prove its identity.
2. **No stored cloud keys.** GitHub proves who it is to Google with a short-lived token (workload identity federation). There is no key file to leak.
3. **A person approves production.** The deploy runs in a GitHub environment where Ran is a required reviewer.
4. **Secrets live in a secret store**, never in the repository, an image, or a workflow file.
5. **Small blast radius.** One service, at most one instance, its own service account with no other permissions.
6. **Everything through pull requests.** `main` is protected; the factory never merges its own work.

Still to do by hand in GitHub settings (an assistant cannot change these):

1. Protect `main`: require a pull request and require the "Tests and syntax" and "Secret scan" checks to pass.
2. Turn on secret scanning and push protection (Settings → Code security).
3. Create the `model-server` environment and add yourself as required reviewer.
4. Later, pin each action to a full commit ID rather than a version tag; Dependabot will keep the pins current.

## One-time Google Cloud set-up (only if you choose Cloud Run)

1. Create a project and attach billing. Set a **budget alert at $1** so any charge is noticed.
2. Enable Cloud Run, Artifact Registry and Secret Manager. Create an Artifact Registry repository named `soya` in `us-central1`.
3. Create a secret named `soya-decider-key` holding a long random value.
4. Create two service accounts: one that may deploy (Cloud Run Admin, Artifact Registry Writer, Service Account User on the second), and one the service runs as (Secret Accessor on that one secret, nothing else).
5. Create a workload identity pool and provider for GitHub, restricted to the repository `LupovichRan/soya-productions`, and let it act as the deploy account.
6. In the repository's settings add the variables `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT` and `GCP_RUNTIME_SERVICE_ACCOUNT`. These are names, not secrets.
7. Run "Deploy model server" from the Actions tab and approve it.

Then the decision maker needs `LLM_BASE_URL` set to the service address followed by `/v1`, `LLM_MODEL` set to `decider`, and the key from step 3.

## Risks worth knowing

- **The endpoint is public** and protected by one key. Anyone with the key can use the model and spend the free allowance. At most one instance limits the damage; rotate the key if it is ever exposed.
- **A small model can be confidently wrong.** The decision maker reports its doubts, but its output is advice.
- **Free allowances change.** The figures above were checked on the date at the top; check again before relying on them.

## Opening the accounts

Each needs your name, a payment card and a phone number.

- Google Cloud: <https://cloud.google.com/free>
- AWS: <https://aws.amazon.com/free>
- Azure: <https://azure.microsoft.com/free>

Only Google Cloud is needed for the recommendation above, and none is needed if the model runs on your own computer.

## Sources

- [Cloud Run pricing (Google Cloud)](https://cloud.google.com/run/pricing)
- [AWS free plan and credits for new accounts (InfoQ, July 2025)](https://www.infoq.com/news/2025/07/aws-risk-free-account-credits)
- [AWS Free Tier explained, 2026 (Rackspace Spot)](https://spot.rackspace.com/blog/aws-free-tier)
- [What changed in the AWS Free Tier for 2026 (Tech Insider)](https://tech-insider.org/au/what-changed-in-the-aws-free-tier-for-2026/)
- [Cloud provider free tiers 2026 (freetier.co)](https://freetier.co/articles/cloud-provider-free-tiers-2026)
- [Cloud Free Tier Comparison (cloudcommunity on GitHub)](https://github.com/cloudcommunity/Cloud-Free-Tier-Comparison)
