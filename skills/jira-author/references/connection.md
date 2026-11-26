# Connection, transitions and connector gotchas

Read from `jira-author` before the first Atlassian call of a session, and whenever a call returns something unexpected.

## Connection

Use the Atlassian connection and project the context file names. Check `getJiraProjectIssueTypesMetadata` for the issue type name before creating rather than guessing it. An empty search result is not evidence a ticket is absent until you know you are querying the right site.

## Transitions and connection gotchas

Look up transition ids with `listJiraIssueTransitions` rather than guessing, unless the context file lists them.

The Atlassian MCP can return an AWS WAF human-verification HTML page instead of JSON. That is not a permissions problem and not evidence the ticket is missing; retry once, then tell the user the site is challenging the connector.
