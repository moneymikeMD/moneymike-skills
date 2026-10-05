---
name: sca-remediation
description: "Pull Datadog Software Composition Analysis (SCA) findings for the Interactive repos, roll them up into an actionable upgrade table by declared direct dependency, and remediate by relocking before editing any manifest. Use for any dependency vulnerability, CVE backlog, lockfile drift, Dependabot config, security findings digest or 'what do we need to upgrade' request across games-shared, game-rabbithole, game-crosswords, bracket-city-stuff, games-data and games-admin."
license: MIT
---

# SCA remediation

INTER-1932 found that 90% of the Interactive backlog was stale lockfiles, not upgrade
work. Two repos needed zero manifest edits. Start from that assumption and prove
otherwise per finding.

## Recall

```bash
memorygraph recall --query "sca <repo> dependencies" --limit 10
```

Evidence: `~/code/research/datadog-usage-research.md` (SCA sections) and
`~/code/research/dependabot-usage-research.md`.

## 0. Confirm Datadog SCA is still the read path

Datadog Code Security is billed separately from APM, per committer across SAST, static
SCA, secret scanning and IaC, plus per host for runtime SCA (~$538 for September 2026,
its first partial month). On 2026-09-29 the org decided not to use Datadog for security
yet and to revisit at the next renewal, because GitHub Advanced Security and Unwind
already cover it.

So do not assume the findings endpoint is live. `curl` it first; an empty or 403 result
means disabled, not clean. If it is off, the read path is GitHub Advanced Security and
Dependabot, and everything from section 2 down still applies to their output. Never
enable a Code Security dimension or add a repo to it to get data for a ticket: per
committer means the whole org pays, and Interactive is the only team driving Datadog
usage, so the line item lands on us.

## 1. Pull findings

`GET https://api.datadoghq.com/api/v2/security/findings` with `DD-API-KEY` and
`DD-APPLICATION-KEY`. The `/vulnerabilities` endpoint 403s and is wrong.

- `page[limit]` max 100. Page everything; `filter[finding_type]` is silently ignored.
  Filter locally on `attributes.attributes.finding_type == 'library_vulnerability'`.
  Nesting is doubled (`attributes.attributes`).
- Dedupe on `(repository_id, package.name, package.version, advisory.id)` preferring
  `origin:sci` over `origin:apm`, but UNION `package.root_parents` across the dupes
  first or a second required bump goes unnoticed.
- `advisory.type` gates fixability: only `component_with_known_vulnerability` has a fix
  version. Recommendations can be prereleases; check for `-alpha`, `-canary`, `-beta`.

## 2. Group by the declared direct dependency

Not by `remediation.recommended`, which often names a transitive with no line to edit.
Intersect `package.root_parents[].name` with the repo manifest, case-insensitively
(`django` vs `Django`). Per-finding threshold parses from `remediation.description`
"Upgrade to a version >= X", which refers to the VULNERABLE package.

"No remediation available" (`root_package: {}`) was wrong 3 of 9 times. It misses the
case where the declared range already permits the fix. Verify with
`npm view <pkg> dependencies` before recording a row as blocked.

## 3. Relock before editing anything

Copy `package.json` alone to a scratch dir, `npm install --package-lock-only
--ignore-scripts`, compare every resolved copy under `node_modules` against each
threshold WITHIN THE SAME MAJOR LINE (minor for 0.x). Two lines of `minimatch` are two
independent findings. Yarn 1 repos: npm's resolver is a proxy; regenerate the real
`yarn.lock` before trusting counts (`yarn install` first, then `yarn upgrade`; never
`yarn upgrade --latest`).

Only what survives the relock needs a manifest edit. Take the MINIMUM version that
clears, not latest, and check plugin `peerDependencies` before crossing a major.

## 4. Package-manager traps

- 0.x carets are pins on the minor.
- A range on the parent cannot fix the child; use `resolutions` (yarn) or `overrides`
  (npm). npm does not read yarn's `resolutions`; declare both when a Dockerfile
  npm-installs a yarn repo.
- Find the ceiling before picking an override version; test candidates.
- Exact pins break builds, not just updates (aws-sdk family drift). Unpinning can be
  load-bearing.
- A relock is not source-neutral; expect a formatting commit.
- Vite 6 ignores `includePaths`; rename to `loadPaths`.
- **A green build is not evidence for a runtime library.** Smoke-test anything on the
  request path before committing.
- Scanned artifact may differ from deployed artifact (Dockerfile copying only
  `package.json`).

## 5. Scope before reporting

Only production-scope findings are exposure. games-shared's findings are all
devDependencies and do not propagate to consumers; overlapping package names across
repos are separate installs, not propagation. Report critical counts with scope
attached.

## 6. Dependabot

`versioning-strategy: increase-if-necessary`. Security is paramount and lockfile-only
suppresses a security PR that needs a range bump. One entry per (ecosystem, directory,
target-branch). Split majors from minor/patch groups. Diagnose silent failures with
`gh pr list --author app/dependabot`: an unknown key invalidates the whole file, and a
full PR cap jams opening forever.

## 7. Deliver

One branch per repo `mike/INTER-xxxx/<slug>`, one commit, via `ship-pr`. No merge
offers. Store the baseline and per-repo results in memorygraph and append product
behaviour to the research file.
