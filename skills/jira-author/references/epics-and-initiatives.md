# Epic and Initiative descriptions

Read from `jira-author` when the issue type is an `Epic` or an Initiative. Everything in the core `SKILL.md` still applies.

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

## Before posting, also check

- [ ] An `Epic` opens with the For/who/Unlike statement, not a persona line, and lists no child tickets
- [ ] An Initiative opens with an unlabelled objective, has one to three key results under a heading with a target date, and names its phases without ticket keys
