---
name: preflight-and-ship
description: "Self-review a finished branch before anyone else sees it: run a high-effort code review, rank the findings, fix what is in scope, rerun the tests, squash the unpushed commits to one, then hand off to ship-pr and stop at the push. Use when the user says review then squash, do a code-review on my changes before pushing, preflight this, or check the PRs before I send them to the team."
license: MIT
---

# Preflight and ship

Read `~/.claude/skill-context/preflight-and-ship.md` first if it exists. It holds this environment's specifics and wins over anything general here.

The user would rather hear a finding from this review than from a teammate's. It runs once per branch, before the first push, so the team reviews a single clean commit.

## 1. Review

1. Confirm the branch follows the naming convention and sits on the default branch (`ship-pr` covers the rule).
2. Run `/code-review high` against the branch diff. Never pass `--comment`.
3. Re-sort the findings with the `review-pr-scoped` skill: blocking, non-blocking in scope, and non-blocking that expands scope.

## 2. Fix

Fix blocking and in-scope findings. Before applying a fix, read the code it touches and confirm the finding is real; drop false positives silently. Scope-expanding findings go in a short list for the user, unfixed.

Rerun the repo's tests, lint and build, plus the runtime smoke test if a dependency moved. The step is done when everything is green, or when a red check is shown to fail on the default branch too.

## 3. Squash

Squash only commits that have never left the machine:

```bash
git fetch origin
git log --oneline @{upstream}..HEAD 2>/dev/null || git log --oneline origin/<default>..HEAD
```

- **Branch never pushed**: `git reset --soft $(git merge-base HEAD origin/<default>)`, then one commit with a calibrated subject (the `ship-pr` rules).
- **Branch already pushed**: squash only the unpushed commits into one new commit on top. Rewriting pushed history needs the user's words "force push".

Several repos in one pass: do every repo, then report a table of repo, branch, commit subject and test result.

## 4. Hand off

Run the `ship-pr` skill for the PR body, the GIF decision and the pre-push checks it owns. It ends by showing the push and `gh pr create` commands. Stop there.

## Report

Lead with a single line: N findings, N fixed, N dropped as false positives, N left for the user. Follow it with the scope-expanding list, then the commands.
