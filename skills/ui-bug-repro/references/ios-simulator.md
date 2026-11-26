# iOS Simulator automation

Read from `ui-bug-repro` before touching a simulator.

## The installed binary and the bundler

A debug build loads JS from the bundler's checkout, so a native dependency added after the binary was built red-boxes the bundle (`Unable to resolve module ...`). Compare the installed app's version and build date with the checkout before driving it. The fix is a dependency install, a native pod install and a rebuild; that touches the user's checkout, so ask first.

## iOS Simulator automation

- **Own one simulator, by UDID, before touching it.** Other sessions may be driving simulators on the same machine. `xcrun simctl … booted` resolves to any booted device, and the app's bundler address (`RCT_jsLocation`) is stored per device, so a second session can flip your device's settings, repoint its app at its own bundler, or have you screenshot and tap its app while you think it is yours. Claim a device for your worktree with the context file's claim script (or create a dedicated one), pass its UDID to every `simctl` call, and give it its own bundler, Appium and WebDriverAgent ports (`appium:wdaLocalPort`, `appium:mjpegServerPort`). If the app shows something unexpected, re-run the preflight before blaming your patch; release the device when done.
- **Tap through Appium, not the Simulator window.** `ax_click`-style element taps or `mobile: tap` at points (screenshot pixels / scale) go to one device. Window clicks land in whichever Simulator window is in front, and System Events `click at` is silently dropped by the Simulator anyway.
- Keystrokes via System Events work once a WebView input is focused by a click. Never send a string containing `d` to a React Native debug build: it opens the Dev Menu. Dismiss with key code 53; key code 36 is Return.
- `simctl openurl` triggers an "Open in <app>?" confirm. Return accepts it.
- `screencapture -R <rect>` fails without Screen Recording permission; `xcrun simctl io <udid> screenshot` works and captures only that device.
- **A hung `lsof` stalls Appium silently.** Session creation runs `lsof -ti tcp:8100` and WebView context discovery runs `lsof -aUc launchd_sim`; when `lsof` hangs system-wide the session sits at "Setting up simulator" and `contexts` never returns. Probe it with a background `lsof -nP -p $$` killed after a few seconds. Killing the hung `lsof` lets session creation continue, but context discovery still needs it, so switch to a path that needs no WebView inspection (next section). macOS has no `timeout` binary.
- In zsh, `$var` holding `"x y"` is not word-split, so a loop over coordinate pairs passes one argument. Pass coordinates as separate arguments.
