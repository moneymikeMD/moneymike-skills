---
name: dependabot-sweep
description: "Vet open Dependabot PRs, major and minor/patch, across a set of repos: check out each one, install, test, build and run the app, fold the safe minor and patch bumps into one branch per repo, fix code that a major breaks, and write a short note for each PR on how the branch was vetted, for the user to post before merging. Use when the user asks to go through or clear the Dependabot PRs, check whether an upgrade is safe to merge, or catch repos up on dependencies."
license: MIT
---

# Dependabot sweep

Read `~/.claude/skill-context/dependabot-sweep.md` first if it exists. It lists the repos in scope, the agreed version policy (pins, ignores, runtime versions) and the design file behind it, and wins over anything general here. Also read `research.md` and `memory.md` there if they exist.

The user merges. This skill's output is the evidence that makes merging a quick decision, and a note they can post that shows the team how the branch was checked.

## 1. Inventory

For each repo: `gh pr list --author app/dependabot --state open --json number,title,headRefName,labels,statusCheckRollup,createdAt`. Classify each PR:
- **major**: one package across a major version,
- **minor/patch**: a group or a single minor or patch bump,
- **security**: from a security advisory, whatever its size; these go first.

Report a table: repo, PR, kind, CI state. A PR whose CI is red because of a known policy issue (a version the policy pins below) is closed or ignored per the policy, not fixed.

## 2. Vet each PR

Work in a worktree for each PR (as in `pr-local-test`), so nothing disturbs the user's checkouts:

1. Install exactly from the lockfile (`yarn install --frozen-lockfile`, `npm ci`, ...).
2. Run the repo's full checks: lint, typecheck, tests, build, and the Docker image build if the repo has a Dockerfile.
3. **Run the app.** Start it with the context file's recipe and exercise the main path, because a green build says nothing about a runtime library. For a major bump, read the package's changelog or migration guide for the versions crossed, and check every breaking change against the repo's usage (search for the APIs it names).
4. Verdict: **SAFE**, **NEEDS CODE** (with the breaking change and the files that need it), or **BLOCKED** (upstream bug, peer conflict, or the policy says hold).

For a package that hasn't been updated in a year or more, check whether the ecosystem has moved to a successor before upgrading it. Recommend the switch when the successor is clearly where the community went.

## 3. Consolidate

The team reviews once. Per repo, on a branch named for the sweep's ticket:
- cherry-pick or re-apply every SAFE minor/patch bump,
- add the NEEDS CODE majors with their code fixes, one commit per package,
- regenerate the lockfile once at the end, then rerun step 2 on the combined branch.

Offer options when a fix is a real choice (migrate to a successor, pin, or patch around), rather than picking silently.

## 4. The vetting note

For each PR to merge (Dependabot's own, or the consolidated one), draft a comment of at most 4 lines in the user's voice:

```
Vetted locally: <install>, <checks run> green, ran the app and <what was exercised>.
<major only: breaking changes checked: X, Y; fixed in <sha> / not used here.>
```

No CI restatement and no changelog dump. The note says what a person would otherwise ask.

## 5. Stop

Show the per-repo verdict table, the branches, the notes, and the push and `gh pr create` commands, then wait. Never merge. Once approved, go through `multi-repo-wave` step 5 to push and open them together.

## After

Append any upgrade gotcha to the research file through `research-file-update`, and store a `fix` titled `<package> <from>-><to>: <breaking change>`. Tags `dependabot,<repo>`.
