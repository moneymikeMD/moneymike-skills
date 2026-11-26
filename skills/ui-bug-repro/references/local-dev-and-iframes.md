# Local dev server traps and embedded-iframe gotchas

Read from `ui-bug-repro` when a local dev server or proxy misbehaves, or the page under test is embedded in an iframe or a WebView.

## Local dev server traps

- Vite bound to `[::1]` only makes a reverse proxy dialling `127.0.0.1` return 502 while `localhost:<port>` works. Point the proxy at `localhost:<port>`; it is a local-only fix, so do not change `vite.config.ts`.
- Vite 8 needs `server.allowedHosts` in `vite.config.ts` for a custom local hostname; there is no CLI flag. Do not pipe `npm run dev` to `head`; SIGPIPE kills it.

## Embedded-iframe gotchas

- `scrollIntoView` inside an iframe scrolls the HOST page and yanks the reader's position. Set the nearest scroller's `scrollTop` directly and gate on the element actually being clipped.
- Android WebView with `adjustResize` behaves like `interactive-widget=resizes-content`; Chrome defaults to `resizes-visual`. Test both; a fix must stay inert under `resizes-visual`.
