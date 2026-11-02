---
name: research-file-update
description: "Keep shared research files current (per-product *-usage-research.md evidence stores, their *-best-practices.md distillations, and an intent file): each rule states only what is true now, and another session's finding is replaced only after you know why it held. Use whenever a product behaviour is verified, when asked to bring a research file current, harvest memory into the docs, update best practices, or when a finding contradicts something a research file already says."
license: MIT
---

# Research file update

Read `~/.claude/skill-context/research-file-update.md` first if it exists. It holds this environment's research-file specifics and wins over anything general here. Also read `research.md` from that directory, which names the research directory and the files in it, and `memory.md`, which says how this environment searches and stores memories.

If neither file names a research directory, stop. Tell the user this skill needs one and point them at `examples/research.md` in this skill's plugin. Do not guess a directory to write into.

The user runs several Claude sessions in parallel. These files are the reconciliation point, not a scratchpad, and agents load them before they act: whatever a file says is treated as current. A finding another session verified was probably true under conditions you have not identified.

## The files and their contracts

| File | Role |
|---|---|
| `<product>-usage-research.md` | Evidence store. Dated sections, appended. Keeps derivations. A claim a later section disproves is cut to a one-line pointer to that section. |
| `<product>-best-practices.md` | Pure directives distilled from the research file. Imperative rules, no evidence, no "we verified by". Token-cheap for injection before an agent runs. |
| `<product>-intent.md` | Ticket status, settled decisions, open threads, what sessions got wrong. Rebuild status from the live tracker, not memory. |

Product behaviour only in the research files. Ticket specifics, decisions and repo fixes stay in the memory store or the intent file.

## Rules

1. **Each best-practices rule states only what is true now.** When evidence shows a rule is wrong or stale, rewrite it in place as the current fact and delete the outdated wording. A refinement stacked under a wrong rule leaves the wrong rule in every agent's context.
2. **Know why the old finding held before you replace it.** Another session saw it under some condition: a build, an environment, a setting, a date. When both observations hold under different conditions, write one rule that names both (narrow the trigger). Replace outright only when the old claim no longer holds anywhere. When two observations cannot be reconciled, state the contradiction in one rule rather than picking a winner.
3. Every rule carries its own `*Verified <date>.*`, set to the date it was last confirmed; do not rely on the header date. Keep the history of how a rule changed in the evidence file and the memory store, not in best-practices.
4. **Research file first, then re-distil** into the best-practices file. Never write a finding only into best-practices. In the evidence file, append the new dated section and cut the disproved claim to `Superseded <date>: see <section>`.
5. Bump `Last verified` in the header when you change the file.

## Harvest pass

When asked to bring a file current, search the memory store by tag `<product>`, limit 50 (how: `memory.md`). With no memory store, say there is nothing to harvest and stop the pass.

Compare against the file's section list. Append only product behaviour stored after the file's last write. A recently current file may need zero appends; say so rather than inventing a section. Then reread the best-practices file top to bottom and re-distil: rewrite any rule the new evidence makes stale, and collapse any refinement chain into the one current rule.

## Close the loop

Store a `workflow` memory titled `<file> updated <date>: <sections>`, content `<what was added and why>`, tags `<product>,documentation,research-file,shared-state`.
