---
name: eod-report
description: "End-of-day team report: the PRs the user's teammates merged today, which are still open with comments, the tickets that moved to the deploy and done statuses, and which apps were deployed to production, appended to today's daily note. Use when the user asks for an end of day report, an EOD, a wrap-up of what the team shipped today, or what moved today."
license: MIT
---

# End-of-day report

Read `~/.claude/skill-context/eod-report.md` first if it exists. It names the people in scope (with their code-host logins), the repos, the tracker statuses, the deploy channel and the daily note path, and wins over anything general here.

## 1. Gather (today, local time)

- **Merged**: for each person, `gh search prs --author <login> --merged-at ">=<today>" --owner <org> --json number,title,repository,url`.
- **Open with comments**: open PRs by those people with a comment or review today. Get the count of today's comments per PR from `gh pr view --json comments,reviews`. Leave out stale drafts with no activity today, and say so in a line ("<Name>: only old drafts").
- **Tickets**: issues in the team's project that transitioned today into each status the context file names, with the assignee. Code-review and QA sub-tasks count; name them as such.
- **Deploys**: today's messages in the deploy channel for the team's apps: app, time, who, and which PRs.

If a source is unreachable (a tracker server down, an expired token), fill in the rest and mark that section `[not checked: <reason>]`. A section is never silently left out.

## 2. Write

Append under the daily note's `### End of Day Report` heading (create it at the end of the note if missing; never touch the user's notes above it). Use this shape:

```
### End of Day Report
Scope: <people>.

**Merged today**
- <Name>: [repo#N](url) <title>
- <Names with nothing>: none

**Open with comments (active today)**
- <Name>: [repo#N](url) <short title>, <KEY> (<comment count>)

**Tickets**
- <status>: none | <KEY> <title> (<Name>)

**Deployed to production (<channel>)**
- <app>, <time> by <Name>: #N, #N
```

Use the names people go by (the context file maps logins to names), and link tickets.

## 3. Report

Print the section, then a single line for anything that looks stuck: a PR open more than 3 days with unanswered comments, or a ticket in review with no PR. The vault's own commit job picks up the note; do not commit it.
