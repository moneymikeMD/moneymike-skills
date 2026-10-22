---
name: project-brain-sync
description: "Bring the user's active project pages up to date from what happened since their last_updated date: standup and meeting transcripts, tracker movement, merged PRs and chat threads. Update status, narrative, risks and team per the page template, link every ticket and person, mark uncertain claims for confirmation, and move finished projects to Completed. Use when the user asks to update the project brain or project pages, catch up the projects from standups, or move a project to completed."
license: MIT
---

# Project brain sync

Read `~/.claude/skill-context/project-brain-sync.md` first if it exists. It names the notes vault, the active and completed project folders, the people folder, the transcript folder and the tracker, and wins over anything general here.

A project page exists so the user can speak confidently about the project in a meeting. A wrong fact stated with confidence is worse than a gap, so every claim from this sync is either sourced or marked `[confirm]`.

## 1. For each active page

Read the page and its frontmatter `last_updated`. The window to sync is `last_updated` to now.

## 2. Gather the window

- **Transcripts**: each standup or meeting transcript in the window. Keep what bears on this project: status said aloud, blockers, decisions, dates, who's doing what. Transcripts mishear ticket numbers and names, so cross-check every key against the tracker before using it, and mark a mismatch `[confirm: read out as "X"]`.
- **Tracker**: tickets under the project's epics or mission that changed status in the window, plus new tickets.
- **Code**: PRs merged or opened in the window that are linked to those tickets.
- **Chat**: only threads the context file names, or ones the transcripts point to.

## 3. Update the page

- Follow the page's own template, section by section. Remove guidance blocks the template carries for reference (prompts like "If you're returning after a lapse"); keep the sections.
- Status block: status colour, phase, % complete, dates. Change a value only on evidence; add `[confirm]` to a judgement call.
- Narrative: rewrite it so it reads true today, not as a log of the window.
- Risks: close the ones that resolved (strike or remove them, citing the evidence), add new ones with impact and likelihood.
- Links: every ticket key to the tracker, every person to their page in the people folder (`[[Name]]`, or `[[Page|Display]]` when the page name differs), every PR to its URL. Add the epic's tracker component as a `theme` frontmatter field if it has one.
- Set `last_updated` to today.

## 4. Lifecycle

A project whose epics are all done, or that the user says is complete: move the page to the completed folder and set its status. A page with nothing of substance: ask before deleting, or delete it if the user already said to.

## 5. Report

Per page, a one-line summary of what changed, then every `[confirm]` you added, as a list the user can answer in one reply. The vault's own commit job picks up the edits; commit only if the user asks.
