---
name: android-device-test
description: "Reproduce and A/B a web UI bug on the user's physical Android phone over adb + Chrome DevTools Protocol, including simulating a native app WebView's keyboard behaviour. Use when asked to 'test this on my Android device', reproduce an Android-only layout/keyboard/viewport bug, or confirm a fix on real hardware."
license: MIT
---

# Test this on my Android device

Read `~/.claude/skill-context/android-device-test.md` first if it exists. It holds this machine's device, Appium paths, the native app being simulated and the host site, and wins over anything general here.

Also read `memory.md` from that directory if it exists: it says how this environment recalls and stores memories. With no memory store set up anywhere, skip the recall and store steps below and tell the user what was not stored.

The user keeps a physical Android phone plugged in. **Reproduce on it rather than reasoning from source** — that is a standing preference, not a nicety. A verified before/after on hardware beats any amount of CSS reading.

## Before anything else: recall

Recall from the memory store before anything else (how: `memory.md`): query `android device <topic>`, limit 10.

Prior sessions hold device specs, setup traps, and gesture recipes. Read them before you start; store what you learn when you finish (see Memory at the bottom).

## Pick the right tool

| Situation | Tool |
|---|---|
| Layout, viewport, keyboard, scrolling, JS state, screenshots, A/B of CSS | **CDP** (this skill's `scripts/cdp.mjs`) — fastest, no server to boot |
| Native gestures (pinch zoom), driving the OS outside the page | **Appium**, with the start script and port from the context file |
| IME bugs: composing underlines, autocorrect mutating input, suggestion strips | **Neither.** Structurally unreproducible — every automation path injects text and never opens a composition. Hand the phone to a human and ask which *keyboard* they use (SwiftKey vs Gboard vs Samsung); that matters more than the browser. |

Default to CDP. Reach for Appium only when the page alone cannot express the interaction.

## The device

The context file gives the model, serial, devicePixelRatio and CSS viewport. If it does not, read them off the device (`adb shell getprop ro.product.model`, then `./cdp.mjs eval` for `innerWidth`, `innerHeight` and `devicePixelRatio`) and record them there.

CDP coordinates are **CSS pixels**. Appium W3C actions are **device pixels**. Do not mix them up.

## Setup

```bash
adb devices                                    # expect: <serial>  device
adb reverse tcp:3003 tcp:3003                  # phone reaches your dev server on localhost
adb shell am start -a android.intent.action.VIEW -d "http://localhost:3003/" com.android.chrome
adb forward tcp:9333 localabstract:chrome_devtools_remote
```

Then drive it. `--match` picks the page by URL substring; `CDP_MATCH` sets it for a whole session.

```bash
cd <this skill's base directory>/scripts
export CDP_MATCH=localhost:3003

./cdp.mjs targets                              # list debuggable pages
./cdp.mjs eval 'return {w: innerWidth, h: innerHeight, dpr: devicePixelRatio};'
./cdp.mjs tap 216 404                          # real touch — opens the real soft keyboard
./cdp.mjs shot before.png
./cdp.mjs nav "http://localhost:3003/?text-scale=1.2"
```

`cdp.mjs` needs no `npm install` — it uses Node's global `WebSocket` (Node >= 21), so it runs from any cwd.

## Simulating a native app's WebView

**This is the part that makes Android-only keyboard bugs reproducible.** A release build's WebView is usually not debuggable (no `chrome_devtools_remote` socket for the app's package), so use Chrome — but Chrome alone will *not* reproduce keyboard bugs, and that difference is easy to mistake for "cannot reproduce".

- **Chrome on Android** defaults to `interactive-widget=resizes-visual`: the keyboard shrinks only the *visual* viewport and Chrome pans it. `100svh`, flex layout, and media queries never see a change.
- **An app WebView** with `adjustResize` (check the context file for the app being simulated) behaves like to `interactive-widget=resizes-content`: the *layout* viewport shrinks, so `100svh` shrinks and the whole page re-lays out.

Switch Chrome into the app's mode before testing anything keyboard-related:

```bash
./cdp.mjs widget resizes-content     # emulate the app's WebView
./cdp.mjs widget resizes-visual      # back to Chrome/mobile-web default
```

Always test **both**. A fix that helps under `resizes-content` must stay inert under `resizes-visual`, or you have shipped a mobile-web regression to fix an in-app bug.

## A/B a CSS change without touching the repo

Inject an override stylesheet to restore the *previous* rules, measure, remove it, measure again. Same page, same session, same keyboard — the only variable is the CSS.

