---
name: ci-fix
description: "Get a red CI run green: read the failing job's log, rerun it straight away when the failure is flaky or infrastructure, otherwise reproduce it locally, fix it, bring the branch up to date with its base (resolving lockfile conflicts), and commit, stopping before the push. Use when the user pastes a GitHub Actions run or job URL, says CI or a check is failing, static analysis won't pass, or asks to investigate a job failure."
license: MIT
---

# CI fix

Read `~/.claude/skill-context/ci-fix.md` first if it exists. It holds this environment's specifics and wins over anything general here.

## 1. Read the failure

```bash
gh run view <run-id> --log-failed          # from a job URL, the run id is the number after /runs/
gh pr checks <pr>                          # when given a PR or the current branch instead
```

Identify the failing step and its first real error. A cascade of later errors is noise.

## 2. Classify

| Class | Signs | Action |
|---|---|---|
| **Flaky or infra** | network timeout, registry 5xx, runner lost, rate limit, a test that passes on rerun history, cache restore failure | `gh run rerun <run-id> --failed`, watch it with `gh run watch <run-id> --exit-status`, report. No question first. |
| **Stale branch** | the failure is fixed on the base branch, or the job checks something the base changed | update the branch (step 4) |
| **Real** | the diff caused it | reproduce and fix (step 3) |
| **Not ours** | an expired secret, a broken org workflow, a third-party outage | stop and report who owns it |

A rerun that fails the same way reclassifies the failure as real. Rerun once, not in a loop.

## 3. Reproduce and fix

Run the same command the job ran, with the same Node, Python or tool version the workflow pins (read the workflow file). The step is done when it goes red locally on the same error, or when you can say why it can't reproduce. Fix it, rerun it green, and run the rest of the repo's checks.

## 4. Bring the branch up to date

Follow the repo's merge style. Rebase when the branch is unpushed or the user asked for a rebase; otherwise merge the base in. Lockfile conflict: take the base's lockfile, then reinstall to regenerate it (`yarn install`, `npm install`, `pod install`, ...). Never hand-merge a lockfile.

## 5. Stop

Commit with a conventional subject. Show the cause in one line, the fix, and the push command, then wait. A rebased, already-pushed branch needs `--force-with-lease`, and the user must say "force push".
