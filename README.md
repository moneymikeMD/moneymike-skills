# moneymike-skills

Personal workflow skills for Claude Code, written to be environment-neutral. Each skill first reads `~/.claude/skill-context/<skill>.md` if it exists; that file supplies the sites, IDs, hosts and devices for the machine it runs on and is kept outside this repo.

Two shared context files are optional. `memory.md` tells the skills how to recall and store memories; without it they skip those steps and say what was not stored. `research.md` names the directory for per-product research files; without it they skip research appends, and `research-file-update` stops. Samples are in `examples/`.

Published through [moneymikeMD/moneymike-plugins](https://github.com/moneymikeMD/moneymike-plugins). Install with:

```sh
claude plugin marketplace add moneymikeMD/moneymike-plugins
claude plugin install moneymike-skills@moneymike-plugins
```
