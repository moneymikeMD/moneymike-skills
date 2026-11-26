# Bug descriptions and a bug's first comment

Read from `jira-author` when the issue type is a `Bug`, or when a fix is already in hand for one. Everything in the core `SKILL.md` still applies.

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

### A bug's first comment proposes, it does not prescribe

When a bug is filed with a fix already in hand, the fix goes in the first comment, and it goes in as a candidate the assignee can take, reject or improve on. Give the option and the tradeoff, then stop short of the diff.

**Open the comment with `Potential fix: `,** inline, before the first sentence. The comment otherwise opens on a symbol name and reads like a code note, so the assignee cannot tell from the first line whether it is a diagnosis or a proposal until they have read a paragraph of it.

| write this | not this |
|---|---|
| One option is to drop `gameState` from the query | Drop `gameState` from the query |
| The warming call looks redundant, since line 90 already populates that cache entry | Deleting lines 67 to 71 removes one request per load |
| The `context.url` rewrite is worth ruling out first | Start with the `context.url` rewrite |

The reason is not politeness. A ticket that prescribes its own fix has no work left in it, and the user would have written the patch themselves rather than assign it out. What they cannot get from a diff is the evidence and the shape of the problem, so spend the budget there.

## Before posting, also check

- [ ] On a bug, the verification sits under a `**Verified**` label as When, Where and How bullets, with the measurement in prose below them
- [ ] A proposed fix reads as an option rather than an instruction, and opens with `Potential fix: `
