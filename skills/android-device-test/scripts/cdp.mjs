#!/usr/bin/env node
// Minimal Chrome DevTools Protocol client for a phone attached over adb.
// Uses Node's global WebSocket (Node >= 21), so it needs no npm install and
// can run from any cwd regardless of the project's node_modules.
import { readFileSync, writeFileSync } from "node:fs";

const PORT = process.env.CDP_PORT || "9333";
const args = process.argv.slice(2);

function usage() {
  console.error(`Usage: cdp.mjs [--match <url-substring>] <command> [args]

  targets                 List debuggable pages on the device
  eval <js>               Evaluate JS, print the JSON result
  eval-file <path>        Same, reading JS from a file (avoids shell quoting)
  tap <x> <y> [settleMs]  Real touch tap at CSS-pixel coords (settles 4000ms)
  front                   Raise the matched tab to the foreground
  shot <path.png>         Screenshot to a file
  nav <url>               Navigate and wait for load
  widget <mode>           Set viewport interactive-widget (resizes-content|resizes-visual)

Env: CDP_PORT (9333), CDP_MATCH (url-substring match), CDP_TIMEOUT_MS (15000)

JS is wrapped in an async IIFE, so top-level await works and consts do not
leak between calls. Return a value; objects are serialised by value.`);
  process.exit(1);
}

let match = process.env.CDP_MATCH || "";
while (args[0] === "--match") {
  args.shift();
  match = args.shift() ?? "";
}
const [command, ...rest] = args;
if (!command) usage();

const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
const pages = targets.filter((t) => t.type === "page");

if (command === "targets") {
  for (const t of pages) console.log(`${t.id}\t${t.url}`);
  process.exit(0);
}

const target = pages.find((t) => t.url.includes(match));
if (!target) {
  console.error(
    `No page matching ${JSON.stringify(match)}. Available:\n` +
      pages.map((t) => `  ${t.url}`).join("\n"),
  );
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  const entry = pending.get(msg.id);
  if (!entry) return;
  pending.delete(msg.id);
  msg.error ? entry[1](new Error(JSON.stringify(msg.error))) : entry[0](msg.result);
});

// Some commands (notably Input.dispatchTouchEvent while the soft keyboard is
// animating) occasionally never get acked by the renderer. Without a timeout
// the process hangs forever holding the CDP connection, which then blocks
// every later call too.
const COMMAND_TIMEOUT_MS = Number(process.env.CDP_TIMEOUT_MS || 15000);

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method} timed out after ${COMMAND_TIMEOUT_MS}ms`));
    }, COMMAND_TIMEOUT_MS);
    pending.set(id, [
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    ]);
    ws.send(JSON.stringify({ id, method, params }));
  });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});
await send("Runtime.enable");
await send("Page.enable");

async function evaluate(source) {
  const result = await send("Runtime.evaluate", {
    expression: `(async () => { ${source} })()`,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const e = result.exceptionDetails.exception;
    throw new Error(e?.description || result.exceptionDetails.text);
  }
  return result.result.value;
}

try {
  switch (command) {
    case "eval":
      console.log(JSON.stringify(await evaluate(rest.join(" ")), null, 2));
      break;
    case "eval-file":
      console.log(
        JSON.stringify(await evaluate(readFileSync(rest[0], "utf8")), null, 2),
      );
      break;
    case "tap": {
      // Touch events are only acked by the foreground tab; on a background
      // one dispatchTouchEvent hangs until it times out. Opening any other
      // URL on the phone backgrounds the tab under test, so always raise it.
      await send("Page.bringToFront");
      const [x, y] = rest.map(Number);
      // Default settle covers the soft-keyboard slide, which fires several
      // visualViewport resizes on the way up.
      const settle = rest[2] === undefined ? 4000 : Number(rest[2]);
      const touchPoints = [{ x, y }];
      await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints });
      await sleep(120);
      await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await sleep(settle);
      console.log(`tapped ${x},${y} (settled ${settle}ms)`);
      break;
    }
    case "front":
      await send("Page.bringToFront");
      console.log(`fronted ${target.url}`);
      break;
    case "shot": {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(rest[0], Buffer.from(data, "base64"));
      console.log(`saved ${rest[0]}`);
      break;
    }
    case "nav": {
      const loaded = new Promise((resolve) => {
        const onMessage = (event) => {
          if (JSON.parse(event.data).method === "Page.loadEventFired") {
            ws.removeEventListener("message", onMessage);
            resolve();
          }
        };
        ws.addEventListener("message", onMessage);
      });
      await send("Page.navigate", { url: rest[0] });
      await Promise.race([loaded, sleep(15000)]);
      console.log(`navigated ${rest[0]}`);
      break;
    }
    case "widget":
      console.log(
        await evaluate(`
          const meta = document.querySelector('meta[name=viewport]');
          meta.setAttribute('content',
            'width=device-width, initial-scale=1.0, interactive-widget=${rest[0]}');
          return meta.getAttribute('content');
        `),
      );
      break;
    default:
      usage();
  }
} catch (error) {
  console.error(String(error.message || error));
  process.exitCode = 1;
} finally {
  ws.close();
  // Nothing else keeps the loop alive, but a half-closed socket can; leaving
  // is always correct here since every command has already produced output.
  process.exit(process.exitCode ?? 0);
}
