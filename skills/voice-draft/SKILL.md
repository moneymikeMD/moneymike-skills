---
name: voice-draft
description: "Draft anything the user will post or send as themselves (a PR reply, review comment, ticket comment, Slack message) into a scratch markdown file they can edit, then, once they post it, fetch what they actually posted, compare it with the draft, and rewrite the voice file's rules so the next draft needs fewer edits. Use when the user says draft a reply, save it to a temp md file, I'll rewrite it, I posted it, check it, or I replied, go learn how I write."
license: MIT
---

# Voice draft

Read `~/.claude/skill-context/voice-draft.md` first if it exists. It names the voice file, the drafts directory and how to fetch posted text from each place the user posts, and wins over anything general here.

Two halves, often in different turns: **draft** (into a file) and **learn** (from what was posted). Do the learn half whenever the user says they posted or edited something, even if this skill did not write the draft.

## Draft

1. Read the voice file in full, then the format rules of the artifact's own skill if there is one (`jira-author` for tickets, `ship-pr` for PR bodies).
2. Write the draft to `<drafts dir>/<yyyy-mm-dd>-<slug>.md`, never into the chat alone. Chat rendering mangles backticks, list indentation and line breaks the user would have to fix by hand. Put each separately pasteable piece under a `## <where it goes>` heading (a thread URL, a ticket key).
3. Run it through `/humanizer` with the voice file as the sample, then reread it against the voice file's ban list.
4. Print the file path and a short preview, then wait.

When the user says "I made some snips, check it out", read the file back, compare it with what you wrote, and go to Learn using the file as the posted text.

## Learn

1. Fetch the text as actually posted (the context file says how for each place). Use the user's posted words, never your draft.
2. Diff it against the draft. For each change, decide which kind it is:
   - **a rule**: it would apply to the next draft too (a word they always cut, a structure they prefer, a tone shift),
   - **a fact fix**: you got something wrong (a name, the real file name, which team owns what), or
   - **one-off**: specific to this thread.
3. Fold rules into the voice file **in place**: rewrite or replace the rule the evidence changes, and replace an example pair when the new one teaches it better. The file is declarative, so don't append a log. Fact fixes go to the memory store or the relevant research file. One-offs are dropped.
4. Report each change in a line: the rule added or rewritten, or "no new rule: the user's edits were one-off". When the user posted the draft unchanged, say so. That is the signal the voice file is converging.
