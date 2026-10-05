---
name: ui-bug-repro
description: "Reproduce a UI, layout, gesture, viewport, keyboard, WebKit or WebView-storage bug in a real environment before reasoning from source: local Chrome via the Caddy host, Mike's physical iPhone over Appium (Safari or the Atlantic app itself), the iOS Simulator, or the Android phone via the android-device-test skill. Use for any visual or interaction bug report, any iOS-only or Safari-only complaint, pinch zoom, blank screen, soft keyboard, scroll or iframe embed issue in the games or frontend, any 'progress is lost when I close the app' report, to A/B a CSS fix on device, and whenever a bug is being attributed to a specific app build or PR."
license: MIT
---

# Reproduce the UI bug first

Standing preference: reproduce, then reason. INTER-1747 could not be reproduced in
desktop Chrome and static analysis produced a plausible unproven hypothesis. The iPhone
crashed in two pinch cycles and an on-device A/B isolated one CSS line.

The simulator is not a device. INTER-1816: WebView localStorage survived force-quit across
three simulator configurations, including a brand-new container and an instant-kill stress
test. The same steps on the physical iPhone lost the data on the first try. For any
"it works while the app is open, it is gone after I close it" report, **go to the device
before reporting a negative**. A clean simulator result is evidence about the simulator
only, and saying otherwise is the mistake to avoid.

## Recall

```bash
memorygraph recall --query "<game or component> <symptom>" --limit 10
```

## Preflight: pass these gates before reproducing anything

Every wrong conclusion in INTER-1816 came from skipping one of these, and each is one
command. Run them first, not after a repro you are trying to explain.

**1. Is the suspect code even in the build?** A repro on a build that lacks the commit
cannot be caused by it. Settle this before testing anything:

```bash
~/code/project_tools/device_automation/which-build.sh -s <suspect-sha>     # reads the device
~/code/project_tools/device_automation/which-build.sh -v 8.0.0 -s <sha>    # or a reported version
```

It prints `CONTAINS` / `ABSENT` per branch carrying that version. Containment drifts as
branches merge, so run it when the bug is reported. In INTER-1816 an entire simulator
phase tested a PR that was never in the beta.

**2. Assert the premise you are about to test, do not assume it.** Logged out is the usual
one. On device open `settings-button` and look for `settings-sign-in-button`; on the
simulator read the `persist:auth` file, named `md5("persist:auth")` inside
`RCTAsyncLocalStorage_V1/`. A whole matrix was rerun because the app was signed in.

**3. Name what differs between your A/B cells before reading the result.** Auth state is
never one variable in this app: signing in also swaps game progress to the `games-data`
backend, so a signed-in pass is not evidence about WebView storage. Cells must differ in
one thing.

**4. Pick a signal tied to the thing under test.** A first-run modal reappearing looks like
storage loss and is not; it returned in runs where progress was both kept and lost. Prefer
an assertion over a screenshot: query the accessibility tree and diff the result. When
pre-existing state would muddy the read, do not wipe the container, solve one **new**
marker and track only that.

Background for all four (build-to-branch mapping, the separate TestFlight ASC app, the
signing block, the two storage backends) is in
`~/code/research/theatlantic-app-best-practices.md`.

## Choose the environment by bug type

| Bug type | Environment |
|---|---|
| Layout, DOM, console, network, desktop-only | Local Chrome via `claude-in-chrome` at `https://www.local.theatlantic.com/` or `https://<game>-local.theatlantic.com` |
| Touch, gesture, pinch, visual viewport, memory pressure, WebKit | Physical iPhone via Appium (below) |
| WebView storage persistence across app kill (localStorage, game progress, "lost when I close the app") | Physical iPhone against the **app bundle id**, not Safari. The simulator does not reproduce these. |
| Anything you suspect a specific app build or PR caused | Physical iPhone, and **verify the build's provenance first** (below) |
| Android layout, keyboard, WebView viewport | `android-device-test` skill (CDP) |
| IME composition: underlines, autocorrect, suggestion strip | **No automation reproduces it.** Every path injects text and never opens a composition. Needs a human with the phone and a screenshot before the word commits. Ask which KEYBOARD they use. |

