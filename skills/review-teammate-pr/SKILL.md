---
name: review-teammate-pr
description: "Review a teammate's PR from a GitHub URL or number and print the findings in chat for the user to paste into GitHub themselves: checks the diff against the design team's VQA notes in the ticket's sub-tasks, never posts anything, and keeps each fix to two sentences with no rationale attached. Use whenever the user links someone else's PR and asks for a review, says review my teammate's PR, look over this PR, or run /code-review on a PR URL."
license: MIT
---

# Review a teammate's PR

Read `~/.claude/skill-context/review-teammate-pr.md` first if it exists. It names the issue tracker and how to reach it, and wins over anything general here.

The user is the one who talks to the author. This skill produces text they read first and paste second, so it has to be short enough to paste and correct enough to defend.

## Rules that do not bend

- **Never post anything.** No `/code-review --comment`, no `gh pr review`, no `gh pr comment`, no `--fix`, no branch checkout that leaves state behind. The findings go in the chat reply and nowhere else.
- **Two sentences per fix, hard ceiling.** Say that it is broken and what to change. The developers do not need the why, the history, the spec link, or the general principle.
- **Cut everything that is not a finding.** No overall verdict paragraph, no "great work on X", no summary table, no file-by-file walkthrough, no offer to fix it or open a follow-up.
- **Drop what you could not verify.** A hedged finding costs the user a conversation with the author. If you cannot confirm it against the code in the repo, leave it out rather than qualifying it.

## Run it

1. `gh pr view <url> --json title,body,author,baseRefName,files,commits` to get the intent and the date of the last commit.
2. **Read the ticket and its sub-tickets.** The PR body links a ticket; fetch it and then every sub-task under it. The VQA sub-task is where the design team leaves the notes that say whether the implementation actually matches what they asked for, and those notes are usually newer than the PR. Compare each note to the diff line by line, and compare its timestamp to the last commit date: a note posted after the last commit is an outstanding change the PR has not answered yet.
3. Invoke `/code-review <pr-number-or-url> high`. Never add `--comment` or `--fix`.
4. Re-sort the output with the `review-pr-scoped` skill's three buckets: blocking, non-blocking in scope, non-blocking expands scope. That skill owns the ranking; do not restate its reasoning here.

## Compare the VQA timestamp to the last commit before writing anything

This decides the shape of the whole reply, so do it before the findings and put the answer in the first line.

- **VQA note is older than the last commit.** The author has had a chance to act on it and did not. It is a stated requirement the PR misses, so it goes in the blocking bucket quoting the designer's own numbers.
- **VQA note is newer than the last commit.** The author has not seen it yet. It is not a review finding and must not be formatted as one, because telling someone they missed feedback filed after they stopped working is how a review turns into an accusation.

For the newer case, open with one line naming both timestamps and the gap in plain terms ("design left notes 4 hours ago, last commit was 2 days ago, so these are outstanding rather than missed"). Then list the notes under **Already with the author** as a short bulleted checklist, with no fix sentences and no file anchors. The findings sections below it then cover only what `/code-review` and the diff turned up on their own, which is the part the user actually needs to send.

If every VQA note postdates the last commit and nothing else surfaced, say that and stop. There is nothing to paste.

## Output format

One finding per block, nothing between blocks but a blank line:

```
**`src/components/Foo.tsx:42`** — <what is broken, one line>
<Fix, one or two sentences.>
```

Blocking findings first. Start each scope-expanding one with "Non-blocking, expands scope:" as the literal first words, and say when the issue is inert today.

If the diff is clean, the whole answer is one line saying so.

## After

Store any recurring false positive or repo-specific trap:

```bash
memorygraph store --type code_pattern --title "<repo>: <pattern>" --content "<what and why>" --tags "<repo>,code-review,<component>"
```
