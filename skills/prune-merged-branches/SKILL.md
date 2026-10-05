---
name: prune-merged-branches
description: "Delete local git branches whose PR has merged, with the safety checks the user expects and none of the questions. Use after a PR merges, when the user says clean up branches, prune, delete merged branches, or when a stale local branch is noticed while switching. Do not use for unmerged branches."
license: MIT
---

# Prune merged branches

Read `~/.claude/skill-context/prune-merged-branches.md` first if it exists. It holds this environment's specifics and wins over anything general here.

When a repo deletes the remote branch on merge, a local branch whose PR shows MERGED is pure bookkeeping. Delete it without asking. Everything else stays.

## Per branch

```bash
gh pr list --head <branch> --state all --json number,state,mergedAt
git status --porcelain
git stash list
git log origin/<default>..<branch> --oneline
```

Delete only when ALL hold: PR state is MERGED, working tree clean, no stashes referencing the branch, nothing unpushed. A branch with no PR, or an OPEN or CLOSED-unmerged PR, is never touched.

```bash
git switch <default>
git branch -d <branch>
git fetch --prune
```

## Two things that look wrong and are not

- Squash-merged PRs make `git branch -d` warn "merged to origin/<branch> but not yet merged to HEAD". Expected. Do not escalate to `-D`.
- `git branch -r` may still list a remote-tracking ref the server already deleted. That is stale local cache. Do not run `git push origin --delete`; `git fetch --prune` fixes it.

Report what was deleted and what was kept, one line each.