Say early when a bug is iOS-only and ask Mike to start Appium rather than forcing it in
Chrome.

## Local Chrome facts

- `frontend` proxies `/games-embed/*` to production, so games on local are production
  code in an iframe, cross-origin from `local.theatlantic.com` but same-origin on
  `www.theatlantic.com`.
- Caddy 502 with vite working on `localhost:3003`: vite bound `[::1]` only. The
  Caddyfile must dial `localhost:3003`, not `127.0.0.1`. Local-only fix; do not change
  `vite.config.ts`.
- Vite 8 needs `server.allowedHosts` in `vite.config.ts` for the `-local` host; there is
  no CLI flag. Do not pipe `npm run dev` to `head`; SIGPIPE kills it.

## iPhone via Appium

Mike-phone: iPhone17,5, iOS 26.5.2, dpr 3, 390x844 logical.
Scripts: `~/code/project_tools/device_automation/ios/{start.sh,stop.sh,caps.json}`.

**Mike must run `start.sh` from a real Terminal**, never through Claude Code or the `!`
prefix; the sandbox breaks the CoreDevice install. Ask him to start it. Then:

```bash
curl -s -X POST http://127.0.0.1:4723/session -H 'Content-Type: application/json' -d @caps.json
```

Set `appium:newCommandTimeout` 0 or sessions die after 60s idle.

Gestures: `mobile: pinch` zooms in but pinch-out is swallowed by Safari's tab gesture;
element-scoped pinch does nothing. Use W3C `/actions` with two touch pointers confined to
the content area (x=195, y 150-700): spread zooms in, converge zooms out. Converging at
scale 1.0 opens the tab switcher; tap the card at about (289,605) to recover.

The webview JS channel wedges after gestures (execute hangs while the log fills with
"no such alert"). The page is not hung. Use native screenshots as truth and minimise
context switches. Screenshot byte size is a state signature: 415-570KB healthy game,
~1009KB tab overview, ~312KB blank page, ~356KB crash page. Dismiss the ad interstitial
and verify the starting frame before trusting a run.

A/B sentinel: when injecting a CSS override, also inject a fixed coloured square in the
top document. If Safari reloads after a crash the square disappears, proving whether the
override was live for the whole run.

Errors: `XCTDaemonErrorDomain Code=41 Not authorized` is a stale WDA runner, not
permissions; `pkill -f 'xcodebuild.*[W]ebDriverAgent'` then new session. A mid-session
SIGTERM is usually another session's `stop.sh` against the shared port; rerun
`start.sh`, it reuses the live tunnel. `stop.sh [--keep-tunnel] [SESSION_ID]` for
teardown; write pkill patterns as `tunnel[-]creation` so they cannot self-match.

## Driving the Atlantic app on device (not Safari)

`caps.json` targets `com.apple.mobilesafari`. Use `caps-app.json` beside it for the app; it
already carries `appium:noReset` so a session does not wipe the container. It defaults to
the alpha bundle, so swap one field to drive production:

| Build | Bundle id | URL scheme |
|---|---|---|
| TestFlight beta / alpha | `com.rarewire.TheAtlanticNewstand.alpha` | `theatlantic-alpha://` |
| App Store production | `com.rarewire.TheAtlanticNewstand` | `theatlantic://` |

Both can be installed at once and keep separate containers, so the beta is a free control
against production on the same handset, same day, same content.

```bash
xcrun devicectl device info apps --device <udid> --include-all-apps | grep -i atlantic
```

`--include-all-apps` is required; without it App Store and TestFlight apps are invisible
and you will wrongly conclude the build is not installed.

