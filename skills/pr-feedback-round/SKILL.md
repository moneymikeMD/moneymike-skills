---
name: pr-feedback-round
description: "Work the next round of review feedback on a PR: fetch the reviewers' new comments and the user's own replies, sort each thread into fix, answer or decline, make the fixes as local commits and draft any replies in the user's voice, then stop for approval to push and post. Use when the user says someone left comments, replied, reviewed, or asks to fetch the comments and suggest the next round."
license: MIT
---

# PR feedback round

Read `~/.claude/skill-context/pr-feedback-round.md` first if it exists. It holds this environment's specifics and wins over anything general here. Also read `memory.md` from that directory if it exists; with no memory store, skip the recall and store steps and say what was not stored.

The user talks to the reviewer. This skill turns their thread into commits and paste-ready replies so one approval closes the round.

## 1. Fetch the round

1. Resolve the PR from the URL, number, or the current branch (`gh pr view --json number,url,headRefName,author,reviews,comments`).
2. Pull every review thread with its resolution state and comments:

   ```bash
   gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){reviewThreads(first:100){nodes{isResolved isOutdated path line comments(first:50){nodes{author{login} body createdAt url}}}}}}}' -F o=OWNER -F r=REPO -F n=N
   ```

   Also read the top-level conversation (`gh pr view N --comments`). A reviewer who answers in Slack or on a companion PR does not show up here. If the user says "he left them on the other PR", go there.
3. The round is every unresolved thread whose last comment is not the user's, plus any thread where the user replied since the last push. The user's own replies are decisions. Read them before anything else, because they often settle a thread or change the fix.

Done when every unresolved thread is in the round or explicitly skipped.

## 2. Sort each thread

- **Fix**: the user agreed, or the reviewer is right and it is in scope. Make the change.
- **Answer**: a question, or a suggestion the user already declined. Draft a reply only.
- **Decline**: out of scope, or the user has signalled they will pass. Draft a short reply that names the trade-off, and propose a follow-up ticket only if the user asks for one.

When unsure whether the reviewer is right, check the code before deciding. A fix you cannot verify becomes an answer that asks a question.

## 3. Make the fixes

One new commit per round, on top of the branch, with no amend and no force-push (the `ship-pr` rule). Run the repo's tests and lint before committing. When the user asks to understand a better fix the reviewer found, add one line on how it could have been derived. That line goes in the chat, not in the commit.

## 4. Draft the replies

Write in the user's voice (the context file names the voice file, and it wins over defaults). One block per thread, ready to paste:

```
**<path>:<line>** (<reviewer>) <thread url>
<reply>
```

When the reviewer suggested a code change the user accepts, the reply is usually "Done." plus the commit SHA. Keep GitHub `suggestion` blocks when the user asks for them.

## 5. Stop

Show the commit list, the replies, and the exact commands, then wait:

```bash
git push
gh api repos/OWNER/REPO/pulls/N/comments/COMMENT_ID/replies -f body=@reply.md   # per thread, only if the user wants them posted
```

The user usually pastes the replies themselves. Post them only when told to, and then fetch them back to confirm the backticks survived. After the user posts in their own words, compare what they posted with the draft and update the voice file (see `voice-draft`).

## Memory

Store a `code_pattern` titled `<repo>: <reviewer's point>` for any reviewer catch that would have been cheap to find first. Content: the catch and how to spot it next time. Tags `<repo>,code-review`.
