---
name: ship-pr
description: "Get a branch ready to push and open as a PR the way Mike does it: calibrated commit subjects, one new commit per round with no amend or force-push, gh writes via env -u GITHUB_TOKEN, a local Docker image build, a PR body under 1007 characters, a GIF capture or an explicit no-GIF line, then stop and show the push and gh pr create commands. Use whenever work on a branch is finished or the user says ship it, open a PR, push this, write the PR description, add a commit to the PR, or asks what is left before pushing."
license: MIT
---

# Ship a PR

Mike has hand-cut PR bodies, commit bodies and Jira comments repeatedly. Every limit here
was set after one of those cuts. The failure mode is the same each time: the artifact
becomes a diary of how the work went instead of the one thing a reviewer needs.

## Recall first

```bash
memorygraph recall --query "pull request <repo>" --limit 10
```

## Branch

Must already be `mike/<KEY or type>/<slug>` off the repo default branch (`develop` in
`frontend` and `ollie`, `main` elsewhere). If HEAD is a default branch or off-convention,
stop and offer `git switch -c` or `git branch -m`. Do not rename a pushed branch.

## Commit

Subject: conventional-commit type, imperative, ticket key at the END.

```
fix: Disable autocorrect on the answer input INTER-1737
```

Body: at most one or two sentences, often none. No co-author trailer. Reasoning that
does not fit goes in the Jira ticket, not the commit.

**History is append-only.** Each review round or fix is a NEW commit on top. Never
`--amend`, rebase, or force-push to tidy a branch, even for review fixes. A force-push
destroys the record of what a review round changed and orphans inline review comments
(their `line` goes null). Squashing happens at merge time if the repo squash-merges.
"Put this in one commit" means group THESE new fixes into one new commit, not rewrite
existing ones. Use `--amend` or `--force-with-lease` only when Mike asks for a rewrite
in those words.

## Pre-push checks

1. Tests, lint, build as the repo defines them (`just --list` at `~/code` shows recipes).
2. **Docker image, if the repo has a Dockerfile.** CI splits the image build into its
   own job, so green tests say nothing about it. The classic break: a new build input
   that exists on the CI runner but is not in any `COPY`. Run `docker info` first; if
   Docker Desktop is closed, ask Mike to start it. Do not skip and call it verified.
3. **Runtime smoke test for any dependency change on the request path.** A green build
   is not evidence for a runtime library (cookie 2.x passed lint and build and threw on
   the first request). Exercise the actual API.
4. Files the build now needs are tracked. Personal ignores (`.tokensave/`, `.idea/`,
   `.claude/settings.local.json`) live in `~/.gitignore_global`, never a repo
   `.gitignore`. Check with `git check-ignore -v <path>`.

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
6. The Jira link.

Nothing else survives: no headings, no checklists, no test plan, no file walkthrough,
no verification receipts, no "also noticed", no offers of further work. Anything that
took real digging goes in memorygraph or `~/code/research/`. Title stays
conventional-commit with no ticket key; several repos enforce that in CI.

If editing an existing PR body, read it first with `gh pr view N --json body`. Mike often
rewrites it himself, and the preview bot appends a `PREVIEW_DEPLOYMENT` block that must
survive a replace.

## GIF

Every PR with a user-visible change carries a GIF. Record it with
`mcp__claude-in-chrome__gif_creator` against the local Caddy host
(`https://<app>-local.theatlantic.com`), with extra frames before and after each action,
saved to the scratchpad. Uploading is manual: GitHub's attachment endpoint is
browser-only, so tell Mike where the file is. Do not host it on a gist without asking;
a raw gist URL is publicly fetchable.

When a GIF genuinely cannot show the change (mobile IME behaviour, native OS chrome,
device-only crashes, backend-only work), do not silently omit it. One bolded line:

```
**No GIF on this one:** the change is only visible on a real Android soft keyboard mid-word.
```

## gh writes

`GITHUB_TOKEN` in this environment lacks `repo` scope. `gh pr create` fails with
"Could not resolve to a Repository", which is a scope error, not a missing repo. Prefix
every write with `env -u GITHUB_TOKEN` so gh falls back to the keyring account.

## Stop here

Commit locally, then show the exact commands and wait:

```bash
git push -u origin mike/INTER-1234/slug
env -u GITHUB_TOKEN gh pr create --title "fix: ..." --body-file /tmp/pr-body.md
```

Approval is per push. An earlier "push it" does not cover the next branch or a
follow-up commit on this one. Same for `gh pr edit` on a PR that already has review
comments. Never say "ready to merge" or offer to merge; report CI status and merge
order, then stop.

## After a push, if asked about review status

A clean CodeRabbit pass creates no review object. Check the walkthrough comment's
`updated_at` via `gh api repos/{o}/{r}/issues/{n}/comments` against the push time.

## Memory

```bash
memorygraph store --type solution --title "<repo> PR #N: <what>" --content "<decisions>" --tags "<repo>,pull-request,<component>"
```
