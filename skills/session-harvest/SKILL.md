---
name: session-harvest
description: "At the end of a working session, collect what was verified or decided and propose where each piece belongs (repo best-practices or research files, a skill or its context file, the voice file, the memory store, an agent instructions file) as a numbered batch, then apply only the items the user approves. Use when the user says wrap up, harvest this session, update the best-practices and skills from this, or save what we learned."
license: MIT
---

# Session harvest

Read `~/.claude/skill-context/session-harvest.md` first if it exists. It names this environment's research directory, skill repo, context-file directory and voice file, and wins over anything general here. Also read `memory.md` and `research.md` there if they exist.

This is not a retrospective. A retro proposes changes to the user's workflow. A harvest files away what this session proved true. Nothing is written until the user approves it by number.

## 1. Collect candidates

Read back through the session for:
- **Verified behaviour**: something run or observed that settled a question (a command that works, a baseline already failing, a product behaving differently than assumed).
- **Corrections**: the user told you something was wrong. These are the most valuable and the easiest to lose.
- **Decisions with a reason**: a choice the user made that future sessions should follow.
- **Skill friction**: a step of a skill that was wrong, missing or slow this session.
- **Voice evidence**: the user edited or rewrote something you drafted.

Drop anything unverified, anything a file or command already states (the environment is its own source of truth), and anything that only mattered to this session.

## 2. Route each one

| Kind | Destination |
|---|---|
| Repo behaviour, command, trap | that repo's best-practices file, through `research-file-update` |
| Product behaviour (an observability tool, a CDN, a cloud service) | that product's research file, through `research-file-update` |
| A skill step that was wrong or missing | the skill, if it holds for any environment; the skill's context file, if it is specific to this one |
| Writing correction | the voice file, rewriting the rule in place (`voice-draft`) |
| Decision, fix or problem with history | the memory store |
| A standing rule for every session | the agent instructions file, but only if the user stated it as a rule |

## 3. Propose

```
1. [<destination file>] <the exact line or edit, as it would be written>
   why: <the moment in this session that proved it>
2. ...
```

Then one line: `Reply "all", "all except 3", or the numbers to apply.` Group by destination, put corrections first, and keep it to the items that would change a future session's behaviour.

## 4. Apply

Apply only the approved numbers, each through the skill or contract its destination requires. Skill edits follow that repo's own branch, test and PR rules. Report each item as applied with its file path, or as skipped and why.
