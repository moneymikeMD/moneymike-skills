---
name: qa-handoff
description: "Write the step-by-step test guide QA follows to verify a ticket: pick the playbook for the ticket's type, build numbered steps with exact settings, data and expected results, attach real example sessions or links, and stage the comment for one approval. Use when the user asks for a testing guide, steps for QA or a named tester, how to test this ticket, or session ids or links to give the QA team."
license: MIT
---

# QA hand-off

Read `~/.claude/skill-context/qa-handoff.md` first if it exists. It holds the playbooks for this environment's ticket types (app toggles, environments, test accounts, where telemetry lands) and wins over anything general here.

A tester follows the guide literally, often on a different device, a different day, without the context the author had. Every step must be executable as written, and every expected result observable.

## 1. Understand the change

Read the ticket, its parent, and the merged PRs. State in one line what changed for a user and where it can be observed: a screen, an API response, a telemetry event, a dashboard. Note which environments it is deployed to.

## 2. Pick the playbook

Match the ticket to a playbook in the context file by what is being verified (telemetry in an app, a UI change on web, a CMS or admin flow, a backend or API change, ...). The playbook supplies the setup steps, the environment, and where to look.

**No playbook fits**: derive the steps from the code and the PR. Mark every step you could not run yourself as `[unverified]`, and after the comment is posted, offer the user a new playbook entry for the context file, written generally enough to cover the next ticket of this type. That is how the playbook set grows.

## 3. Walk it yourself

Run the steps end to end when you can (the browser, the simulator via `ui-bug-repro`, an API call). Any step you had to change while walking it is a step the tester would have failed on. Capture real example evidence: session ids or links, screenshots, response bodies. A guide with a working example is easier to follow than steps alone.

## 4. Write it

```
**Setup**
1. <exact action, with the exact setting name in quotes>
...

**Test**
1. <action>. Expect: <observable result>.
...

**Where to look**
<link or query, and what a pass looks like>

**Example**
<link to a real session or result from step 3>
```

Number every action. State settings by their on-screen label, in order, including restarts ("force-close the app and reopen it: the setting only takes effect at launch"). One expected result per test step. Write in the user's voice. No background and no explanation of the implementation: the tester needs to know what to do and what they should see.

## 5. Stop

Show the draft and stage the comment on the QA ticket (the sub-task, if one exists, else the parent). Post only after approval. If the user edits it, post their version and diff it into the voice file. Keep the clickable links clickable.
