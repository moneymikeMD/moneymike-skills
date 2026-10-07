# Memory store

Copy to `~/.claude/skill-context/memory.md` and describe your own store. Skills say what to recall or store (a query, or a type, title, content and tags) and read this file for how. This sample uses the `memorygraph` CLI.

- Recall: `memorygraph recall --query "<query>" --limit <n>`.
- Search by tag: `memorygraph search --tags <tag> --limit <n>`.
- Store: `memorygraph store --type <type> --title "<title>" --content "<content>" --tags "<a>,<b>"`. Skills name types such as `solution`, `fix`, `error`, `code_pattern` and `workflow`; map them to whatever your store uses.
- Backticks or `$(...)` inside a double-quoted `--content` run as command substitution and silently truncate the memory. Put such content in a quoted heredoc first.
