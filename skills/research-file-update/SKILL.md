---
name: research-file-update
description: "Update shared research files (per-product *-usage-research.md evidence stores, their *-best-practices.md distillations, and an intent file) without overwriting other sessions' findings. Use whenever a product behaviour is verified, when asked to bring a research file current, harvest memory into the docs, update best practices, or when a finding contradicts something a research file already says."
license: MIT
---

# Research file update

Read `~/.claude/skill-context/research-file-update.md` first if it exists. It holds this environment's research-file specifics and wins over anything general here. Also read `research.md` from that directory, which names the research directory and the files in it, and `memory.md`, which says how this environment searches and stores memories.

If neither file names a research directory, stop. Tell the user this skill needs one and point them at `examples/research.md` in this skill's plugin. Do not guess a directory to write into.

The user runs several Claude sessions in parallel. These files are the reconciliation point, not a scratchpad. A finding another session verified was probably true under conditions you have not identified.

## The files and their contracts

| File | Role |
|---|---|
| `<product>-usage-research.md` | Evidence store. Dated sections, append-only. Keeps derivations. |
| `<product>-best-practices.md` | Pure directives distilled from the research file. Imperative rules, no evidence, no "we verified by". Token-cheap for injection before an agent runs. |
| `<product>-intent.md` | Ticket status, settled decisions, open threads, what sessions got wrong. Rebuild status from the live tracker, not memory. |

Product behaviour only in the research files. Ticket specifics, decisions and repo fixes stay in the memory store or the intent file.

## Rules

1. **Never overwrite an existing finding**, even when live evidence contradicts it.
2. Append a **dated refinement** nested under the original, with the concrete evidence. Every section carries its own `*Verified <date>.*`; do not rely on the header date.
3. If two observations cannot be reconciled, record the contradiction explicitly. Prefer narrowing a trigger over declaring a winner.
4. **Research file first, then re-distil** into the best-practices file. Never write a finding only into best-practices.
5. Bump `Last verified` in the header when you add sections.

## Harvest pass

When asked to bring a file current, search the memory store by tag `<product>`, limit 50 (how: `memory.md`). With no memory store, say there is nothing to harvest and stop the pass.

Compare against the file's section list. Append only product behaviour stored after the file's last write. A recently current file may need zero appends; say so rather than inventing a section. Then reread the best-practices file top to bottom and re-distil.

## Close the loop

Store a `workflow` memory titled `<file> updated <date>: <sections>`, content `<what was added and why>`, tags `<product>,documentation,research-file,shared-state`.
