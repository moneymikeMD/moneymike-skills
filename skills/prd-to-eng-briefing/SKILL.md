---
name: prd-to-eng-briefing
description: "Turn a PRD or project plan into a verified engineering survey, a research file with draft ticket bodies, and a shareable engineering brief. Use when the user links a PRD, project plan, product doc or epic and asks to survey the problem space, prepare for a refinement session, understand how a system is actually built, get up to speed before opening the code, or brief a team that has not worked in the repo. Also use when they ask to incorporate someone else's prior research into a picture of a system."
license: MIT
---

# PRD to engineering briefing

Read `~/.claude/skill-context/prd-to-eng-briefing.md` first if it exists. It holds this
environment's document connectors, research paths, log tables and link formats, and wins
over anything general here.

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

Read the workspace architecture map and the repo's best-practices file first, if the
context file names them. Use tokensave for all code exploration: `tokensave_status` to check index freshness,
then `tokensave_context`, `tokensave_search`, `tokensave_callers`. Never an Explore agent.
Query sibling repos with `graph_root` rather than adding directories.

Take notes on these specifically. Each one either blocks a PRD step or shrinks it:

- **The chokepoint.** The single base class, middleware or dispatch function every code
  path passes through. Cross-cutting changes belong there and nowhere else.
- **Inheritance blast radius.** Count the descendants of any class the PRD implies changing.
  A flag on a shared base propagates into every subclass. This is the most common way a
  one-route change becomes a fifty-route change.
- **Existing precedent.** Search for a partial implementation of what the PRD asks for. It
  is often weeks old with a single consumer, complete with tests you can copy. Check
  `git log` on the relevant files; the precedent may post-date your mental model of the
  repo.
- **Load-bearing lines that look like hygiene.** A cache header on an authenticated
  response, a constant-time compare, a `Vary`. Note them as required for correctness so
  nobody reimplements the gate without them.
- **Validation that is weaker than it looks.** A config field validated for shape but not
  for target, then executed.
- **Anything undocumented, surprising, or contradicted by the repo's own docs.**

## Phase 4: quantify before concluding

Never accept a scale claim, from the PRD or from yourself, without measuring it. A PRD that
says "at scale" has no number behind it.

- **CDN access logs**, if they are exported to a warehouse, answer who consumes what, how
  much, and with what status. Dry-run the query first and report the bytes; constrain any
  date-sharded table to the range you need.
- **Check what your APM actually receives** before computing a rate from it. If the CDN
  answers cache hits without reaching the origin, APM sees only misses.
- **Application database** for configuration rows. There is usually no local copy and no
  network path from the laptop; run a management command in the environment instead. Check
  the repo's best-practices file for the exact invocation.
- **Live HTTP** for response headers, body size and entry counts. A 200 from a feed or API
  does not mean it returned content; count the elements.

Measure four things every time:

1. **The subject of the PRD.** Requests, bytes, distinct clients.
2. **Its neighbours.** Without them you cannot say what share the subject is, and share is
   what makes the case.
3. **Status codes, not just volume.** Errors and redirects hide inside a request count, and
   a 401 count tells you whether an existing gate works.
4. **Zero-traffic configuration.** Rows that exist and are never used. This regularly cuts
   the migration list in half and turns research tickets into delete tickets.

Attribute every number to its table, field or code path in the same sentence. If something
is inferred rather than measured, say so in the same sentence.

### Probe from outside and read the configuration. Both.

Someone else's prior audit of the same system was probably done by probing the live
endpoints. It will catalogue headers, status codes and discoverability, and it will miss any
subsystem that lives at a different URL. Your code-and-config survey will miss everything
the audit found. Neither is complete. Run both, and expect the other document's open
questions to be answered by your findings.

When incorporating someone else's research, **adjudicate it rather than appending it.** One
row per claim, with a verdict and your evidence: right, right but wider than stated, half
right with the conclusion wrong, stale, or answered. Their wrong conclusions are worth as
much as their right ones, because someone on the team will otherwise act on them. Say
explicitly what not to build.

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

### `<slug>-research.md`

The evidence store, and the only place drafts live. Follows the `research-file-update`
contract: dated sections, each with its own `*Verified <date>.*`, append a dated refinement
under a finding rather than overwriting it, record contradictions instead of picking a
winner, bump `Last verified` in the header.

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

### `<slug>-engineering-brief.md`

The shareable artifact. Two audiences read one document: engineers who need a starting point
before opening the code, and product managers who need to understand how the system is
actually built. It also becomes starting context for their own LLM sessions, so it must be
dense and literal. Do not split it into engineering and business sections.

Content:

- Keep the technical specifics. Code paths, table and field names, query sources, thresholds
  and measured numbers are the point, not noise to summarise away. A reader goes from this
  document straight to the file or the query.
