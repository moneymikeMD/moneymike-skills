---
name: compact-all
description: "Run /compact in every idle Claude Code session in the current Herdr server, so the summaries are written while the prompt caches are still warm. Use when the user says compact all, compact everything, or is stepping away from their sessions (lunch, a meeting) and wants them small on return."
disable-model-invocation: true
license: MIT
---

# Compact all

Read `~/.claude/skill-context/compact-all.md` first if it exists. It holds this environment's specifics and wins over anything general here.

Compacting just before stepping away writes each summary from a warm cache, so on return a session reloads a short summary into a cold cache instead of its whole context. Run it when the user is leaving, not when they come back.

## Steps

Stop and say so if `HERDR_ENV` is not `1`.

```bash
herdr agent list | jq -r --arg self "$HERDR_PANE_ID" '.result.agents[]
  | select(.agent == "claude" and .pane_id != $self)
  | [.pane_id, .agent_status, .terminal_title_stripped] | @tsv'
```

Send `/compact` to every pane whose status is `idle` or `done`, in parallel, and wait for each:

```bash
herdr agent prompt <pane_id> "/compact" --wait --timeout 300000
```

Never touch a `working`, `blocked` or `unknown` session: a working one is mid-task, and a blocked one is waiting on a question only the user should answer. List them as skipped.

`agent prompt` pastes the text, so the slash menu never opens and `/compact` cannot resolve to `/compact-all` and recurse.

## Report

One line per session: pane, title, then compacted, failed (with the error code) or skipped (with the status). A timeout or `agent_prompt_stalled` does not prove the compact never started; read the pane with `herdr agent read <pane_id> --source recent-unwrapped --lines 20` before calling it failed, and never resend.

End by telling the user to run `/compact` in this session too. It cannot compact itself mid-turn.
