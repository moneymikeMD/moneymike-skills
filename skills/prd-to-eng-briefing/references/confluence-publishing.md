# Publishing the brief to Confluence

Read from `prd-to-eng-briefing` before publishing the engineering brief to Confluence.

### Publishing to Confluence

Pasting markdown into the Confluence editor silently strips every link. Publish through the
API instead, and note which Atlassian site the space is on. The wiki and the tickets you
link can sit on **different sites and connectors**.

**Use `contentFormat: "html"`, never `"markdown"`.** ADF cannot carry a `code` mark and a
`link` mark on the same text node, and the two converters resolve that conflict in opposite
directions:

| format | `[`path`](url)` becomes |
|---|---|
| `markdown` | monospace text, **href discarded** |
| `html` | a working link, monospace discarded |

Links are worth more than monospace in a document whose purpose is navigation. Markdown also
autolinks bare hostnames into junk (`Amazon.com` becomes `http://Amazon.com`) and drops bold
that wraps a code span; HTML does neither.

Call `getContentFormatGuide` with the tool name before authoring HTML. Convert the markdown
mechanically rather than by hand: headings to `<h2>`–`<h6>`, paragraphs to `<p>`, tables to
`<table><thead><tr><th><p>…`, cells wrapping block content in `<p>`, fenced code to
`<pre><code class="language-x">`, and inline links to `<a href="URL"><code>label</code></a>`.
Escape `&`, `<` and `>` before adding tags. Emit a body fragment with no `<html>` wrapper.

Drop the H1; the page title already carries it.

**Verify by reading the page back and counting anchors.** Do not report success from the
update response, which returns only a version number. Fetch the page and confirm the link
count matches what you sent.

Known cosmetic artifact: bold that wraps a code span renders with the emphasis split at the
boundary. Harmless, but rewrite those sentences if the page needs to look polished.
