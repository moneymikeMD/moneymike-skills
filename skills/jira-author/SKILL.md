---
name: jira-author
description: "Write Jira ticket descriptions and comments in Mike's format for the INTER board. Use whenever asked to create, draft, file, raise or amend a Jira ticket, story, task, bug or spike, or to comment on one. Enforces the description ceiling (1000 characters, 1250 on a bug) and acceptance criteria phrased as ideal future state. A bug description carries the failure mode and how it was verified instead of ACs, and a fix already in hand goes in the first comment as an option rather than an instruction."
license: MIT
---

# Author a Jira ticket

Mike has cut a description down by hand three times. Treat the limits here as settled
constraints, not style preferences. The failure mode is always the same: the ticket
becomes a running commentary on how the work went instead of an artifact two other people
can use.

**A ticket is a vehicle for two readers.** A developer works the feature from it, and a
reviewer checks the important points were hit. Neither needs your reasoning trail.

## Connection

`INTER` lives on **`svalbard.atlassian.net`**, cloud id
`e72a6cce-d261-4827-a398-4d4a02d2c03e`. Use `mcp__atlassian-svalbard__*` and pass that
UUID; a hostname is rejected. The other Atlassian server (`mcp__atlassian__*`) is granted
to `atlanticmedia.atlassian.net`, which has no `INTER` project and returns an **empty
result rather than an error** — an empty search there is not evidence a ticket is absent.
Check `getJiraProjectIssueTypesMetadata` for the type name before creating (`Story`,
`Task`, `Bug`, `Spike`, `Documentation`, `Epic`, `Missions`, `Design Task`).

## Description format

Hard limit: **1000 characters for the whole description**, and **1250 on a `Bug`** (raised
2026-09-30, because a bug also has to carry its verification). Count it before posting:

```bash
wc -c < /tmp/desc.txt
```

1. **A short problem statement.** Persona style when asked for it, or when the ticket is a
   Story: `As an Interactive team engineer, I want X so that Y.`
2. **One short paragraph of current state**, only if the problem is not self-evident.
3. **Acceptance criteria as a bulleted list**, each phrased as the **ideal future state**.
4. Optionally a small amount of extra data. That is a ceiling, not an invitation.

Keep a sentence stating a decision (`we are deliberately not adopting X`). Drop the
paragraph defending it.

### Acceptance criteria are end states, not narration

| Write this | Not this |
|---|---|
| Every repo refreshes its lockfile on a schedule | DONE, but not at the versions first specified |
| Zero critical and zero high findings on the default branch | Relocked five repos, verified per copy in node_modules |
| Exact pins carry a caret or a recorded reason to stay pinned | I converted seven pins and one was breaking the build |

Each AC should be checkable by someone who did not do the work.

### Never in a description

No progress log. No "Outcome" or "Non-obvious mechanics" section. No before/after tables.
No verification receipts or CI status. No out-of-scope section. No implementation notes
naming the endpoint you used. No headings beyond the AC list. No evidence for a claim, and
no paragraph justifying a tradeoff.

If something you discover mid-task changes the approach, **the AC line changes and the
discovery itself does not appear at all.**

### Bugs describe the failure, and there the evidence belongs

A `Bug` inverts the rule above. Its description is the failure mode plus how it was
verified to be wrong, and no ACs. The verification is the substance rather than a receipt:
what was loaded, on which environment and at what viewport, how the measurement was taken,
and the numbers it produced. Mike asked for exactly this shape on INTER-1997 and
INTER-1998, so do not strip the method out of a bug and leave a bare symptom behind.

Say who can reproduce it when that narrows. Both of those tickets only reproduce signed
in, and a reader testing anonymously would have closed them as working.

#### Refinement 2026-09-30, INTER-2018: the verification gets a labelled list

Mike kept the prose above but pulled the setup out of it into a bulleted list, so lead with
the failure paragraph and then lay the verification out this way:

```
<one paragraph: the failure mode, and who it reproduces for>

**Verified**

* When: <date>
* Where: <environment>
* How: <session state, browser, viewport, the exact path or URL>

<one paragraph: the measurement and the numbers it produced>
```

The `**Verified**` label is the single exception to "no headings beyond the AC list". The
three bullets carry only the setup. What was measured and what it returned stay as running
prose underneath, because that is the substance and a bullet per number reads as a receipt.
Write the `When` value as a plain date and let Jira convert it to a date object on save.

The bullets and label cost roughly 60 characters. They come out of the bug's 1250, which is
not licence to pad: the extra 250 exists to hold the verification, not a longer symptom.

### Do not treat the ticket as a lab notebook

Resist re-editing the description each time you learn something. If you are adding a third
`DECIDED:` or `KNOWN RISK:` note, you are writing to yourself. Put it in memorygraph or a
research file under `~/code/research/` instead.

## Code identifiers get backticks

File paths, symbol names, hook names, GraphQL operation and field names, directives, env
vars: all of them take backticks, in descriptions and in comments alike. Mike added them
back by hand across two tickets. A bare `CalendarArchive.tsx` or `BATCH_GAME_STATES_QUERY`
sitting in running prose reads as a typo and leaves the identifier unsearchable.

