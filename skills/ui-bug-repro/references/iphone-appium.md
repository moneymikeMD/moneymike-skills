# Physical iPhone via Appium

Read from `ui-bug-repro` before driving the iPhone, in Safari or in a native app.

## iPhone via Appium

**Start Appium from a real Terminal**, never through Claude Code or the `!` prefix; the sandbox breaks the CoreDevice install. Ask the user to run the start script. Then:

```bash
curl -s -X POST http://127.0.0.1:4723/session -H 'Content-Type: application/json' -d @caps.json
```

Set `appium:newCommandTimeout` 0 or sessions die after 60s idle.

Gestures: `mobile: pinch` zooms in but pinch-out is swallowed by Safari's tab gesture; element-scoped pinch does nothing. Use W3C `/actions` with two touch pointers confined to the content area (on a 390x844 screen, x=195 and y 150-700): spread zooms in, converge zooms out. Converging at scale 1.0 opens the tab switcher; tap a card to recover.

The webview JS channel wedges after gestures (execute hangs while the log fills with "no such alert"). The page is not hung. Use native screenshots as truth and minimise context switches. Screenshot byte size is a state signature on a given device and page (on one: 415-570KB healthy page, ~1009KB tab overview, ~312KB blank page, ~356KB crash page). Dismiss any ad interstitial and verify the starting frame before trusting a run.

A/B sentinel: when injecting a CSS override, also inject a fixed coloured square in the top document. If Safari reloads after a crash the square disappears, proving whether the override was live for the whole run.

Errors: `XCTDaemonErrorDomain Code=41 Not authorized` is a stale WDA runner, not permissions; `pkill -f 'xcodebuild.*[W]ebDriverAgent'` then new session. A mid-session SIGTERM is usually another session's stop script against the shared port; rerun the start script, which should reuse the live tunnel. Write pkill patterns as `tunnel[-]creation` so they cannot self-match.

## Driving a native app on device (not Safari)

Use a capabilities file that targets the app's bundle id and carries `appium:noReset`, so a session does not wipe the container. If a TestFlight beta and the App Store build can both be installed, they keep separate containers, so the beta is a free control against production on the same handset, same day, same content.

```bash
xcrun devicectl device info apps --device <udid> --include-all-apps | grep -i <app>
```

`--include-all-apps` is required; without it App Store and TestFlight apps are invisible and you will wrongly conclude the build is not installed.

Navigate by deep link rather than tapping through; it is faster and does not depend on layout. `mobile: deepLink` with a `bundleId` goes straight in with **no** "Open in?" confirm (unlike `simctl openurl`):

```
mobile: deepLink       {"url":"<scheme>://<route>","bundleId":"..."}
mobile: terminateApp   {"bundleId":"..."}   # real force quit, same as an app-switcher swipe
mobile: activateApp    {"bundleId":"..."}
mobile: queryAppState  {"bundleId":"..."}   # 1 = not running, 4 = foreground
```

Assert `queryAppState` returns `1` after terminating. Do not assume the kill landed.

Tap via W3C `/actions` in **logical** points, not screenshot pixels; screenshots come back at device pixels, so divide by the scale. Prefer `POST /session/:id/element` with `accessibility id` for tab-bar items; coordinate taps on the tab bar are unreliable while a screen is still settling.

### Locators

Use `accessibility id` when the app ships testIDs, and **never write XPath**: it breaks on every layout change. Fall back to `-ios predicate string` only for pattern matches.

```bash
curl -s -X POST http://127.0.0.1:4723/session/$SID/element \
  -H 'Content-Type: application/json' -d '{"using":"accessibility id","value":"<id>"}'
# then POST .../element/$EL/click  or  .../element/$EL/value  {"text":"..."}
```

Type into a WebView text field with one `setValue` call rather than tapping keys one at a time; it reaches the HTML input through the accessibility bridge and is far faster.

**Assert progress from the tree, not from a screenshot.** Capture the set of matching elements before a force quit and compare after. It is exact, unlike eyeballing a crop.

**Two traps in the tree.**

- There is **no `WEBVIEW_` context** on a TestFlight or release build; `contexts` returns `['NATIVE_APP']` only, because `WKWebView.isInspectable` is off. No CSS selectors, no JS, no reading localStorage directly. The accessibility tree is the only way in.
- A consent CMP may render in an **offscreen** WebView whose text is in the tree while invisible on screen. Filter it out, and never match on generic text alone or you will click something the user cannot see and silently change their consent settings.
