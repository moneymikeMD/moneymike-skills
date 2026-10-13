# bash-lsp

Connects [bash-language-server](https://github.com/bash-lsp/bash-language-server) to Claude Code for `.sh` and `.bash` files.

Published through [moneymikeMD/moneymike-plugins](https://github.com/moneymikeMD/moneymike-plugins):

```sh
claude plugin marketplace add moneymikeMD/moneymike-plugins
claude plugin install bash-lsp@moneymike-plugins --scope project
```

Project scope is the suggested one: a language server indexes the project it starts in, so enable it in the repositories that hold shell scripts, not everywhere.

## Requirements

On `PATH` for the shell that starts `claude`, including a non-interactive one:

- `bash-language-server` (`npm install -g bash-language-server`, needs Node 20 or later)
- `shellcheck`, which supplies the diagnostics
- `shfmt`, optional, for formatting

## What the agent gets

Measured 2026-10-13 with bash-language-server 5.8.1, in a headless session:

- **Diagnostics after an edit.** Editing a shell script brings back shellcheck's findings for that file, with their codes (`SC2086` and so on). They are not part of the edit result: the server
  publishes them about 0.7 s later, and Claude Code attaches them to the next turn. A file with no findings brings back nothing.
- **The `LSP` tool.** Go-to-definition follows a `# shellcheck source=` directive to the sourced file. Document symbols work.

Limits found in the same test:

- **A subagent does not receive the diagnostics; its parent does.** A subagent has the `LSP` tool, but after its edit and two further tool calls it had received nothing, while the session that
  started it received the `SC2086` for the line the subagent wrote. An agent that authors scripts as a subagent still has to run `shellcheck` itself, and the main session pays for diagnostics on
  edits it did not make. Setting `"diagnostics": false` in `.lsp.json` stops the push and keeps the `LSP` tool.
- **An edit that ends the session gets none.** Diagnostics for the last edit before a final answer arrive after the model has stopped. A second edit to the same file also discards the first
  edit's pending diagnostics.
- **Find-references is incomplete.** It returned nothing for a function with a known caller in the same file.
- **The first request can fail** with "server is starting"; a retry works.

## A repository that sources by a computed path

The server gives shellcheck the script on stdin. A directive such as `# shellcheck source=../lib/common.sh` is relative to the script's directory, which shellcheck cannot know for stdin, so every
script that sources the library reports `SC1091` and then false "unused variable" findings. Name the directories in a `.shellcheckrc` at the repository root:

```text
external-sources=true
source-path=scripts
source-path=scripts/lib
```

Each `source-path` is a directory from which the relative path in the directive resolves. Add one for each depth of script directory.

## The whole configuration

`.lsp.json` is the server command, its `start` argument and the two extensions. The server's defaults already find `shellcheck` and `shfmt` on `PATH`. `INCLUDE_ALL_WORKSPACE_SYMBOLS` is left off on
purpose: with it on, go-to-definition for a common function name returned every definition in the workspace, nine in the test repository, where the default returned the one sourced definition.

## Checking that it is attached

Edit a shell script so that it has an unquoted variable and look for a diagnostics block naming `SC2086`. If none arrives, run `claude --debug` and search the log for `LSP`: `Loaded 1 LSP server(s)
from plugin: bash-lsp` means the plugin registered, and `Starting LSP server instance` means the server started. `/reload-plugins` reporting one LSP server only means the first of those.
