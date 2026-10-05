---
name: research-file-update
description: "Update the shared research files under ~/code/research (datadog-usage-research.md, fastly-usage-research.md, dependabot-usage-research.md, their *-best-practices.md distillations, and datadog-intent.md) without overwriting other sessions' findings. Use whenever a Datadog, Fastly or Dependabot product behaviour is verified, when asked to bring a research file current, harvest memorygraph into the docs, update best practices, or when a finding contradicts something a research file already says."
license: MIT
---

# Research file update

Mike runs several Claude sessions in parallel. These files are the reconciliation point,
not a scratchpad. A finding another session verified was probably true under conditions
you have not identified.

## The files and their contracts

| File | Role |
|---|---|
| `<product>-usage-research.md` | Evidence store. Dated sections, append-only. Keeps derivations. |
| `<product>-best-practices.md` | Pure directives distilled from the research file. Imperative rules, no evidence, no "we verified by". Token-cheap for injection before an agent runs. |
| `datadog-intent.md` | Ticket status, settled decisions, open threads, what sessions got wrong. Rebuild status from live JQL, not memory. |

Product behaviour only in the research files. Ticket specifics, decisions and repo fixes
stay in memorygraph or the intent file.

## Rules

1. **Never overwrite an existing finding**, even when live evidence contradicts it.
2. Append a **dated refinement** nested under the original, with the concrete evidence.
   Every section carries its own `*Verified <date>.*`; do not rely on the header date.
3. If two observations cannot be reconciled, record the contradiction explicitly.
   Prefer narrowing a trigger over declaring a winner.
4. **Research file first, then re-distil** into the best-practices file. Never write a
   finding only into best-practices.
5. Bump `Last verified` in the header when you add sections.

## Harvest pass

When asked to bring a file current:

```bash
memorygraph search --tags <product> --limit 50
```

Compare against the file's section list. Append only product behaviour stored after the
file's last write. A recently current file may need zero appends; say so rather than
inventing a section. Then reread the best-practices file top to bottom and re-distil.

## Shell gotcha

Backticks inside a double-quoted `memorygraph store --content "..."` run as command
substitution and silently delete text. Assign via a quoted heredoc first, then pass
`"$VAR"`.

## Close the loop

```bash
memorygraph store --type workflow --title "<file> updated <date>: <sections>" --content "<what was added and why>" --tags "<product>,documentation,research-file,shared-state"
```
