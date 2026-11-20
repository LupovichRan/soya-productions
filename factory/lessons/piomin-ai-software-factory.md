# Lessons from piomin/ai-software-factory

Source: https://github.com/piomin/ai-software-factory and the author's blog (Oct 2026 posts on Tekton + Claude Code and OpenCode on Kubernetes). Read on 2026-11-20 through a fetch summary; the pipeline YAML was not read, so treat details as the README's claims, not verified behaviour.

## What it is
A self-hosted factory on OpenShift. A GitHub issue or an "@ai" comment becomes a pull request, through Tekton pipelines and a coding agent talking to an open model on GPU nodes. It works on existing Java repos, is triggered by people, and has no research or idea-picking step. Ours is the opposite shape: scheduled, picks its own idea, tiny static apps, no cluster.

## Ideas we take (small, free, fit our shape)
1. **Research can browse, the builder cannot.** Web pages are untrusted input. The trend-reading step may fetch; the build step works from the brief it wrote, with no web. Added to FACTORY.md.
2. **A run never holds a merge right.** The author's own agent step has no GitHub credentials; publishing is a separate step. Our rule "a run opens a pull request and never merges" already matches; we keep it.
3. **Checks outside the agent.** The README admits nothing else checks the code unless you add it. Ours is CI (tests, syntax, no-build-tools guard, secret scan). A run must be green before Ran is asked to look.
4. **Bounded fixing.** Three fix attempts, then stop and open the PR as a draft saying what is red. Added to FACTORY.md.
5. **Plan before code.** Post a short checklist first so a bad run is cheap to stop. Our brief and decision record do this; the PR description should repeat it in three lines.
6. **Only trusted triggers.** Owner/member only, no bots, no forks, signed webhooks. We have no webhook; the only trigger is our own schedule. If we add one, copy this.
7. **Do not auto-merge** unless branch protection and required checks exist. The README warns that without protection the PR merges at once.

## Ideas we skip, and why
- OpenShift, Tekton, GPUs, vLLM: far heavier than a static-app factory needs, and the cost is never stated by the author.
- Auto-merge: Ran reviews every app.
- Versioned skills as an OCI artifact: our playbook is one file in the repo, which is simpler and reviewable.

## Cautions
- The README says "Nothing verifies the code after the agent finishes" in one place and describes a verify stage in another; unresolved without the YAML.
- No success rate or cost per run is published.
