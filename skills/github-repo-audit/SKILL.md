---
name: github-repo-audit
description: Audit and harden a GitHub repo's settings — description/topics, Issues/Wiki, branch protection, delete-branch-on-merge, secret scanning, Dependabot, CI, CHANGELOG/release-please. Use when creating a new repo, when the user asks to "audit"/"harden"/"clean up" a repo's GitHub settings, or before a repo goes public.
license: MIT
---

# GitHub repo audit

Read `~/.claude/skill-context/github-repo-audit.md` first if it exists. It holds this environment's GitHub account, the repos behind the precedents below and their dates, and wins over anything general here.

A checklist of the GitHub-side settings that are easy to forget because
nothing in the codebase fails without them — the repo just quietly lacks
hygiene a reasonable open-source (or even private solo) project should have.
Run this against a repo's *current* state, never assume; several of these
default off and stay off silently.

Established against one of the user's repos in a past session. That session's
answers to the judgment calls below are the *precedent*, not a universal
default — re-ask per repo, the right answer depends on the repo's workflow
and visibility.

## 1. Read current state first

Never propose changes blind. Pull the real settings:

```bash
gh repo view OWNER/REPO --json description,repositoryTopics,hasIssuesEnabled,hasWikiEnabled,deleteBranchOnMerge,visibility,defaultBranchRef
gh api repos/OWNER/REPO/rulesets
gh api repos/OWNER/REPO/branches/main/protection          # 404 if none — expected, not an error
gh api repos/OWNER/REPO --jq '{security_and_analysis, allow_auto_merge, allow_squash_merge}'
gh api repos/OWNER/REPO/contents/.github/dependabot.yml   # 404 if absent
gh api repos/OWNER/REPO/actions/workflows
git -C REPO tag -l                                        # any existing releases, for release-please seeding
```

## 1b. Resolve every version before writing it

**A version literal is a fact with an expiry date, and it does not look like
one.** It reads as boilerplate, so it slips past the checks applied to every
other claim. Every `uses:` pin, `node-version`, base image and package
version written into a new repo must be resolved at write time:

```bash
gh api repos/OWNER/ACTION/releases/latest --jq .tag_name   # per action
npm view PACKAGE version                                   # per npm package
```

Never copy a pinned version out of this skill's assets, out of memory, or
out of a remembered example. The assets carry `@vLATEST`, which is invalid
on purpose: a run that fails loudly beats a repo that silently starts three
majors behind.

Prefer a self-resolving form where one exists — `node-version: lts/*`, or
`node-version-file: .nvmrc` — so the value cannot go stale at all.

Established on one of the user's repos: a repo created minutes
earlier opened three Dependabot PRs immediately, because the assets pinned
`checkout@v4` (current: v7.0.1), `fetch-metadata@v2` (v3.1.0) and
`release-please-action@v4` (v5.0.0). Dependabot only caught it because the
same audit had just enabled Dependabot; a repo without it keeps the stale
pins indefinitely.

## 2. Mechanical, no-decision-needed fixes

Safe to apply directly, no workflow change, fully reversible:

* **Description** — set if missing (`gh repo edit --description "..."`).
* **Topics** — set if empty. Pick 4-8 real ones (stack, domain, key
  integrations), not generic filler.
* **`delete_branch_on_merge`** — turn on (`gh repo edit --delete-branch-on-merge`). Harmless even in a no-PR workflow.
* **Secret scanning + push protection** — turn on unless there's a specific
  reason not to (there rarely is):
  ```bash
  gh api -X PATCH repos/OWNER/REPO \
    --raw-field 'security_and_analysis[secret_scanning][status]=enabled' \
    --raw-field 'security_and_analysis[secret_scanning_push_protection][status]=enabled' \
    --raw-field 'security_and_analysis[dependabot_security_updates][status]=enabled'
  ```

## 2b. Actions permissions release-please (and Dependabot auto-merge) need

If `release-please` is going in, also set **Settings > Actions > General >
Workflow permissions** to **"Read and write permissions"** with **"Allow
GitHub Actions to create and approve pull requests"** checked (or via API:

```bash
gh api -X PUT repos/OWNER/REPO/actions/permissions/workflow \
  -f default_workflow_permissions=write -F can_approve_pull_request_reviews=true
```

— this call itself is a permission grant, so expect it to need the owner's
own terminal, not an agent's). Without it, `release-please` fails outright:
"GitHub Actions is not permitted to create or approve pull requests." It
opens its release PR with the default `GITHUB_TOKEN`, which needs this
grant to create PRs at all.

**Known quirk once that's set: a commit pushed with the default
`GITHUB_TOKEN` does not trigger other workflows** (GitHub's anti-recursion
guard). `release-please` rebasing its own PR on every push to the default
branch is exactly this — the rebase lands, but `ci.yml`'s
`pull_request`/`push` triggers never fire on it, so the release PR shows
stale or missing checks indefinitely. Fix each time: `gh pr close <n> &&
gh pr reopen <n>` (a human/PAT-authored event, so it *does* trigger the
workflows). No permanent fix without a PAT standing in for `GITHUB_TOKEN`
on that one workflow.

## 3. Costed correctly: GitHub Actions

**Actions minutes are free and unlimited on GitHub-hosted runners for public
repos.** The cost concern only applies to private repos (minutes come out of
a monthly quota there). Don't let a blanket "avoid Actions for cost" rule
carry over to a public repo — re-derive the decision on the merits (noise,
maintenance burden) instead, per repo.

