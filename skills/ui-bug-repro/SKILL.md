---
name: ui-bug-repro
description: "Reproduce a UI, layout, gesture, viewport, keyboard, WebKit or WebView-storage bug in a real environment before reasoning from source: local Chrome, the user's physical iPhone over Appium (Safari or the native app itself), the iOS Simulator, or the Android phone via the android-device-test skill. Use for any visual or interaction bug report, any iOS-only or Safari-only complaint, pinch zoom, blank screen, soft keyboard, scroll or iframe embed issue, any 'progress is lost when I close the app' report, to A/B a CSS fix on device, and whenever a bug is being attributed to a specific app build or PR."
license: MIT
---

# Reproduce the UI bug first

Read `~/.claude/skill-context/ui-bug-repro.md` first if it exists. It holds this environment's local hosts, device, Appium scripts, app bundle ids, deep-link routes and accessibility locators, and wins over anything general here.

Also read `memory.md` from that directory if it exists: it says how this environment recalls and stores memories. With no memory store set up anywhere, skip the recall and store steps below and tell the user what was not stored.

Standing preference: reproduce, then reason. One bug could not be reproduced in desktop Chrome and static analysis produced a plausible unproven hypothesis. The iPhone crashed in two pinch cycles and an on-device A/B isolated one CSS line.

The simulator is not a device. In one investigation WebView localStorage survived force-quit across three simulator configurations, including a brand-new container and an instant-kill stress test. The same steps on the physical iPhone lost the data on the first try. For any "it works while the app is open, it is gone after I close it" report, **go to the device before reporting a negative**. A clean simulator result is evidence about the simulator only, and saying otherwise is the mistake to avoid.

## Recall

Recall from the memory store before anything else (how: `memory.md`): query `<component> <symptom>`, limit 10.

## Preflight: pass these gates before reproducing anything

Every wrong conclusion in that storage investigation came from skipping one of these, and each is one command. Run them first, not after a repro you are trying to explain.

**1. Is the suspect code even in the build?** A repro on a build that lacks the commit cannot be caused by it. Settle this before testing anything, with the build-provenance script the context file names if there is one. Containment drifts as branches merge, so check when the bug is reported. An entire simulator phase once tested a PR that was never in the beta.

**2. Assert the premise you are about to test, do not assume it.** Logged out is the usual one. Check it on the device through the UI (the context file gives the locator), or on the simulator by reading the app's persisted auth state. A whole matrix was once rerun because the app was signed in.

**3. Name what differs between your A/B cells before reading the result.** Auth state is rarely one variable: signing in can also swap where the app keeps progress, so a signed-in pass is not evidence about WebView storage. Cells must differ in one thing.

**4. Pick a signal tied to the thing under test.** A first-run modal reappearing looks like storage loss and is not; it returned in runs where progress was both kept and lost. Prefer an assertion over a screenshot: query the accessibility tree and diff the result. When pre-existing state would muddy the read, do not wipe the container, create one **new** marker and track only that.

## Choose the environment by bug type

| Bug type | Environment |
|---|---|
| Layout, DOM, console, network, desktop-only | Local Chrome via `claude-in-chrome` at the local dev host |
| Touch, gesture, pinch, visual viewport, memory pressure, WebKit | Physical iPhone via Appium (below) |
| WebView storage persistence across app kill (localStorage, saved progress, "lost when I close the app") | Physical iPhone against the **app bundle id**, not Safari. The simulator does not reproduce these. |
| Anything you suspect a specific app build or PR caused | Physical iPhone, and **verify the build's provenance first** |
| Android layout, keyboard, WebView viewport | `android-device-test` skill (CDP) |
| IME composition: underlines, autocorrect, suggestion strip | **No automation reproduces it.** Every path injects text and never opens a composition. Needs a human with the phone and a screenshot before the word commits. Ask which KEYBOARD they use. |

Say early when a bug is iOS-only and ask the user to start Appium rather than forcing it in Chrome.

## Local dev server traps

- Vite bound to `[::1]` only makes a reverse proxy dialling `127.0.0.1` return 502 while `localhost:<port>` works. Point the proxy at `localhost:<port>`; it is a local-only fix, so do not change `vite.config.ts`.
- Vite 8 needs `server.allowedHosts` in `vite.config.ts` for a custom local hostname; there is no CLI flag. Do not pipe `npm run dev` to `head`; SIGPIPE kills it.

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

## iOS Simulator automation

- **System Events `click at` is silently dropped by the Simulator** even with Accessibility granted: it reports success and nothing happens. Post CGEvents to `.cghidEventTap` instead (the context file names the helper if one exists). Do not rebuild it by hand each time.
- The mapping a click helper needs: the first `group` UI element of the Simulator window has position and size equal to the device screen in points, so `screen = group_origin + screenshot_px / scale`. Re-read the origin on every call; the user may move windows mid-run and a cached origin silently invalidates the session.
- Keystrokes via System Events work once a WebView input is focused by a click. Never send a string containing `d` to a React Native debug build: it opens the Dev Menu. Dismiss with key code 53; key code 36 is Return.
- `simctl openurl` triggers an "Open in <app>?" confirm. Return accepts it.
- `screencapture -R <rect>` fails without Screen Recording permission; `screencapture -x -D 1` and `xcrun simctl io booted screenshot` both work.

## Naming a cause

A reproduction proves a bug exists, not that a commit caused it. The preflight gates cover the premises; this is the shape of the evidence.

Run the full matrix before naming anything: suspect build x control build x logged out x signed in. A two-cell result invites a hypothesis the third cell kills. **Sign out in both cells when the subject is storage**, or a backend may answer for the app and the comparison is void.

Before naming a line of code as the cause, confirm it is absent from the control build. A line present in both cannot explain a difference between them; that one check has retired a confident wrong answer.

## Embedded-iframe gotchas

- `scrollIntoView` inside an iframe scrolls the HOST page and yanks the reader's position. Set the nearest scroller's `scrollTop` directly and gate on the element actually being clipped.
- Android WebView with `adjustResize` behaves like `interactive-widget=resizes-content`; Chrome defaults to `resizes-visual`. Test both; a fix must stay inert under `resizes-visual`.

## Deliver

Confirmed root cause with the A/B evidence, then the fix via `ship-pr` with a GIF or the no-GIF line. Store the repro recipe and root cause as a `fix` titled `<ticket> root cause: <one line>`, content `<repro, A/B, fix>`, tags `<component>,<ticket>,ios,ui-testing`.