Navigate by deep link rather than tapping through; it is faster and does not depend on
layout. `mobile: deepLink` with a `bundleId` goes straight in with **no** "Open in?"
confirm (unlike `simctl openurl`):

```
mobile: deepLink       {"url":"theatlantic-alpha://games/bracket-city","bundleId":"..."}
mobile: terminateApp   {"bundleId":"..."}   # real force quit, same as an app-switcher swipe
mobile: activateApp    {"bundleId":"..."}
mobile: queryAppState  {"bundleId":"..."}   # 1 = not running, 4 = foreground
```

Assert `queryAppState` returns `1` after terminating. Do not assume the kill landed.

Routes come from `src/navigation/deep-linking.ts`: `/games/:slug`, `/games/:slug/archive`,
`/latest`, `/audio`, `/login`, and articles at `:section/:yyyy/:mm/:slug/:id`.

Tap via W3C `/actions` in **logical** points (390x844), not screenshot pixels; screenshots
come back at 1170x2532, so divide by 3. Prefer `POST /session/:id/element` with
`accessibility id` for tab-bar items ("Games"); coordinate taps on the tab bar are
unreliable while a screen is still settling.

## Atlantic app locators (verified 2026-09-17)

Use `accessibility id`. The app ships real testIDs, so **never write XPath** — it breaks on
every layout change and the redesign already moved everything. Fall back to
`-ios predicate string` only for pattern matches.

```bash
curl -s -X POST http://127.0.0.1:4723/session/$SID/element \
  -H 'Content-Type: application/json' -d '{"using":"accessibility id","value":"settings-button"}'
# then POST .../element/$EL/click  or  .../element/$EL/value  {"text":"..."}
```

**Chrome and tabs.** Identical in 7.8.8 and 8.0.0, so these survive the redesign:

| Element | accessibility id | Note |
|---|---|---|
| Settings / face icon | `settings-button` | top right, both builds |
| Search icon | `search-button` | 8.0.0 only |
| Tab bar items | `Home`, `Latest`, `Audio`, `Games`, `Search` | `XCUIElementTypeOther`, name == label. `Search` is prod-only |
| Today feed | `today-list`, `today-story-<n>` | |
| Article actions | `article-actions-button`, `article-audio-play-pause-button` | |

Tab-bar coordinate taps are unreliable while a screen is still settling; use the id.

**Is the user signed in?** Open `settings-button`, then test one locator. Do not infer it
from the avatar glyph.

| State | Present | Absent |
|---|---|---|
| Signed out | `settings-sign-in-button`, `settings-create-account-button`, `subscribe-button` | `sign-out-button` |
| Signed in | `sign-out-button`, `manage-subscription-button`, `delete-account-button`, StaticText of the user's name | `settings-sign-in-button` |

`settings-sign-in-button` presence is the single cleanest check. To drive a real logout
(which runs `logout()` and its cookie clearing), click `sign-out-button`.

Other settings rows: `saved-stories-button`, `audio-queue-button`, `restore-purchase-button`,
`settings-text-style-button`, `settings-story-notifications-button`, `settings-faq-button`,
`settings-privacy-settings-button`, `settings-do-not-sell-button` (a `Link`),
`settings-contact-support-button`, `settings-about-button`,
`settings-replay-walkthrough-button`.

**Bracket City.** Deep link `…://games/bracket-city`, then:

| Element | accessibility id |
|---|---|
| WebView container | `game-webview` |
| Welcome modal dismiss | `Close` |
| Answer input | `Answer` (`XCUIElementTypeTextField`) |
| Submit | `ENTER` |
| Letter keys | `A`–`Z`, one Button each |
| Editing keys | `Backspace`, `Symbols` |
| Header | `Open calendar`, `Open game settings`, `Open games menu` |
| Back | `Go back to Games` |

Play a clue in two calls — do **not** tap letters one at a time:

```
POST .../element/<Answer>/value   {"text":"hour"}
POST .../element/<ENTER>/click    {}
```