```bash
./cdp.mjs eval '
  document.getElementById("__ab")?.remove();
  const s = document.createElement("style");
  s.id = "__ab";
  s.textContent = ".someClass { overflow: visible !important; flex: 1 1 0% !important; }";
  document.head.appendChild(s);
  return "pre-change styles applied";
'
```

For a fix already written into the working tree, just let Vite HMR reload and re-run the same measurement — the numbers are directly comparable.

Measure hard numbers, not vibes. For a keyboard/clipping bug the useful ones are: `innerHeight`, the element's `getBoundingClientRect()`, its scroll container's rect, `scrollTop` / `scrollHeight` / `clientHeight`, how far the element is clipped by its container, and the gap between the element and the viewport bottom.

## Check the iframe embed too

If the page is embedded in a host site by iframe, a scroll fix that behaves in the standalone page can still wreck the host article. Stand up a throwaway host to check:

```html
<!-- /tmp/iframe-host.html, served next to the page under test -->
<div style="height:1200px">above</div>
<iframe id="f" src="/inner.html" style="width:100%;height:400px;border:0"></iframe>
<div style="height:1200px">below</div>
```

Scroll the parent, run the behaviour inside the frame, and assert the parent's `scrollY` did not move. Measured on 2026-09-01: `input.scrollIntoView({block:"center"})` inside a frame moved the parent **104px**, because it walks *every* ancestor scroller including the host document. `scroller.scrollTop += delta` moved it **0px** and centred the element just as precisely. Prefer scrolling the nearest scroller explicitly.

## Pitfalls

**From this toolchain:**
- **Touch events only reach the foreground tab.** Opening any other URL on the phone backgrounds the tab under test, and `Input.dispatchTouchEvent` then hangs unacked until it times out. `tap` raises the tab first; call `./cdp.mjs front` yourself before any hand-rolled input.
- **Anything you inject at runtime dies on reload.** Editing source triggers Vite HMR, which resets the viewport-meta override and any A/B stylesheet. Re-run `./cdp.mjs widget resizes-content` after every code change or you will silently measure the wrong mode.
- Never use a foreground `sleep` between calls — this harness blocks it and the command hangs. `tap` settles for 4s on its own; otherwise put the wait inside the JS you evaluate.
- Long JS through the shell is quoting hell. Put it in a file and use `./cdp.mjs eval-file measure.js`.
- `Runtime.evaluate` shares one global scope, so a bare `const q = ...` collides on the next call with `Identifier 'q' has already been declared`. `cdp.mjs` wraps every snippet in an async IIFE, so this is handled — but if you hand-roll a CDP call, wrap it yourself.
- Games and apps persist progress. After a reload the app may skip its start screen, so **poll for the element you need** instead of assuming a fixed click path, and never early-`return` out of a setup block when the element is already present — you will silently skip your own style injection and A/B two identical states.
- A screenshot spans the full layout viewport; under `resizes-content` the keyboard area renders blank/white. That is expected, not a broken capture.
- Leave 3-4s after a tap before measuring: the keyboard animates, and `visualViewport` resize fires several times on the way up.

**From earlier sessions:**
- `adb devices` showing `unauthorized` means the RSA prompt is unanswered. Only the user can tap "Allow" / "Always allow from this computer" on the phone — there is nothing to debug on the host.
- Appium only: run it under the Node version the context file names. An old Node makes Appium die with a misleading `lru-cache` stack trace.
- Appium only: the insecure feature flag must be namespaced — `--allow-insecure="uiautomator2:chromedriver_autodownload"`.
- Appium only: `appium driver doctor uiautomator2` reporting a missing `emulator` binary is a false alarm for real-device work; a full Android SDK is not needed.
- Appium contexts here are `NATIVE_APP` and `CHROMIUM` — not the `WEBVIEW_*` names iOS uses.

## Teardown

```bash
adb reverse --remove tcp:3003
adb forward --remove tcp:9333
# Appium only: DELETE the session, then pkill -f 'appium server --port <port>'
```

Leave the repo clean. Viewport-meta and injected-stylesheet changes are runtime-only and vanish on reload — confirm with `git status` that nothing leaked into the working tree.

## Report

Give a table of the measured numbers before and after, state which viewport mode each row was taken under, and say plainly what did **not** reproduce. "I could not reproduce symptom X, here is what I measured instead" is a real result and stops the next session from re-running the same dead end.

## Memory

Store what a future session would otherwise rediscover:

Store a `solution` titled `<what was confirmed on device>`, content `<A/B numbers, viewport mode, device, verdict>`, tags `android,device-testing,<repo>,<ticket>`. Store setup traps as `error`, reusable recipes as `code_pattern`.
