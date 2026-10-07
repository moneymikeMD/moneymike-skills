---
name: ship-pr
description: "Get a branch ready to push and open as a PR the way the user does it: calibrated commit subjects, one new commit per round with no amend or force-push, a local Docker image build, a PR body under 1007 characters, a GIF capture or an explicit no-GIF line, then stop and show the push and gh pr create commands. Use whenever work on a branch is finished or the user says ship it, open a PR, push this, write the PR description, add a commit to the PR, or asks what is left before pushing."
license: MIT
---

# Ship a PR

Read `~/.claude/skill-context/ship-pr.md` first if it exists. It holds this environment's branch prefix, default branches, local hosts and gh quirks, and wins over anything general here.

Also read `memory.md` and `research.md` from that directory if they exist: they say how this environment recalls and stores memories and where its research files live. With no memory store set up anywhere, skip the recall and store steps below and tell the user what was not stored; with no research directory, do the same for research-file appends.

The user has hand-cut PR bodies, commit bodies and ticket comments repeatedly. Every limit here was set after one of those cuts. The failure mode is the same each time: the artifact becomes a diary of how the work went instead of the one thing a reviewer needs.

## Recall first

Recall from the memory store before anything else (how: `memory.md`): query `pull request <repo>`, limit 10.

## Branch

Must already be `<prefix>/<KEY or type>/<slug>` off the repo default branch. If HEAD is a default branch or off-convention, stop and offer `git switch -c` or `git branch -m`. Do not rename a pushed branch.

## Commit

Subject: conventional-commit type, imperative. The ticket key lives in the branch name only, never in the subject.

```
fix: Disable autocorrect on the answer input
```

Body: at most one or two sentences, often none. No co-author trailer. Reasoning that does not fit goes in the ticket, not the commit.

**History is append-only.** Each review round or fix is a NEW commit on top. Never `--amend`, rebase, or force-push to tidy a branch, even for review fixes. A force-push destroys the record of what a review round changed and orphans inline review comments (their `line` goes null). Squashing happens at merge time if the repo squash-merges. "Put this in one commit" means group THESE new fixes into one new commit, not rewrite existing ones. Use `--amend` or `--force-with-lease` only when the user asks for a rewrite in those words.

## Pre-push checks

1. Tests, lint, build as the repo defines them.
2. **Docker image, if the repo has a Dockerfile.** CI splits the image build into its own job, so green tests say nothing about it. The classic break: a new build input that exists on the CI runner but is not in any `COPY`. Run `docker info` first; if Docker Desktop is closed, ask the user to start it. Do not skip and call it verified.
3. **Runtime smoke test for any dependency change on the request path.** A green build is not evidence for a runtime library (cookie 2.x passed lint and build and threw on the first request). Exercise the actual API.
4. Files the build now needs are tracked. Personal ignores (`.tokensave/`, `.idea/`, `.claude/settings.local.json`) live in `~/.gitignore_global`, never a repo `.gitignore`. Check with `git check-ignore -v <path>`.

## PR body

Hard ceiling **1007 characters** for the whole body. Count it:

```bash
wc -c < /tmp/pr-body.md
```

Shape, in this order and nothing more:

1. One line on what changed.
2. One short paragraph on why, or the one fact a reviewer cannot get from the diff.
3. A note on approval if a PM or editor signed off.
4. One line on any testing caveat.
5. The GIF, or the no-GIF line (below).
6. The ticket link.

Nothing else survives: no headings, no checklists, no test plan, no file walkthrough, no verification receipts, no "also noticed", no offers of further work. Anything that took real digging goes in the memory store or the research files. Title stays conventional-commit with no ticket key; repos often enforce that in CI.

If editing an existing PR body, read it first with `gh pr view N --json body`. The user often rewrites it themselves, and bots may append blocks (a preview-deployment block, for one) that must survive a replace.

## GIF

Every PR with a user-visible change carries a GIF. Record it with `mcp__claude-in-chrome__gif_creator` against the local dev host, with extra frames before and after each action, saved to the scratchpad. Uploading is manual: GitHub's attachment endpoint is browser-only, so tell the user where the file is. Do not host it on a gist without asking; a raw gist URL is publicly fetchable.

When a GIF genuinely cannot show the change (mobile IME behaviour, native OS chrome, device-only crashes, backend-only work), do not silently omit it. One bolded line:

```
**No GIF on this one:** the change is only visible on a real Android soft keyboard mid-word.
```

## Stop here

Commit locally, then show the exact commands and wait:

```bash
git push -u origin <prefix>/ABC-1234/slug
gh pr create --title "fix: ..." --body-file /tmp/pr-body.md
```

Approval is per push. An earlier "push it" does not cover the next branch or a follow-up commit on this one. Same for `gh pr edit` on a PR that already has review comments. Never say "ready to merge" or offer to merge; report CI status and merge order, then stop.

## After a push, if asked about review status

A clean CodeRabbit pass creates no review object. Check the walkthrough comment's `updated_at` via `gh api repos/{o}/{r}/issues/{n}/comments` against the push time.

## Memory

Store a `solution` titled `<repo> PR #N: <what>`, content `<decisions>`, tags `<repo>,pull-request,<component>`.
