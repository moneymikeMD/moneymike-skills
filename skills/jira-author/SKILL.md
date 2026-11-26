---
name: jira-author
description: "Write Jira ticket descriptions and comments in the user's format. Use whenever asked to create, draft, file, raise or amend a Jira ticket, story, task, bug or spike, or to comment on one. Enforces the description ceiling (1000 characters, 1250 on a bug) and acceptance criteria phrased as ideal future state. A bug description carries the failure mode and how it was verified instead of ACs, and a fix already in hand goes in the first comment as an option rather than an instruction."
license: MIT
---

# Author a Jira ticket

Read `~/.claude/skill-context/jira-author.md` first if it exists. It holds this environment's Jira site, project, issue types, persona and transition ids, and wins over anything general here.

Also read `memory.md` and `research.md` from that directory if they exist: they say how this environment recalls and stores memories and where its research files live. With no memory store set up anywhere, skip the recall and store steps below and tell the user what was not stored; with no research directory, do the same for research-file appends.

The user has cut descriptions down by hand repeatedly. Treat the limits here as settled constraints, not style preferences. The failure mode is always the same: the ticket becomes a running commentary on how the work went instead of an artifact two other people can use.

**A ticket is a vehicle for two readers.** A developer works the feature from it, and a reviewer checks the important points were hit. Neither needs your reasoning trail.

## Connection

Use the Atlassian connection and project the context file names. Read `references/connection.md` before the first Atlassian call: issue-type lookup, transition ids and the connector's failure modes.

## Description format

Hard limit: **1000 characters for the whole description**, **1250 on a `Bug`**, because a bug also has to carry its verification, and **1500 on an `Epic` or an Initiative** when an optional line needs the room. Count the rendered text, so a link costs its label and not its URL:

```bash
sed -E 's/\]\([^)]*\)/]/g' /tmp/desc.txt | wc -c
```

1. **A short problem statement.** Persona style when asked for it, or when the ticket is a Story: `As a <persona>, I want X so that Y.`
2. **One short paragraph of current state**, only if the problem is not self-evident.
3. **Acceptance criteria as a bulleted list**, each phrased as the **ideal future state**.
4. Optionally a small amount of extra data. That is a ceiling, not an invitation.

Keep a sentence stating a decision (`we are deliberately not adopting X`). Drop the paragraph defending it.

### Acceptance criteria are end states, not narration

| Write this | Not this |
|---|---|
| Every repo refreshes its lockfile on a schedule | DONE, but not at the versions first specified |
| Zero critical and zero high findings on the default branch | Relocked five repos, verified per copy in node_modules |
| Exact pins carry a caret or a recorded reason to stay pinned | I converted seven pins and one was breaking the build |

Each AC should be checkable by someone who did not do the work.

### Never in a description

No progress log. No "Outcome" or "Non-obvious mechanics" section. No before/after tables. No verification receipts or CI status. No out-of-scope section beyond the one `Not in this epic:` or `Not in this initiative:` line. No implementation notes naming the endpoint you used. No headings beyond the AC list. No evidence for a claim, and no paragraph justifying a tradeoff.

If something you discover mid-task changes the approach, **the AC line changes and the discovery itself does not appear at all.**

### Epics, Initiatives, Bugs and comments have their own shape

- An `Epic` or an Initiative: read `references/epics-and-initiatives.md` before drafting.
- A `Bug`, or the first comment proposing a fix for one: read `references/bugs.md` before drafting. A bug carries the failure and its verification instead of ACs.
- Any comment: read `references/comments.md` before drafting. Comments explain the unexpected decisions; the description rules do not carry over.

## Code identifiers get backticks

File paths, symbol names, hook names, GraphQL operation and field names, directives, env vars: all of them take backticks, in descriptions and in comments alike. The user has added them back by hand. A bare `CalendarArchive.tsx` or `BATCH_GAME_STATES_QUERY` sitting in running prose reads as a typo and leaves the identifier unsearchable.

### The audience is the assignee, never the user

Read each line back and cut the ones that only parse as an assistant reporting to the user. Two tells: an imperative aimed at the person who assigned the work (`Start with...`), and a first-person opinion on how to sequence their team (`I would land this ahead of the other fix`).

A ticket is a manager handing a scoped item to their team, so the register is peer to peer. A line that exists to show the user the work happened does not belong in the artifact.

## Where the detail goes instead

Do not treat the ticket as a lab notebook. Resist re-editing the description each time you learn something; a third `DECIDED:` or `KNOWN RISK:` note is writing to yourself. Mechanisms, gotchas, corrected assumptions, evidence and per-item results belong in the memory store (see `memory.md`) or the research files, one per product, kept current through `research-file-update`. When the detail is already in both, writing it into the ticket too is pure duplication.

## Small fixes: just make them

If you notice something inconsistent and the fix is small and obviously right, make it rather than raising it as an AC or a question. The user has scoped an AC themselves after it was merely flagged.

## After creating

Branch, push and PR rules are CLAUDE.md's job, not this skill's. Two things are this skill's:

- The ticket key lives in the **branch name and nowhere else**. Not in commit messages, not in PR titles (repos often enforce conventional-commit titles in CI).
- Report the key and URL back plainly. Do not paste the description back as confirmation.

## Checklist before posting

- [ ] `wc -c` under 1000 on the description, 1250 if it is a `Bug`, 1500 on an `Epic` or Initiative only when an optional line needs it, counted without link URLs, and under 1000 on any comment carrying a proposed fix
- [ ] Every code identifier is in backticks
- [ ] Every AC reads as a future state a reviewer can check, or, on a bug, the description gives the failure mode and how it was verified and carries no ACs
- [ ] No line addressed to the user, and no `land`, `lands` or `nobody`
- [ ] No progress log, no tables, no CI status, no out-of-scope section (an `Epic` gets one `Not in this epic:` line at most), and on a Story or Task no evidence either
- [ ] Anything cut has a home in the memory store or a research file
- [ ] Correct site and project, and issue type verified against project metadata
- [ ] On an `Epic`, Initiative or `Bug`, the extra checks at the end of its reference file
