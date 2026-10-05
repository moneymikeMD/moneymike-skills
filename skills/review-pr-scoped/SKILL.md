---
name: review-pr-scoped
description: "Review a PR or diff the way the user weighs findings: ranked by fit to the PR's stated intent, with scope-expanding suggestions labelled non-blocking up front and inert latent issues said to be inert. Use whenever asked to review a PR, review a branch, look over a diff, check a colleague's PR, or run /code-review; wrap the built-in review with this ranking."
license: MIT
---

# Review scoped to intent

Read `~/.claude/skill-context/review-pr-scoped.md` first if it exists. It holds this environment's known false positives and wins over anything general here.

The user once dropped a correct finding because it recommended deleting a dead function inside a PR whose intent was a mechanical helper swap. The finding was right and still unwelcome: deleting code is a larger blast radius than the PR meant to take on. Severity alone is the wrong sort key.

## Before reading the diff

1. State the PR's intent in one sentence, from its title, body and linked ticket. If the PR is a mechanical change (dependency bump, helper swap, rename, config), say so; that narrows what counts as blocking.
2. `memorygraph recall --query "<repo> code review" --limit 10`. Some false positives recur, and a reviewer repeating one does not make it right.

## Run the review

Use `/code-review` or read the diff directly. Then re-sort.

## Rank and label

Three buckets, in this order in the write-up:

1. **Blocking.** Defects the diff introduces: wrong behaviour, broken build, a monitor or consumer that will silently break, a security regression. These get plain language.
2. **Non-blocking, in scope.** Improvements to lines the PR already touches.
3. **Non-blocking, expands scope.** Deletions, refactors, DRY consolidation, new abstractions, fixes to pre-existing defects the diff merely passed by. Label them as such in the first words, and say when the issue is inert today so deferring is cheap. Offer to file a ticket rather than asking for it in this PR.

Do not pad. If the diff is fine, say it is fine. If a build script is inlined as a `node -e` one-liner, that IS worth raising: the user takes the readable artifact over the minimal diff when the thing will be edited again.

## Verify before asserting

A finding that says "this will break X" gets checked against X (the live monitor, the consumer, the schema) before it is written. Confident findings that turned out wrong on re-check have cost more than the bugs they described.

## Memory

Store any finding pattern that could recur:

```bash
memorygraph store --type code_pattern --title "<repo>: <pattern>" --content "<what and why>" --tags "<repo>,code-review,<component>"
```