## 4. Decisions that need the owner — ask, don't assume

These change how the repo is worked, or cost money on a private repo. Use
`AskUserQuestion`, one round, batched:

* **Branch protection strength.** A ruleset requiring PRs is real GitHub
  best practice, but it changes a direct-push workflow into a PR-then-merge
  one. Options seen in practice: (a) lightweight — block force-push and
  branch deletion only, no PR required; (b) full — require a PR, merged
  immediately after (this is about change visibility and a second
  GitHub-native record, not a review gate); (c) skip entirely.
  **On a public repo, ask separately whether outside contributors should
  need an approval even if the owner doesn't.** Set
  `required_approving_review_count: 1` on the `pull_request` rule, and add
  the owner as a bypass actor so their own PRs merge without waiting:
  ```json
  "bypass_actors": [{ "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" }]
  ```
  `actor_id: 5` is the built-in "admin" repository role (2 = maintain, 4 =
  write). This keeps external PRs gated on the owner's review while the
  owner (and an agent acting on their account) merges immediately, same as
  a `required_approving_review_count: 0` setup would for them — verify
  `current_user_can_bypass` comes back `"always"` after applying it.
* **Wiki.** If the repo already has a `docs/` (or similar) directory as its
  doc home, a Wiki is a second, competing source of truth unless it's kept
  in sync automatically. Default recommendation: leave disabled. If the
  owner wants it anyway, offer the sync-workflow pattern in `assets/wiki-sync.yml`
  rather than a manually-maintained wiki (GitHub wikis have no way to
  literally mount a folder — mirroring on push is the closest equivalent,
  and it needs one manual step: create the wiki's first page through the
  web UI once, since the wiki's git repo doesn't exist until then).
* **Dependabot PR handling.** Version-update PRs need a policy or they pile
  up unreviewed. Options: manual review only; auto-merge patch/minor once
  CI passes (needs `allow_auto_merge` on and a required CI status check —
  see `assets/dependabot-auto-merge.yml`); hold off on Dependabot entirely.
* **Minimal CI.** `npm test` (or equivalent) on push/PR. Free on public
  repos (see §3); still a real decision on private ones or repos that
  deliberately have no test suite yet.
* **CHANGELOG generation.** If the project uses (or is willing to adopt)
  Conventional Commits, `release-please` (`assets/release-please.yml` +
  `release-please-config.json` + `.release-please-manifest.json` seeded
  from the latest existing tag) gives an auto-maintained `CHANGELOG.md` and
  version bumps via a release PR, with no manual changelog writing. Ask
  first if the repo doesn't already use Conventional Commits — it's a
  prerequisite, not a side effect of adding the workflow.

## 4b. Formatting: printWidth 160, not Prettier's 80 default

The user's standing preference (not specific to the precedent repo — apply by default to
any new JS/TS repo that uses Prettier): `printWidth: 160` in
`.prettierrc.json` (`assets/.prettierrc.json`). Prettier's 80-column default
forces nearly every function call, parameter list, and method chain onto its
own line. There is no separate Prettier option for "inline parameter lists"
or "chain calls on one line" — both are emergent from `printWidth` alone;
raising it is the whole mechanism, nothing else to configure.

## 5. Assets

Copy-and-adapt starting points, taken from the precedent pass (Node/npm
project; adjust the runtime/package-manager steps for other stacks):

* `assets/ci.yml` — test on push/PR
* `assets/dependabot.yml` — weekly npm + github-actions version updates
* `assets/dependabot-auto-merge.yml` — auto-merge patch/minor once required checks pass
* `assets/release-please.yml` + `assets/release-please-config.json` — CHANGELOG + version PRs from Conventional Commits
* `assets/wiki-sync.yml` — mirrors `docs/*.md` into the Wiki on push
* `assets/pull_request_template.md` — adapt or drop the character-limit line, that was this owner's personal rule, not a general default
* `assets/pr-body-length.yml` — only if the owner has an actual PR-body length rule to enforce; don't add this speculatively. Exempts Dependabot and every release-please PR, matched by its `release-please--` head branch because a PAT-driven release PR is authored by the owner, not `github-actions[bot]`. Their bodies are generated changelogs, never meant to satisfy a human-authored length rule
* `assets/.prettierrc.json` — printWidth 160 (see §4b), default for any repo adopting Prettier
* `assets/.prettierignore` — scopes Prettier to actual source; also excludes `CHANGELOG.md` and `.release-please-manifest.json`, which `release-please` owns and rewrites in its own style (Prettier fighting them fails CI on every release)

## 6. Ruleset creation needs real check names

A branch ruleset's required-status-check `context` must match an actual
check-run name, which only exists after a workflow has run at least once.
Order of operations: commit and push the workflow files (direct push is
still open at this point), let CI run once on that push, read the check
names back (`gh run list` / `gh api repos/OWNER/REPO/commits/SHA/check-runs`),
*then* create the ruleset requiring them. Creating the ruleset first and
guessing the context name produces a check that can never be satisfied.

## 7. After landing

Update the repo's own CLAUDE.md (or equivalent) to describe the new
workflow in the same terms a session would need to work with it going
forward — PR-required or not, Dependabot's auto-merge policy, where
CHANGELOG comes from. A settings change nobody documents gets rediscovered
the hard way next session.
