---
name: dd-catalog-entity
description: "Author, audit or fix an entity.datadog.yaml Software Catalog file (v3), including kinds, ownership, inheritFrom, codeLocations, fileRef, pipeline fingerprints, system entities and the matching CODEOWNERS. Use whenever an entity file is touched, a catalog parity or ownership ticket comes up, a reviewer questions a catalog field, or Datadog shows an entity that disagrees with the repo."
license: MIT
---

# Datadog catalog entity

Read `~/.claude/skill-context/dd-catalog-entity.md` first if it exists. It holds this org's team handle, custom kinds, naming rules, GitHub org and deliberate exceptions, and wins over anything general here.

## Recall

```bash
memorygraph recall --query "datadog catalog <repo or entity>" --limit 10
```

## Facts that decide the file

- Datadog scans every readable repo for `entity.datadog.yaml` or `service.datadog.yaml` at any path. If kind+name does not match a hand-made UI entity you get a SECOND entity, not an update.
- Ownership is `metadata.owner: <team>`, matching the Datadog Team handle exactly. `team:team-<team>` is drift. The catalog search box takes `team:<team>`.
- Native kinds: `service`, `system`, `api`, `datastore`, `queue`, `frontend`. Custom kinds such as `library` must be registered in the org. No schema exists for `frontend` or custom kinds, so any `spec`/`datadog` key validates and proves nothing; confirm rendering in the UI.
- `spec.type`: stick to the v2.2 enum (`web`, `db`, `cache`, `function`, `browser`, `mobile`, `custom`). Lambda is `function`, a Django app on Kubernetes is `web`.
- `spec.languages: [javascript]` is correct. Datadog's own auto-detected token is `javascript`, never `js`. Reviewers flag this; cite this and keep it.

## Inheritance

`metadata.inheritFrom: service:x` COMPOSES links, contacts and tags from the parent. The `datadog.*` block does NOT inherit. So: shared links once on the service; `codeLocations` restated on each entity that needs a code binding. Api entities deliberately omit `pipelines.fingerprints` (no UI surface on kind:api). Fingerprints render on `frontend` (Delivery tab) and not at all on `library`.

Never co-locate a `kind:system` document with a `kind:service` in one file unless every document has `inheritFrom`: implicit inheritance is triggered by FILE co-location and has silently rewritten a service's metadata with another team's tags.

## codeLocations

Bare `{repositoryURL: ...}` with NO `paths`. A paths allowlist makes DORA report a config-only deploy as zero commits, and where every deploy rebuilds, those commits change production. A second `codeLocations` on a companion api entity is harmless: api entities emit no spans, so DORA never keys on them. Do not flag either again.

For SCA attribution `codeLocations` only works on `kind:service` and only by repo-name inference; `paths` is dead weight on frontend and library. Team attribution comes from CODEOWNERS independently.

## fileRef

`spec.interface.fileRef` is an absolute GitHub blob URL (`https://github.com/<org>/<repo>/blob/<branch>/<path>`), resolved through the GitHub integration. Arbitrary URLs are stored and never fetched. `definition` and `fileRef` are mutually exclusive. A GET returns `interface: {}` even when definition is set; check the Endpoints tab, not the API.

## Pipeline fingerprints

```
aggregate_datadog_ci_pipeline_events aggregation=count
  query='@git.repository.id_v2:"github.com/<org>/<repo>"'
  group_by=['@ci.pipeline.name','@ci.pipeline.fingerprint']
```

Only pipelines that have RUN since CI Visibility was enabled appear. Cross-check with `gh run list`; a workflow that ran but is missing means the repo is not enabled in the Datadog GitHub integration.

## System entities

`spec.components` is one flat level in the Hierarchy lens. Keep api entities out of `components`; `implementedBy` and `inheritFrom` already model them and give the nested Dependencies view. A library goes in via `dependsOn` on each consumer, declared on the consumer side only.

## CODEOWNERS

One catch-all line with every handle: `* @<org>/<team> @<org>/<other-team>`. Two `*` lines means only the last applies. `*` as the LAST line silently kills the per-path rules above it.

## Writing and verifying

- `POST /api/v2/catalog/entity` with `Content-Type: application/yaml` via `curl --data-binary`. Returns **202**. Flips `meta.ingestionSource` to `api`; a later UI edit overwrites the pushed schema and masks the repo file until the next push.
- Declaration is additive; omitting an entity from a push does not delete it. DELETE returns 204 even for an id that never existed. Confirm with `filter[ref]` and `meta.count`.
- A field absent from the document is cleared live, so check the context file for fields left unset on purpose.
- Attribute changes propagate in under 40s; findings reprocessing up to 24h. Hard-refresh the UI before concluding an upsert did nothing.
- Stale APM services (a `<service>-mysql` peer, say) are derived entity-graph nodes, not catalog records. They cannot be deleted; they age out when spans stop.
- Before changing anything, verify against live Datadog that the outcome is not already true (see `observability-ticket-preflight`).

## Memory

Store decisions and product behaviour, then append to the research file per `research-file-update`.
