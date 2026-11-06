---
name: eod-report
description: "End-of-day team report: key takeaways from today's meeting transcripts (decisions, follow-ups, committed dates), the PRs the user's teammates merged today, which are still open with comments, the tickets that moved to the deploy and done statuses, and which apps were deployed to production, appended to today's daily note, then a project-brain-sync from the same day. Use when the user asks for an end of day report, an EOD, a wrap-up of what the team shipped or decided today, or what moved today."
license: MIT
---

# End-of-day report

Read `~/.claude/skill-context/eod-report.md` first if it exists. It names the people in scope (with their code-host logins), the repos, the tracker statuses, the deploy channel, the meeting transcript folder and the daily note path, and wins over anything general here.

## 1. Gather (today, local time)

- **Merged**: for each person, `gh search prs --author <login> --merged-at ">=<today>" --owner <org> --json number,title,repository,url`.
- **Open with comments**: open PRs by those people with a comment or review today. Get the count of today's comments per PR from `gh pr view --json comments,reviews`. Leave out stale drafts with no activity today, and say so in a line ("<Name>: only old drafts").
- **Tickets**: issues in the team's project that transitioned today into each status the context file names, with the assignee. Code-review and QA sub-tasks count; name them as such.
- **Deploys**: today's messages in the deploy channel for the team's apps: app, time, who, and which PRs.
- **Meetings**: every transcript dated today in the transcript folder. Captioners repeat lines, so drop exact repeats before reading. See section 2 for what to keep.

If a source is unreachable (a tracker server down, an expired token), fill in the rest and mark that section `[not checked: <reason>]`. A section is never silently left out.

## 2. Key takeaways from meetings

Read the whole day across meetings, then write one list. A thread that came up in three meetings is one bullet, linked to each meeting.

- **Keep**: decisions, follow-ups someone took on, committed dates and times, risks and blockers named aloud.
- **Drop**: small talk, introductions, vendor onboarding boilerplate, and status that only restates the PR and ticket sections. A meeting with nothing worth keeping gets no bullet and no mention.
- **Committed dates and times always make the list**: launches, release and submission dates, deadlines, scheduled follow-up meetings (with time zone). They are never cut for budget.
- **Budget**: up to 30 bullets for the day, one line each (about 120 characters). Over budget, cut the least consequential decisions and follow-ups first, never a date.
- **Owners**: name an owner only when the transcript makes it unambiguous: the speaker says they'll do it, or another speaker hands it to someone by name. Speaker labels can be wrong; a shared room mic (the context file says how it is labelled) carries several people under one name, so a line on it is never attributed to its label, the user included. Speakers labelled with a room name rather than a person get a name only when the conversation shows who it is. When unsure, write the bullet with no owner.
- **Links**: end each bullet with a link to its source transcript. A ticket number read aloud becomes a tracker link only when the context makes clear it is a ticket; transcripts mishear numbers.

## 3. Write

Append to the daily note (create the headings at the end of the note if missing; never touch the user's notes above them). `### Key Takeaways` goes directly above `### End of Day Report`. On a rerun, replace both sections in place. Use this shape, and drop an empty takeaway bucket rather than writing "none":

```
### Key Takeaways
**Dates & times**
- <what>: <date, time, zone> ([[transcript|Meeting]])

**Decisions**
- <decision> ([[transcript|Meeting]])

**Follow-ups**
- <Owner>: <action> ([[transcript|Meeting]])
- <action with no clear owner> ([[transcript|Meeting]])

**Risks & blockers**
- <risk> ([[transcript|Meeting]])

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

## 4. Report

Print both sections, then a single line for anything that looks stuck: a PR open more than 3 days with unanswered comments, or a ticket in review with no PR. The vault's own commit job picks up the note; do not commit it.

## 5. Sync project pages

If the `project-brain-sync` skill is available, run it next. Today's transcripts carry most of what the project pages are missing, and it reads them on its own terms (its own window, sourcing and `[confirm]` rules), so don't hand it the takeaways as a substitute for the transcripts. Report its summary and `[confirm]` list after the EOD.
