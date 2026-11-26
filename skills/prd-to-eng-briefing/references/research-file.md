# The research file

Read from `prd-to-eng-briefing` at Phase 6, before writing `<slug>-research.md`.

### `<slug>-research.md`

The evidence store, and the only place drafts live. Follows the `research-file-update`
contract for evidence files: dated sections, each with its own `*Verified <date>.*`, a
disproved claim cut to a pointer at what superseded it, and `Last verified` bumped in the
header.

Structure:

1. Header: what it covers, `Last verified`, and a linked list of source documents including
   the PRD, trackers, prior audits and prior tickets.
2. The PRD premise, corrected.
3. Inventory and measurements, one dated section each.
4. Adjudication of any prior research.
5. Settled decisions, each with the rejected alternative and the reason.
6. PRD wording that should change.
7. Draft ticket bodies.
8. Open questions, including the PRD's own unanswered FAQ.

Ticket bodies follow the `jira-author` contract: under 1000 characters, acceptance criteria
as ideal future states a reviewer can check. Order them by dependency and say which blocks
which. Give each a type and an owner where the owner is not engineering. Mark the one that
must happen first.

**A finding that belongs to another team gets its own ticket in their project**, scoped to
their fix alone so they do not inherit the roadmap. Note the key in the research file.
