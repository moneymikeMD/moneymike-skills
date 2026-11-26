# Codebase analysis and measurement

Read from `prd-to-eng-briefing` at Phase 3 and keep it open through Phase 4.

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