`setValue` reaches the HTML input through the accessibility bridge and is far faster than
tapping keys. The field resets to its `type any answer...` placeholder on submit.

**Assert progress from the tree, not from a screenshot.** Unsolved clues are Buttons named
`clue: <text>`; solving one turns it into StaticText and reveals its parent clue. So:

```bash
curl -s -X POST http://127.0.0.1:4723/session/$SID/elements -H 'Content-Type: application/json' \
  -d '{"using":"-ios predicate string","value":"type == '\''XCUIElementTypeButton'\'' AND name BEGINSWITH '\''clue:'\''"}'
```

Capture that set before a force quit and compare after. It is exact, unlike eyeballing a
crop. A correct answer visibly rewrites the parent: `clue: short hand?` became
`clue: one might be of the hour ⏳️ or the cloth ✝️`.

**Two traps in the tree.**

- There is **no `WEBVIEW_` context** on a TestFlight or release build; `contexts` returns
  `['NATIVE_APP']` only, because `WKWebView.isInspectable` is off. No CSS selectors, no JS,
  no reading localStorage directly. The accessibility tree is the only way in.
- The consent CMP renders in an **offscreen** WebView whose text is in the tree while
  invisible on screen ("My data preferences", "Allow the sale or sharing of my data",
  "Save and close"). Filter it out, and never match on generic text alone or you will click
  something the user cannot see and silently change their consent settings.

## iOS Simulator automation

- Tap with `~/code/project_tools/device_automation/ios/simtap.sh <px> <py> [scale]`, where
  `px,py` are `xcrun simctl io booted screenshot` pixels. It resolves the window origin and
  clicks; `simclick <x> <y>` beside it takes global screen points directly.
- **System Events `click at` is silently dropped by the Simulator** even with Accessibility
  granted: it reports success and nothing happens. That is why `simclick` exists — it posts
  CGEvents to `.cghidEventTap` instead. Do not rebuild this by hand.
- The mapping `simtap.sh` applies: the first `group` UI element of the Simulator window has
  position and size equal to the device screen in points, so
  `screen = group_origin + screenshot_px / scale`. It re-reads the origin every call on
  purpose; Mike moves windows mid-run and a cached origin silently invalidates the session.
- Keystrokes via System Events work once a WebView input is focused by a click. Never send
  a string containing `d` to a debug build — it opens the React Native Dev Menu. Dismiss
  with key code 53; key code 36 is Return.
- `simctl openurl` triggers an "Open in <app>?" confirm. Return accepts it.
- `screencapture -R <rect>` fails without Screen Recording permission; `screencapture -x -D 1`
  and `xcrun simctl io booted screenshot` both work.

## Naming a cause

A reproduction proves a bug exists, not that a commit caused it. The preflight gates cover
the premises; this is the shape of the evidence.

Run the full matrix before naming anything: suspect build x control build x logged out x
signed in. A two-cell result invites a hypothesis the third cell kills, which is what
happened in INTER-1816. **Sign out in both cells when the subject is storage**, or the
`games-data` backend answers for the app and the comparison is void.

Before naming a line of code as the cause, confirm it is absent from the control build. A
line present in both cannot explain a difference between them; that check retired a
confident wrong answer in INTER-1816 in one command.

## Embedded-game gotchas

- `scrollIntoView` inside an iframe scrolls the HOST page and yanks the reader's article
  position. Set the nearest scroller's `scrollTop` directly and gate on the element
  actually being clipped.
- Android WebView uses `interactive-widget=resizes-content`; Chrome defaults to
  `resizes-visual`. Test both; a fix must stay inert under `resizes-visual`.

## Deliver

Confirmed root cause with the A/B evidence, then the fix via `ship-pr` with a GIF or the
no-GIF line. Store the repro recipe and root cause:

```bash
memorygraph store --type fix --title "<ticket> root cause: <one line>" --content "<repro, A/B, fix>" --tags "<game>,<ticket>,ios,ui-testing"
```
