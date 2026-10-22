---
name: multi-repo-wave
description: "Apply one change across several repos in parallel: write a single brief, fan it out to one agent per repo (headless for batch jobs, terminal-multiplexer panes when the user wants to watch), have each stop before pushing, then audit every diff side by side for drift and misses, squash, and push and open all the PRs together on one approval. Use when the user says do the same for the other repos, across all the games or repos, in batches, or in waves."
license: MIT
---

# Multi-repo wave

Read `~/.claude/skill-context/multi-repo-wave.md` first if it exists. It lists the repo groups, their default branches and where they are cloned, and wins over anything general here. If a terminal multiplexer skill has a context file, read that too.

The value of doing repos in a wave, not one at a time, is one review for the team and one approval from the user. Both are lost if repos drift apart, so the audit in step 4 is the point, not an extra.

## 1. Write one brief

One prompt that every repo agent gets verbatim, plus a per-repo line for anything that differs. It contains:
- the ticket key and the design source (a spec file, the ticket, or the first repo's finished diff as the reference),
- what to change and what not to touch,
- the branch name (`<prefix>/<KEY>/<slug>`, the same slug in every repo, off each repo's default branch),
- the checks to run (install, test, lint, build, and running the app if it has one),
- the stop: "commit locally, do not push, print a summary: branch, commits, check results, anything you were unsure of".

If the first repo is a pilot (Option A: perfect one, then copy), finish it and review it with the user before writing the brief from its diff.

## 2. Fan out

- **Batch job** (generate, upgrade, apply a known edit): headless agents, several in parallel, each in its own repo directory. Headless agents can't answer a permission prompt, so the brief must not require a push.
- **Watchable work** (judgement calls, likely questions): one multiplexer pane per repo, started in the permission mode the context file names.

At most 4 at once unless the user says otherwise. Each agent edits only its own repo; nothing writes a shared file.

## 3. Collect

Wait for every agent. A failed or confused agent gets its repo redone in this session, not a blind retry.

## 4. Audit across the wave

Put the diffs side by side (`git -C <repo> diff origin/<default>...HEAD` for each) and check:
- the same change is expressed the same way everywhere, or the difference is justified by the repo,
- nothing the brief asked for is missing in any repo,
- nothing outside the brief changed (formatting churn, lockfile drift, stray files),
- every repo's checks are green.

Fix drift in place. Report a table: repo, branch, commit subject, checks, notes.

## 5. Squash and ship together

Squash each repo's unpushed commits to one, with the same subject across repos where the change is the same (`preflight-and-ship` has the squash rule). Write each PR body with `ship-pr`, and have them cross-link each other. Then show every push and `gh pr create` command as one block and wait for one approval covering the whole wave. If the user approves several waves, open them at the same time.
