---
name: ticket-closeout
description: "Close a ticket on evidence: check every acceptance criterion against live sources (observability data, CDN or cloud logs, warehouse queries, the deployed app) in the environments it shipped to, draft the completion comment, and stage the status transition, then stop for one approval to post and move it. Use when the user says verify this ticket, verify it in stage or prod, the fix is deployed, draft the completion comment, or move it to done."
license: MIT
---

# Ticket closeout

Read `~/.claude/skill-context/ticket-closeout.md` first if it exists. It names the tracker, its transition ids, the verification sources for each kind of ticket, and the environments, and wins over anything general here. Also read `memory.md` and `research.md` there if they exist.

## 1. Restate what "done" means

Pull the ticket, its acceptance criteria and its comments. For each criterion, write the observable fact that would prove it and the source that shows it. A criterion with no observable proof is flagged to the user, never assumed.

## 2. Verify

Check each criterion in order of environment: stage first, then prod once the user says prod is deployed.

- Before querying an observability product, read its best-practices research file if one exists, and run the `observability-ticket-preflight` skill's check on any claim about how that product behaves.
- A missing signal right after a deploy may just be lag. Generate or wait for traffic ("I just pushed more activity on stage") and requery once before calling it a FAIL.
- An expired credential gets the refresh the context file describes, then a retry.

Record each criterion as PASS, FAIL or NOT-VERIFIABLE, with one evidence link or query.

Any FAIL: stop and report it. Close nothing.

## 3. Draft

Draft the completion comment with the `jira-author` skill's completion format, in the user's voice. Usually that means opening with `Completed.`, one line of outcome and criteria status, then only the decisions a reader would not expect. Evidence links go in only if the context file says the audience wants them (a QA hand-off does; most tickets don't).

When there is a follow-up, check whether it belongs to this team before proposing a ticket. A problem in a vendor's product is a sentence in the comment, not a backlog item.

## 4. Stop

Show the draft and the exact actions: post the comment, then transition to the done status by id. Wait for one approval covering both. If the user edits the draft, use their version verbatim, and after posting compare it with the draft to update the voice file.

## After

Append verified product behaviour to the research file through `research-file-update`. Store a `solution` titled `<KEY> verified: <outcome>`, content: what proved it and any lag or gotcha. Tags `<repo>,verification`.
