---
name: pr-local-test
description: "Check out a PR or branch (the user's or a teammate's) and prove locally that it does what it claims: probe what is already running, start only what is missing, exercise the claimed fix in the real app, capture evidence, then tear down everything it started and put every repo back the way it was. Use when the user says pull this branch down and test it, run the app, test the companion PR, rerun our local test, or load up a game or app so they can try it."
license: MIT
---

# PR local test

Read `~/.claude/skill-context/pr-local-test.md` first if it exists. It names this environment's start scripts, local hosts, stacks, seed data and log-in steps, and wins over anything general here.

A local test is only worth something if its result can be trusted and nothing is left behind. Both depend on the **ledger**: a running list of every process started, file changed, override set and branch switched. Teardown undoes the ledger exactly, and nothing else.

## 1. Read the claim

From the PR body, the linked ticket and the latest review comments, write down in one line each:
- what the PR says it fixes or adds,
- the exact repro or acceptance path (the steps a person would follow), and
- the expected result.

If the PR is a revision ("she made a change that might fix it a different way"), the claim is the new commit's, and the repro is the one that failed before.

## 2. Probe before starting anything

Check what is already up, so nothing is started twice and nothing the user started gets stopped:

- every repo involved: current branch and `git status --porcelain`,
- dev servers on the ports and hosts in the context file (`curl -sk -o /dev/null -w '%{http_code}'` on each),
- containers (`docker compose ps` in the stack's directory), simulators and device servers.

Record each one as already-running or not in the ledger. A running process the user started is left alone at teardown.

## 3. Check out without disturbing work

Use a worktree, so the user's checkout, branch and uncommitted changes are untouched:

```bash
git -C <repo> fetch origin pull/<n>/head:pr-<n>      # or the branch name
git -C <repo> worktree add ../<repo>-pr-<n> pr-<n>
```

Fall back to switching branches only when the stack must run from the main checkout, such as a compose file with fixed bind mounts. If the tree is dirty, stash it with a named message and add the stash to the ledger. Install dependencies the way the repo's lockfile says to.

## 4. Start what is missing

Use the context file's start recipe for each app; never improvise a start command when a recipe exists. Wait until the app answers on its host, not just until the process has spawned. Log in or seed data as the context file says. Ask the user only for a secret or an interactive login that can't be automated.

Companion PRs (two repos changed together): start both from their PR branches and point one at the other as the context file describes.

## 5. Exercise the claim

Follow the repro path in the real app: Chrome via the browser tools, the simulator or a device via `ui-bug-repro`. Assert from state rather than appearance (DOM, network, logs, the accessibility tree, telemetry). Then go one step beyond the happy path: the step the PR changes or skips, and what it now sends or stores.

Evidence for each claim: a screenshot or GIF path, the network or log line, and a telemetry session link if the app is instrumented.

**Verdict**: PASS, FAIL (with the exact step that broke and the actual result), or BLOCKED (with what's missing).

## 6. Tear down

Always do this, including after a FAIL or a BLOCKED, unless the user says to leave it running ("load it up so I can test" means leave it up and say how to stop it):

- stop every process the ledger says was started here, and nothing else,
- revert every override and temp file in the ledger,
- `git worktree remove` the worktree, pop the named stash, and switch any branch back to what the ledger recorded,
- reprobe and confirm the state matches step 2.

## Report

One line per claim with its verdict and evidence. Then one line, "Teardown: restored N items", naming anything left running and why. If the user is about to comment on the PR, offer a two-sentence comment saying what was verified and how.
