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

Use the Atlassian connection and project the context file names. Check `getJiraProjectIssueTypesMetadata` for the issue type name before creating rather than guessing it. An empty search result is not evidence a ticket is absent until you know you are querying the right site.

## Description format

Hard limit: **1000 characters for the whole description**, **1250 on a `Bug`**, because a bug also has to carry its verification, and **1500 on an `Epic` or an Initiative** under the condition in their sections below. Count the rendered text, so a link costs its label and not its URL:

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

No progress log. No "Outcome" or "Non-obvious mechanics" section. No before/after tables. No verification receipts or CI status. No out-of-scope section, apart from the single `Not in this epic:` or `Not in this initiative:` line an `Epic` or Initiative may carry. No implementation notes naming the endpoint you used. No headings beyond the AC list. No evidence for a claim, and no paragraph justifying a tradeoff.

If something you discover mid-task changes the approach, **the AC line changes and the discovery itself does not appear at all.**

### Epics state the capability they unlock

An `Epic` is read by the people who decide whether the work matters, not only by whoever builds it. It drops the persona line and says what becomes possible once it is done. Write it this way:

```
For <who>, who <need>, <epic name> is <solution> that <benefit>.

Unlike today, where <the gap>, it <what changes>.

**Acceptance criteria**

* <capability someone can try>
* <one measurable figure, when the epic naturally produces one>

Not in this epic: <neighbouring work that could get pulled in>.

Depends on: <team> for <what they need to provide>.
```

* The opener is SAFe's epic hypothesis statement written as prose, split into two sentences at the "Unlike". The unlike sentence stands in for the current-state paragraph, so do not add one.
* Each AC is a capability someone can try. Add one measurable figure when the epic naturally produces one, such as a latency that becomes readable, and never invent a target or a deadline to fill the slot.
* `**Acceptance criteria**` is the only heading. The opener already is the outcome, so do not label it.
* `Not in this epic:` appears only when neighbouring work could plausibly get pulled in. `Depends on:` appears only when another team owns part of the outcome. Both are optional single lines.
* Aim for 1000 characters. Go past it, up to 1500, only when one of those two lines needs the room. The opener and ACs alone always fit in 1000.
* Never list or link the child tickets; Jira shows them and a list goes stale on the first re-parent. No leading indicators either.
* An epic closes when its outcome is met. Children still open at that point get re-parented or closed rather than holding it open.

### Initiatives state an objective and its key results

An Initiative groups Epics under one objective and is read by whoever decides what the team works on next. The context file names the issue type it maps to. It is built on an OKR: an objective, then the results that show it was met. Write it this way:

```
<objective: one sentence, what we are going after>

<optional why-now: two or three sentences at most>

**Key results** (<planning period>, by <target date>)

* <measurable result with a target, and a baseline when one exists>

Phases: <the sequence of work, in words>.

Serves: <the company-level goal it rolls up to>.

Source material: <links to the detailed pages>.

Not in this initiative: <neighbouring work that could get pulled in>.

Depends on: <team> for <what they need to provide>.
```

* The objective gets no label. `**Key results**` is the only heading, carrying the planning period and the target date the closing rule checks against.
* One to three key results. Each is measurable with a target, or a yes/no outcome someone can check. Never invent a number to fill the slot; a checkable yes/no beats a made-up target.
* `Phases:` names the order of work and why it goes that way, in words. No ticket keys and no list of Epics; Jira shows the children.
* Every line after the key results is optional and appears only when it has something to say. `Not in this initiative:` and `Depends on:` follow the same rules as on an Epic.
* Known constraints, audit findings and other evidence go on the linked page or in a research file. `Source material:` points at them.
* The budget matches an Epic: aim for 1000 characters, up to 1500 only when an optional line needs the room.
* An Initiative closes at its target date, met or not. The closing comment opens `Completed.` only when every key result is met, and otherwise `Closed at the end of <planning period>.`, followed by one line per key result saying where it ended up.

### Bugs describe the failure, and there the evidence belongs

A `Bug` inverts the rule above. Its description is the failure mode plus how it was verified to be wrong, and no ACs. The verification is the substance rather than a receipt: what was loaded, on which environment and at what viewport, how the measurement was taken, and the numbers it produced. The user asked for exactly this shape, so do not strip the method out of a bug and leave a bare symptom behind.

Say who can reproduce it when that narrows. A bug that only reproduces signed in will be closed as working by a reader testing anonymously.

#### The verification gets a labelled list

Lead with the failure paragraph and then lay the verification out this way:

```
<one paragraph: the failure mode, and who it reproduces for>

**Verified**

* When: <date>
* Where: <environment>
* How: <session state, browser, viewport, the exact path or URL>

<one paragraph: the measurement and the numbers it produced>
```

The `**Verified**` label is the single exception to "no headings beyond the AC list". The three bullets carry only the setup. What was measured and what it returned stay as running prose underneath, because that is the substance and a bullet per number reads as a receipt. Write the `When` value as a plain date and let Jira convert it to a date object on save.

The bullets and label cost roughly 60 characters. They come out of the bug's 1250, which is not licence to pad: the extra 250 exists to hold the verification, not a longer symptom.

### Do not treat the ticket as a lab notebook

Resist re-editing the description each time you learn something. If you are adding a third `DECIDED:` or `KNOWN RISK:` note, you are writing to yourself. Put it in the memory store or a research file instead.

## Code identifiers get backticks

