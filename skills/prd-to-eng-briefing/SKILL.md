---
name: prd-to-eng-briefing
description: "Turn a PRD or project plan into a verified engineering survey, a research file with draft ticket bodies, and a shareable engineering brief. Use when the user links a PRD, project plan, product doc or epic and asks to survey the problem space, prepare for a refinement session, understand how a system is actually built, get up to speed before opening the code, or brief a team that has not worked in the repo. Also use when they ask to incorporate someone else's prior research into a picture of a system."
license: MIT
---

# PRD to engineering briefing

Read `~/.claude/skill-context/prd-to-eng-briefing.md` first if it exists. It holds this
environment's document connectors, research paths, log tables and link formats, and wins
over anything general here. Also read `memory.md` and `research.md` from that directory if
they exist: they say how this environment stores memories and where its research directory
is. With no memory store set up anywhere, skip the store steps and tell the user what was
not stored. With no research directory, ask the user where the two files should go.

The user runs refinement sessions from this output. They need to walk in able to correct the
PRD, not recite it. The deliverable is not a summary of the document; it is the set of
facts the document got wrong, left out, or could not see.

Two failure modes to avoid. Summarising the PRD back at them produces nothing they did
not have. Reporting a correction before finding the true mechanism produces a confident wrong
answer that they then have to unpick.

Work in phases. Phases 1 to 4 are yours. Phase 5 is theirs. Do not write the output files
before Phase 5 closes.

## Phase 1: ingest the PRD and everything it points at

The PRD is usually a Google Doc or similar. `WebFetch` fails on authenticated URLs by
design, so read it through the document connector the context file names. If a connector
needs OAuth that only the user can complete, ask them to run `/mcp` and select it. You
cannot drive it.

Then do three things the PRD does not ask for:

- **Follow every link inside it.** Read them in one `read_document` call, not one per URL.
- **Search for what it does not link.** Use the enterprise search connector on the subject,
  with short discriminative keywords, no boolean logic. This routinely surfaces a second
  independent audit by someone who cares about the subject, and prior tickets that
  already scoped part of the work. Both change the shape of the project.
- **Read the spreadsheet trackers as structured data.** Search indexes usually flatten
  sheets to text and lose the column structure. If the columns matter for sizing, ask the
  user to export CSV.

Record from the PRD, because these are what the rest of the work hangs off:

| capture | why |
|---|---|
| DACI (driver, approver, contributors, informed) | who settles a question, and who to route a finding to |
| numbered project steps | the steps are usually wrong in a way that matters; you will restate them |
| success metrics | these imply instrumentation nobody has scoped |
| questions the PRD explicitly defers to engineering | these are exactly the questions to put to the user in Phase 5 |
| any step marked out of scope for this PRD | often already half built |

If the PRD is empty or a stub, say so once and ask for the content. Do not survey blind on
the strength of a filename.

## Phase 2: treat every causal claim in the PRD as a hypothesis

A PRD is written by someone who understands the business and is repeating what they were
told about the system. Its central claim about how things are wired is often true as a
dependency and wrong as a mechanism.

For each causal claim, find the mechanism in code. When it is not in code, look for:

- a configuration table with an admin UI, editable by non-engineers
- a proxy or router view that resolves a path at runtime
- a CDN or edge rule
- a scheduled job or export pipeline
- a row in a vendor or partner registry

**Do not report the PRD as wrong until you can state what is true instead.** If you have
already sent a correction and then find the real mechanism, say plainly that the PRD was
right about the dependency and you were wrong about the mechanism, in one sentence, then
carry on. No re-litigating.

The highest-value finding in this whole skill is a dependency that exists at runtime and is
invisible to code search. Look for it deliberately.

## Phase 3: analyse the affected codebases

Read `references/codebase-and-measurement.md` now; it carries Phases 3 and 4 in full. Explore with tokensave, never an Explore agent, and note the chokepoint, the inheritance blast radius and any existing precedent.

## Phase 4: quantify before concluding

Never accept a scale claim, from the PRD or from yourself, without measuring it, and attribute every number to its source in the same sentence. Adjudicate someone else's prior research claim by claim rather than appending it. Method and sources: `references/codebase-and-measurement.md`.

## Phase 5: put the decisions to the user

Facts are yours to find. Decisions are theirs. Do not write the output files until they
have answered.

Ask the whole answerable frontier in one round. Number each question, give a recommended
answer with the rejected alternative and why. Questions whose answer depends on another
open question belong in a later round. Lead with the questions the PRD explicitly deferred
to engineering, since those are already theirs to settle.

They may say no tickets. Honour that. The survey is often for their own authority in a
refinement session, not for filing work.

## Phase 6: the two files

Both go in the research directory. Slug them off the project, not the PRD title:
`<slug>-research.md` and `<slug>-engineering-brief.md`.

- Before writing `<slug>-research.md`, read `references/research-file.md`.
- Before writing `<slug>-engineering-brief.md`, read `references/engineering-brief.md`. The brief opens with a data sources table straight under the title, with nothing before it; the file has the style rules, the link table and the checks to run before handing it over.
- Before publishing the brief to Confluence, read `references/confluence-publishing.md`. Publish through the API with `contentFormat: "html"`, never `"markdown"`, and verify by reading the page back.

## Close the loop

Store to the memory store (how: `memory.md`) as you go, not at the end. One memory per distinct finding, so each can be recalled
alone:

- the runtime mechanism the PRD could not see, tagged as a gotcha
- the inventory with its measurements
- the settled decisions with rejected alternatives
- the access topology, which costs the most time to re-derive
- the adjudication of any prior research, including what not to build

Then one `workflow` memory naming the files written and what is still outstanding.
