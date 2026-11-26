# Verify a web build inside an app WebView without inspecting it

Read from `ui-bug-repro` when the question is whether a web change behaves inside the app.

When the question is "does this web change behave inside the app" (telemetry, a bridge, a postMessage), you do not need the WebView debugger.

- If the app has a debug override for its WebView base URL, point it at a local host the app's allowlists accept and serve a **stub parent page** at the route the app opens. The stub iframes the local build and passes `location.search` through. Write the override into the app's persisted storage while the app is terminated, then relaunch.
- Serve a **production build**, not the dev server, when the question involves lazy loading or build-time values; a dev server can fetch lazy chunks eagerly and carries no real version.
- The stub does not send the host page's handshake messages, so the app may treat the page as never-ready and reload it once. Expect a duplicate view and say so rather than reading it as a bug.
- Read the result from the server's access log (which chunks were fetched) and from the telemetry backend, not from a screenshot.
- Content inside a nested cross-origin iframe (a third-party widget) is invisible to the outer page's instrumentation: its taps produce no action events. State that limit rather than reporting missing data as a failure.
- Prepare the session, tap coordinates and inputs before opening the target screen. The first real interaction should land within a minute of the screen appearing; if it does not, the method needs optimising, not more retries.