File paths, symbol names, hook names, GraphQL operation and field names, directives, env vars: all of them take backticks, in descriptions and in comments alike. The user has added them back by hand. A bare `CalendarArchive.tsx` or `BATCH_GAME_STATES_QUERY` sitting in running prose reads as a typo and leaves the identifier unsearchable.

Do not blame the `humanizer` pass for losing them. That skill leaves code untouched by design, so a missing backtick means the draft never had one.

## Comments are a different surface, deliberately

Do **not** generalise the description rules to comments. A comment *wants* the unexpected decisions explained properly, because that reasoning is the whole value of a comment. In short: open with `Completed.` and one compact line giving outcome and AC status, then explain anything you had to decide that the reader would not expect. Cut everything else. Run it through `/humanizer` and hold to no em or en dashes. That pass catches structure, not personal tics, so also scan for `land`, `lands` and `nobody`, all of which the user has cut by hand.

Three surfaces, three budgets, same instinct: the artifact is not your notebook.

| surface | budget | carries |
|---|---|---|
| description (before work) | 1000 chars, 1250 on a `Bug` | problem + ACs as future state |
| epic description | 1000 chars, 1500 with a scope or dependency line | capability unlocked + ACs |
| initiative description | 1000 chars, 1500 with optional lines | objective + key results + plan in words |
| comment (after work) | compact | outcome + the calls a reader would not expect |
| first comment on a bug (before work) | 1000 chars | a proposed fix, offered as an option |
| PR description | 1007 chars | what changed + the one fact not visible in the diff |

### A bug's first comment proposes, it does not prescribe

When a bug is filed with a fix already in hand, the fix goes in the first comment, and it goes in as a candidate the assignee can take, reject or improve on. Give the option and the tradeoff, then stop short of the diff.

**Open the comment with `Potential fix: `,** inline, before the first sentence. The comment otherwise opens on a symbol name and reads like a code note, so the assignee cannot tell from the first line whether it is a diagnosis or a proposal until they have read a paragraph of it.

| write this | not this |
|---|---|
| One option is to drop `gameState` from the query | Drop `gameState` from the query |
| The warming call looks redundant, since line 90 already populates that cache entry | Deleting lines 67 to 71 removes one request per load |
| The `context.url` rewrite is worth ruling out first | Start with the `context.url` rewrite |

The reason is not politeness. A ticket that prescribes its own fix has no work left in it, and the user would have written the patch themselves rather than assign it out. What they cannot get from a diff is the evidence and the shape of the problem, so spend the budget there.

### The audience is the assignee, never the user

Read each line back and cut the ones that only parse as an assistant reporting to the user. Two tells: an imperative aimed at the person who assigned the work (`Start with...`), and a first-person opinion on how to sequence their team (`I would land this ahead of the other fix`).

A ticket is a manager handing a scoped item to their team, so the register is peer to peer. The same instinct already governs verification receipts: a line that exists to show the user the work happened does not belong in the artifact.

## Where the detail goes instead

Mechanisms, gotchas, corrected assumptions, evidence and per-item results belong in:

- the memory store (see `memory.md`)
- the research files, one per product. Append a dated section, never overwrite an existing finding (see `research-file-update`).

When the detail is already in both places, writing it into the ticket too is pure duplication.

## Small fixes: just make them

If you notice something inconsistent and the fix is small and obviously right, make it rather than raising it as an AC or a question. The user has scoped an AC themselves after it was merely flagged.

## After creating

Branch naming, push and PR rules live in CLAUDE.md and are not this skill's job. Two things that are:

- The ticket key lives in the **branch name and nowhere else**. Not in commit messages, not in PR titles (repos often enforce conventional-commit titles in CI).
- Report the key and URL back plainly. Do not paste the description back as confirmation.

## Checklist before posting

- [ ] `wc -c` under 1000 on the description, 1250 if it is a `Bug`, 1500 on an `Epic` or Initiative only when an optional line needs it, counted without link URLs, and under 1000 on any comment carrying a proposed fix
- [ ] Every code identifier is in backticks
- [ ] Every AC reads as a future state a reviewer can check, or, on a bug, the description gives the failure mode and how it was verified and carries no ACs
- [ ] On a bug, the verification sits under a `**Verified**` label as When, Where and How bullets, with the measurement in prose below them
- [ ] A proposed fix reads as an option rather than an instruction, and opens with `Potential fix: `
- [ ] No line addressed to the user, and no `land`, `lands` or `nobody`
- [ ] No progress log, no tables, no CI status, no out-of-scope section (an `Epic` gets one `Not in this epic:` line at most), and on a Story or Task no evidence either
- [ ] An `Epic` opens with the For/who/Unlike statement, not a persona line, and lists no child tickets
- [ ] An Initiative opens with an unlabelled objective, has one to three key results under a heading with a target date, and names its phases without ticket keys
- [ ] Anything cut has a home in the memory store or a research file
- [ ] Correct site and project, and issue type verified against project metadata

## Transitions and connection gotchas

Look up transition ids with `getTransitionsForJiraIssue` rather than guessing, unless the context file lists them.

The Atlassian MCP can return an AWS WAF human-verification HTML page instead of JSON. That is not a permissions problem and not evidence the ticket is missing; retry once, then tell the user the site is challenging the connector.

Draft comments at full reasoning depth (decisions, exemptions, constraints) and let the user cut. They prefer over-supply they can trim to under-supply they have to ask for. What never survives their cut: improvements beyond the ACs, notes that the ticket text is stale, product gotchas, incidental fixes. Those go to the memory store and the research files before posting.
