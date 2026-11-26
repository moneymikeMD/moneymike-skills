# The engineering brief

Read from `prd-to-eng-briefing` at Phase 6, before writing `<slug>-engineering-brief.md`.

### `<slug>-engineering-brief.md`

The shareable artifact. Two audiences read one document: engineers who need a starting point
before opening the code, and product managers who need to understand how the system is
actually built. It also becomes starting context for their own LLM sessions, so it must be
dense and literal. Do not split it into engineering and business sections.

Content:

- Keep the technical specifics. Code paths, table and field names, query sources, thresholds
  and measured numbers are the point, not noise to summarise away. A reader goes from this
  document straight to the file or the query.
- Attribute every number to its source so a reader can re-derive it. Open with a data
  sources table.
- State findings as facts with their evidence. Inference is labelled in the same sentence.
- Preserve anything surprising, undocumented or invisible in the repository. Highest value
  content in the document.
- Drop methodology narrative, dead ends, session history, and anything reading as a status
  update. Drop the ticket list and the project decisions; those live in the research file.
  Keep access and query instructions, because without them nothing is re-derivable.

Style:

- Terse. No pleasantries, no framing sentences, no "it is worth noting", no closing summary,
  no offers of further work.
- No idioms, no metaphors, no filler, no hype adjectives.
- **No em dashes or en dashes.**
- Short declarative sentences. Tables and lists wherever the content is structured data.
- Define an acronym or internal term once, on first use.
- Headings name the thing described, not the section's purpose. "Feed routing", not
  "Background and Context".
- As short as the content allows. Delete any heading with nothing under it.
- **Do not hard-wrap.** One line per paragraph, so it survives being pasted elsewhere.
  Headings, table rows, list items and fenced code keep their own lines.

Make every reference clickable:

| reference | target |
|---|---|
| code path with a line number | `https://github.com/<owner>/<repo>/blob/<default-branch>/<path>#L<n>` |
| commit, pull request | `/commit/<sha>`, `/pull/<n>` |
| ticket key | `https://<jira-site>/browse/<KEY>` |
| Confluence page | resolve the real URL from the search result, do not guess |
| Django admin page | the live admin URL, checking where the urlconf mounts admin |
| Google Doc or Sheet | the URL from the PRD, first mention only |
| BigQuery table | the project's BigQuery console, first mention only |
| Slack channel | `https://<workspace>.slack.com/archives/<CHANNEL_ID>` |
| live endpoint | link it where clicking is the verification, such as a defects table. Not on every mention. |

Confirm the repo and default branch from `git remote get-url origin` rather than assuming;
they differ per repo. Do not link a file that the document cites because it does not exist.

Before handing it over, verify:

```bash
grep -n '[—–]' <file>                      # must be empty
grep -nE '\]\([^)]*\]\(|\[\[' <file>        # no nested links
awk '{o=gsub(/\[/,"[");c=gsub(/\]/,"]"); if(o!=c) print NR}' <file>   # balanced
sed -n '<n>p' <repo>/<path>                 # every linked line still says what you cite
```

Line-anchored links to a moving branch drift. Verify each one at write time, state in the
data sources table which ref they point at, and offer to pin to a commit SHA for a document
expected to outlive the branch.