- Attribute every number to its source so a reader can re-derive it. Open with a data
  sources table.
- State findings as facts with their evidence. Inference is labelled in the same sentence.
- Preserve anything surprising, undocumented or invisible in the repository. Highest value
  content in the document.
- Drop methodology narrative, dead ends, session history, and anything reading as a status
  update. Drop the ticket list and the project decisions; those live in the research file.
  Keep access and query instructions, because without them nothing is re-derivable.

Style:

- Terse. No pleasantries, no framing sentences, no "it is worth noting", no closing summary,
  no offers of further work.
- No idioms, no metaphors, no filler, no hype adjectives.
- **No em dashes or en dashes.**
- Short declarative sentences. Tables and lists wherever the content is structured data.
- Define an acronym or internal term once, on first use.
- Headings name the thing described, not the section's purpose. "Feed routing", not
  "Background and Context".
- As short as the content allows. Delete any heading with nothing under it.
- **Do not hard-wrap.** One line per paragraph, so it survives being pasted elsewhere.
  Headings, table rows, list items and fenced code keep their own lines.

Make every reference clickable:

| reference | target |
|---|---|
| code path with a line number | `https://github.com/<owner>/<repo>/blob/<default-branch>/<path>#L<n>` |
| commit, pull request | `/commit/<sha>`, `/pull/<n>` |
| ticket key | `https://<jira-site>/browse/<KEY>` |
| Confluence page | resolve the real URL from the search result, do not guess |
| Django admin page | the live admin URL, checking where the urlconf mounts admin |
| Google Doc or Sheet | the URL from the PRD, first mention only |
| BigQuery table | the project's BigQuery console, first mention only |
| Slack channel | `https://<workspace>.slack.com/archives/<CHANNEL_ID>` |
| live endpoint | link it where clicking is the verification, such as a defects table. Not on every mention. |

Confirm the repo and default branch from `git remote get-url origin` rather than assuming;
they differ per repo. Do not link a file that the document cites because it does not exist.

Before handing it over, verify:

```bash
grep -n '[—–]' <file>                      # must be empty
grep -nE '\]\([^)]*\]\(|\[\[' <file>        # no nested links
awk '{o=gsub(/\[/,"[");c=gsub(/\]/,"]"); if(o!=c) print NR}' <file>   # balanced
sed -n '<n>p' <repo>/<path>                 # every linked line still says what you cite
```

Line-anchored links to a moving branch drift. Verify each one at write time, state in the
data sources table which ref they point at, and offer to pin to a commit SHA for a document
expected to outlive the branch.

### Publishing to Confluence

Pasting markdown into the Confluence editor silently strips every link. Publish through the
API instead, and note which Atlassian site the space is on. The wiki and the tickets you
link can sit on **different sites and connectors**.

**Use `contentFormat: "html"`, never `"markdown"`.** ADF cannot carry a `code` mark and a
`link` mark on the same text node, and the two converters resolve that conflict in opposite
directions:

| format | `[`path`](url)` becomes |
|---|---|
| `markdown` | monospace text, **href discarded** |
| `html` | a working link, monospace discarded |

Links are worth more than monospace in a document whose purpose is navigation. Markdown also
autolinks bare hostnames into junk (`Amazon.com` becomes `http://Amazon.com`) and drops bold
that wraps a code span; HTML does neither.

Call `getContentFormatGuide` with the tool name before authoring HTML. Convert the markdown
mechanically rather than by hand: headings to `<h2>`–`<h6>`, paragraphs to `<p>`, tables to
`<table><thead><tr><th><p>…`, cells wrapping block content in `<p>`, fenced code to
`<pre><code class="language-x">`, and inline links to `<a href="URL"><code>label</code></a>`.
Escape `&`, `<` and `>` before adding tags. Emit a body fragment with no `<html>` wrapper.

Drop the H1; the page title already carries it.

**Verify by reading the page back and counting anchors.** Do not report success from the
update response, which returns only a version number. Fetch the page and confirm the link
count matches what you sent.

Known cosmetic artifact: bold that wraps a code span renders with the emphasis split at the
boundary. Harmless, but rewrite those sentences if the page needs to look polished.

## Close the loop

Store as you go, not at the end. One memory per distinct finding, so each can be recalled
alone:

- the runtime mechanism the PRD could not see, tagged as a gotcha
- the inventory with its measurements
- the settled decisions with rejected alternatives
- the access topology, which costs the most time to re-derive
- the adjudication of any prior research, including what not to build

Then one `workflow` memory naming the files written and what is still outstanding. Backticks
inside a double-quoted `--content` run as command substitution; assign via a quoted heredoc
and pass `"$VAR"`.
