---
name: observability-ticket-preflight
description: "Check a Datadog, tracing, entity-hygiene or observability claim against live Datadog before asserting it, writing config, or calling an experiment settled, and frame findings about other teams' setups as sequencing questions rather than gaps. Use at the start of any INTER observability ticket, any peer.service, span schema, tracer env var, service map, catalog cleanup or Remote Configuration task, whenever an audit or epic asserts a current state that has not been re-verified this week, before stating which repos, monitors or entities are in a given state, and before calling an A/B against live Datadog settled."
license: MIT
---

# Observability ticket preflight

INTER-1857 was cancelled after a branch was cut: the outcome it asked for was already
true in prod through a mechanism outside the repo. The epic's audit data was stale. Ten
minutes against live Datadog would have saved the ticket.

## 1. Recall and read the intent file

```bash
memorygraph recall --query "<service> datadog <topic>" --limit 10
```

`~/code/research/datadog-intent.md` holds ticket status and settled decisions
(cancelled tickets not to re-propose, AC3s traded away, the Fastly revert held for
DevOps). `~/code/research/datadog-best-practices.md` holds the product rules.

## 2. Verify the current state live

For every AC, find the evidence in Datadog before touching the repo:

- Tags on a REAL span via `search_datadog_spans` (not `aggregate_spans`, which returns
  zero buckets for diversity-sampled spans). Expand traces with `expand_span_id`;
  `only_service_entry_spans` hides the downstream service.
- The service map edge and the entity graph node.
- The monitor or dashboard the ticket says is broken, from a fresh GET.
- Deployed `git.commit.sha` on spans, to know which build you are looking at.

If an AC is already satisfied, say so and propose cancelling or rescoping before writing
config. If a "delete the entity" AC targets an APM-derived node, it is unachievable as
written; catalog records and entity-graph nodes are different stores.

## 3. Know the fleet constraints before proposing config

- Remote Configuration is disabled fleet-wide in the DatadogAgent CR
  (`product-argocd/monitoring/datadog/datadog-agent.yaml`), deliberately: minimal
  footprint and config-as-code auditability. Every tracer setting is therefore a
  committed `DD_*` env var. Do not propose enabling RC unless Dynamic Instrumentation or
  AAP is actually wanted, and then go to devops first.
- The DatadogMonitor CRD is installed and unused on purpose: adoption before governance.
  Monitors-as-code is a cross-org decision, not a gap to fix.
- `DD_POSTFORK_PROFILING_ENABLED` is an Atlantic uWSGI convention, not a ddtrace
  variable; under gunicorn `DD_PROFILING_ENABLED` alone suffices. The Django middleware
  var is `DD_DJANGO_INSTRUMENT_MIDDLEWARE` (no `TRACE_`).
- In Lambda, dd-trace's serverless override clobbers computed `peer.service`; readable
  resource names (`keepNames`) and a named DynamoDB peer node are mutually exclusive
  until fixed upstream. Service remapping cannot express per-caller names on a shared
  hostname; rejected for INTER-1856.
- The dd-trace http client blocklist drops the WHOLE trace. `tracer.use('http',
  {client:false})` is the safe suppression, and even that killed a monitor.
- `frontend` deliberately disables the `next` and `graphql` dd-trace plugins as
  dedup against its OTel bridge. INTER-1903 was cancelled; do not re-propose.
- Fastly rewrites `x-datadog-parent-id` with a 32-bit id, which is why
  frontend-to-graphql-api nesting shows an inferred `graphql.theatlantic.com` node.

## 4. Claims about state, and A/B results

Before naming which items are in a state, list them. A claim about "which repos,
monitors or entities are X" is a query, not an inference, and one
`GET /api/v2/catalog/entity?filter[kind]=<kind>` costs less than being wrong out loud.

Before calling an A/B settled, name every variable that differs between the arms, not
just the one you changed. Entity `kind`, repo-name-to-entity-name match, and prior
manual edits are all live variables. If two arms differ in more than one, the result is
uninterpretable; say so rather than crediting the variable you were testing.

A null result inside the propagation window is not a result. Catalog attributes settle
in under a minute; findings reprocessing takes up to 24 hours.

The 2026-09-10 SCA investigation produced three settled conclusions this way and two
were wrong, each from arms that differed in entity `kind` as well as configuration.

## 5. Framing rules for what you find

When another team's practice diverges from a stated principle, the default hypothesis is
deliberate sequencing or a known trade-off. Ask "is this intentional and where does it
sit on the roadmap?" rather than presenting it as a gap they missed.

When a repo or resource that should exist is invisible to search, suspect permissions
first and ask. Do not codify a tool defect from one failed search.

## 6. Only then plan the change

Branch, config, PR via `ship-pr`. Monitor edits via `dd-monitor-change`. Entity files via
`dd-catalog-entity`. Store the verification result in memorygraph either way; a
cancelled ticket with evidence is a result.
