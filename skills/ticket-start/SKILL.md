---
name: ticket-start
description: "Start or resume development on a ticket: read the ticket, its comments, sub-tasks and linked PRs, load the repo's best-practices file, branch from the default branch by the naming convention (or resume the existing branch for that key), write a plan, run an adversarial review on it, implement, and commit locally, stopping before any push. Use when the user links or names a ticket and says start development, start on this, pick up, or continue the implementation."
license: MIT
---

# Ticket start

Read `~/.claude/skill-context/ticket-start.md` first if it exists. It names the issue tracker, how to reach it, where per-repo best-practices files live, and the branch prefix, and wins over anything general here. Also read `memory.md` from that directory if it exists; with no memory store, skip the recall and store steps and say what was not stored.

## 1. Gather

1. The ticket: description, acceptance criteria, comments (newest last, since later comments change scope), sub-tasks, linked tickets and the parent epic's goal.
2. Linked PRs and any existing branches for the key in each repo: `git branch -a --list "*<KEY>*"`, `gh pr list --search <KEY> --state all`.
3. The repo's best-practices file and any research file the ticket's domain names. Read them now, not after a failure.
4. Recall from the memory store: query `<KEY>` and `<repo> <ticket topic>`, limit 10.

Done when you can state each acceptance criterion and name the files likely to change.

## 2. Branch

- **Resume**: a branch for the key exists. Switch to it, `git fetch`, report how far it is behind its base, and update it only if the user asks.
- **Start**: `git fetch origin <default> && git switch -c <prefix>/<KEY>/<slug> origin/<default>`. The slug is 3 to 6 lowercase words.
- A dependency released elsewhere ("the change is done in the shared package, version X") means bumping that dependency is the first commit.

Several repos for one ticket: same key, one branch per repo. See `multi-repo-wave` if the change repeats across them.

## 3. Plan, then attack the plan

Write a short plan: the change in each file, the order, how each acceptance criterion gets verified, and what is out of scope.

Dispatch one subagent to review the plan adversarially. Give it the ticket text, the plan and the best-practices file, not your reasoning. Ask it for feasibility gaps, security holes, latency or cost risks, a missed acceptance criterion, and a cheaper approach that meets the same criteria. Fold in what holds up, and list in one line each what you rejected and why.

Show the user the revised plan only if a decision in it belongs to them, such as a trade-off the ticket does not settle. Otherwise proceed.

## 4. Implement

Small commits with conventional subjects. Run tests, lint and build as the repo defines them. Verify each acceptance criterion the way the plan says, and record the evidence for `ticket-closeout`.

## 5. Stop

Report the acceptance criteria with status, commits, and anything deferred. Then stop before pushing. The next steps are `preflight-and-ship`, then `ship-pr`.

## Memory

Store a `solution` titled `<KEY>: <approach>`, content: the decisions and rejected alternatives. Tags `<repo>,<component>`.