Do not blame the `humanizer` pass for losing them. That skill leaves code untouched by
design, so a missing backtick means the draft never had one.

## Comments are a different surface, deliberately

Do **not** generalise the description rules to comments. The CLAUDE.md comment convention
explicitly *wants* the unexpected decisions explained properly, because that reasoning is
the whole value of a comment. In short: open with `Completed.` and one compact line giving
outcome and AC status, then explain anything you had to decide that the reader would not
expect. Cut everything else. Run it through `/humanizer` and hold to no em or en dashes.
That pass catches structure, not personal tics, so also scan for `land`, `lands` and
`nobody`, all of which Mike has cut by hand.

Three surfaces, three budgets, same instinct — the artifact is not your notebook:

| surface | budget | carries |
|---|---|---|
| description (before work) | 1000 chars, 1250 on a `Bug` | problem + ACs as future state |
| comment (after work) | compact | outcome + the calls a reader would not expect |
| first comment on a bug (before work) | 1000 chars | a proposed fix, offered as an option |
| PR description | 1007 chars | what changed + the one fact not visible in the diff |

### A bug's first comment proposes, it does not prescribe

When a bug is filed with a fix already in hand, the fix goes in the first comment, and it
goes in as a candidate the assignee can take, reject or improve on. Give the option and the
tradeoff, then stop short of the diff.

**Open the comment with `Potential fix: `,** inline, before the first sentence. Mike added
that prefix by hand on INTER-2018. The comment otherwise opens on a symbol name and reads
like a code note, so the assignee cannot tell from the first line whether it is a diagnosis
or a proposal until they have read a paragraph of it.

| write this | not this |
|---|---|
| One option is to drop `gameState` from the query | Drop `gameState` from the query |
| The warming call looks redundant, since line 90 already populates that cache entry | Deleting lines 67 to 71 removes one request per load |
| The `context.url` rewrite is worth ruling out first | Start with the `context.url` rewrite |

The reason is not politeness. A ticket that prescribes its own fix has no work left in it,
and Mike would have written the patch himself rather than assign it out. What he cannot get
from a diff is the evidence and the shape of the problem, so spend the budget there.

### The audience is the assignee, never Mike

Read each line back and cut the ones that only parse as an assistant reporting to him. Two
tells: an imperative aimed at the person who assigned the work (`Start with...`), and a
first-person opinion on how to sequence his team (`I would land this ahead of the other
fix`). Both of those were cut by hand from INTER-1998.

A ticket is a manager handing a scoped item to his team, so the register is peer to peer.
The same instinct already governs verification receipts: a line that exists to show Mike
the work happened does not belong in the artifact.

## Where the detail goes instead

Mechanisms, gotchas, corrected assumptions, evidence and per-item results belong in:

- `memorygraph store` — see the store/link triggers in CLAUDE.md
- `~/code/research/*.md` — one file per product (`datadog-usage-research.md`,
  `dependabot-usage-research.md`, `fastly-usage-research.md`). Append a dated section,
  never overwrite an existing finding.

On INTER-1932 the detail was already in both places, so writing it into the ticket too was
pure duplication.

## Small fixes: just make them

If you notice something inconsistent and the fix is small and obviously right, make it
rather than raising it as an AC or a question. Mike has scoped an AC himself after I merely
flagged the inconsistency.

## After creating

Branch naming, push and PR rules live in CLAUDE.md and are not this skill's job. Two things
that are:

- The ticket key lives in the **branch name and nowhere else**. Not in commit messages, not
  in PR titles (several repos enforce conventional-commit titles in CI).
- Report the key and URL back plainly. Do not paste the description back as confirmation.

## Checklist before posting

- [ ] `wc -c` under 1000 on the description, 1250 if it is a `Bug`, and under 1000 on any
      comment carrying a proposed fix
- [ ] Every code identifier is in backticks
- [ ] Every AC reads as a future state a reviewer can check, or, on a bug, the description
      gives the failure mode and how it was verified and carries no ACs
- [ ] On a bug, the verification sits under a `**Verified**` label as When, Where and How
      bullets, with the measurement in prose below them
- [ ] A proposed fix reads as an option rather than an instruction, and opens with
      `Potential fix: `
- [ ] No line addressed to Mike, and no `land`, `lands` or `nobody`
- [ ] No progress log, no tables, no CI status, no out-of-scope section, and on a Story or
      Task no evidence either
- [ ] Anything cut has a home in memorygraph or a research file
- [ ] Correct cloud id, and issue type verified against project metadata

## Transitions and connection gotchas

INTER workflow transition ids on svalbard: **In Progress = 21**, **Done = 31**. Pass them
to `transitionJiraIssue`; look up others with `getTransitionsForJiraIssue` rather than
guessing.

The Atlassian MCP can return an AWS WAF human-verification HTML page instead of JSON. That
is not a permissions problem and not evidence the ticket is missing; retry once, then tell
Mike the site is challenging the connector.

Draft comments at full reasoning depth (decisions, exemptions, constraints) and let Mike cut.
He prefers over-supply he can trim to under-supply he has to ask for. What never survives
his cut: improvements beyond the ACs, notes that the ticket text is stale, product gotchas,
incidental fixes. Those go to memorygraph and the research files before posting.
