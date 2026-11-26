---
name: ui-bug-repro
description: "Reproduce a UI, layout, gesture, viewport, keyboard, WebKit or WebView-storage bug in a real environment before reasoning from source: local Chrome, the user's physical iPhone over Appium (Safari or the native app itself), the iOS Simulator, or the Android phone via the android-device-test skill. Use for any visual or interaction bug report, any iOS-only or Safari-only complaint, pinch zoom, blank screen, soft keyboard, scroll or iframe embed issue, any 'progress is lost when I close the app' report, to A/B a CSS fix on device, to verify a web build's telemetry or bridge behaviour inside an app WebView, and whenever a bug is being attributed to a specific app build or PR."
license: MIT
---

# Reproduce the UI bug first

Read `~/.claude/skill-context/ui-bug-repro.md` first if it exists. It holds this environment's local hosts, device, Appium scripts, app bundle ids, deep-link routes and accessibility locators, and wins over anything general here.

Also read `memory.md` from that directory if it exists: it says how this environment recalls and stores memories. With no memory store set up anywhere, skip the recall and store steps below and tell the user what was not stored.

Standing preference: reproduce, then reason. One bug could not be reproduced in desktop Chrome and static analysis produced a plausible unproven hypothesis. The iPhone crashed in two pinch cycles and an on-device A/B isolated one CSS line.

The simulator is not a device. In one investigation WebView localStorage survived force-quit across three simulator configurations. The same steps on the physical iPhone lost the data on the first try. For any "it works while the app is open, it is gone after I close it" report, **go to the device before reporting a negative**. A clean simulator result is evidence about the simulator only, and saying otherwise is the mistake to avoid.

## Recall

Recall from the memory store before anything else (how: `memory.md`): query `<component> <symptom>`, limit 10.

## Preflight: pass these gates before reproducing anything

Every wrong conclusion in that storage investigation came from skipping one of these, and each is one command. Run them first, not after a repro you are trying to explain.

**0. Check what is already running before starting anything.** Probe each piece once: the dev server (curl both `127.0.0.1:<port>` and `[::1]:<port>`, since a server bound to one address leaves a proxy dialling the other at 502), the JS bundler's status endpoint, `xcrun simctl list devices booted`, and the automation server's `/status`. Start only what is missing. On the simulator, run the context file's preflight script when it names one; it shows other sessions' devices and servers in one command.

**0b. On a debug build, does the installed app binary match the JS the bundler serves?** Compare the installed app's version and build date with the checkout before driving it; `references/ios-simulator.md` has the symptom and the fix, which needs the user's go.

**1. Is the suspect code even in the build?** A repro on a build that lacks the commit cannot be caused by it. Settle this before testing anything, with the build-provenance script the context file names if there is one. Containment drifts as branches merge, so check when the bug is reported. An entire simulator phase once tested a PR that was never in the beta.

**2. Assert the premise you are about to test, do not assume it.** Logged out is the usual one. Check it on the device through the UI (the context file gives the locator), or on the simulator by reading the app's persisted auth state. A whole matrix was once rerun because the app was signed in.

**3. Name what differs between your A/B cells before reading the result.** Auth state is rarely one variable: signing in can also swap where the app keeps progress, so a signed-in pass is not evidence about WebView storage. Cells must differ in one thing.

**4. Pick a signal tied to the thing under test.** A first-run modal reappearing looks like storage loss and is not; it returned in runs where progress was both kept and lost. Prefer an assertion over a screenshot: query the accessibility tree and diff the result. When pre-existing state would muddy the read, do not wipe the container, create one **new** marker and track only that.

## Choose the environment by bug type

| Bug type | Environment |
|---|---|
| Layout, DOM, click-through, desktop-only, a GIF for the PR | Local Chrome via `claude-in-chrome` at the local dev host |
| Console stacks, network headers and bodies, performance traces, Lighthouse, throttled or emulated devices, any page behind bot protection | A DevTools MCP attached to a Chrome the user launched by hand, if the context file names one. A Chrome an MCP launches sets `navigator.webdriver`, which bot protection can block. If it fails to connect, stop and say so rather than launching a browser. |
| Touch, gesture, pinch, visual viewport, memory pressure, WebKit | Physical iPhone via Appium (below) |
| WebView storage persistence across app kill (localStorage, saved progress, "lost when I close the app") | Physical iPhone against the **app bundle id**, not Safari. The simulator does not reproduce these. |
| Anything you suspect a specific app build or PR caused | Physical iPhone, and **verify the build's provenance first** |
| Android layout, keyboard, WebView viewport | `android-device-test` skill (CDP) |
| IME composition: underlines, autocorrect, suggestion strip | **No automation reproduces it.** Every path injects text and never opens a composition. Needs a human with the phone and a screenshot before the word commits. Ask which KEYBOARD they use. |

Say early when a bug is iOS-only and ask the user to start Appium rather than forcing it in Chrome.

## Where each environment's detail lives

- Physical iPhone, Safari or a native app by bundle id: `references/iphone-appium.md`. Start Appium from a real Terminal, never through Claude Code.
- iOS Simulator: `references/ios-simulator.md`. Own one simulator by UDID before touching it; never act on `booted`.
- A web build's telemetry, bridge or postMessage inside an app WebView: `references/app-webview-verify.md`.
- A local dev server returning 502, a custom hostname, or a page embedded in an iframe or WebView: `references/local-dev-and-iframes.md`.

## Naming a cause

A reproduction proves a bug exists, not that a commit caused it.

Run the full matrix before naming anything: suspect build x control build x logged out x signed in. A two-cell result invites a hypothesis the third cell kills. **Sign out in both cells when the subject is storage**, or a backend may answer for the app and the comparison is void.

Before naming a line of code as the cause, confirm it is absent from the control build. A line present in both cannot explain a difference between them; that one check has retired a confident wrong answer.

## Deliver

Confirmed root cause with the A/B evidence, then the fix via `ship-pr` with a GIF or the no-GIF line. Store the repro recipe and root cause as a `fix` titled `<ticket> root cause: <one line>`, content `<repro, A/B, fix>`, tags `<component>,<ticket>,ios,ui-testing`.
