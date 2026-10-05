# moneymike-skills

Personal workflow skills for Claude Code, written to be environment-neutral. Each skill first reads `~/.claude/skill-context/<skill>.md` if it exists; that file supplies the sites, IDs, hosts and devices for the machine it runs on and is kept outside this repo.

Private while it goes through verification. Install with:

```sh
claude plugin marketplace add moneymikeMD/moneymike-skills
claude plugin install moneymike-skills@moneymike-skills
```

Going public: delete `.claude-plugin/marketplace.json` and add an entry to `moneymikeMD/moneymike-plugins`.
