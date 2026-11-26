# Comments

Read from `jira-author` before drafting any comment. Everything in the core `SKILL.md` still applies.

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

Draft comments at full reasoning depth (decisions, exemptions, constraints) and let the user cut. They prefer over-supply they can trim to under-supply they have to ask for. What never survives their cut: improvements beyond the ACs, notes that the ticket text is stale, product gotchas, incidental fixes. Those go to the memory store and the research files before posting.

Do not blame the `humanizer` pass for losing them. That skill leaves code untouched by design, so a missing backtick means the draft never had one.
