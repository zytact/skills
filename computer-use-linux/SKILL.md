---
name: computer-use-linux
description: Drive the Linux desktop through the computer-use-linux tools. Use for computer use on Linux, before the first computer-use-linux call.
---

# computer-use-linux

The computer-use-linux server controls the real GNOME Wayland desktop. It sends input through ydotool, uinput and the remote desktop portal, and reads AT-SPI accessibility trees.

A skill named `computer-use` that talks about `mcp__computer-use__*` tools is written for Claude's desktop app. Those tools don't exist here. Follow this skill instead.

## Loop

Work in small steps: one action, then look.

1. Launch apps from the shell through the user session: `systemd-run --user --collect --quiet nautilus`. This works even when the shell has no display variables. The server has no launch tool, and typing an app name into the GNOME overview is unreliable.
2. Get the window with `list_windows` and keep its `window_id`. Pass `window_id` to every call after that.
3. Look with `get_app_state` scoped to the window (`window_id` or `wm_class`). A call without a target returns the whole desktop tree and floods context.
4. Act, and pass `screenshot_after: "window"` so the action returns its own fresh look.
5. Check that look before the next action. A tool reporting `ok: true` means the input was sent, not that it landed. If the look shows no change, the screen may not have updated yet, so look once more before repeating the action.

The task is done when the last look shows the state the user asked for.

## What lands

Use the keyboard when it can do the job, and click when the task needs a click.

- **Navigate with the keyboard.** In Files, `ctrl+l`, then `type_text` with the full path, then `enter`, opens a folder.
- **Scroll with keys.** The mouse wheel doesn't move GTK views like the Files grid. Use `pagedown`, `pageup`, `home` and `end`.
### Pick the click method from the tree

Before clicking an element, read its node from the latest `get_app_state` and pick the method once:

| Node | Click with |
|---|---|
| `actions` is not empty | `element_index`. The tool calls the element's own action, so its position doesn't matter. |
| `actions` is empty and `bounds` has a real `x`/`y` (Firefox, Chromium) | `element_index` |
| `actions` is empty and `bounds` is at `x: 0, y: 0` | Coordinates |
| No useful tree (Qt and KDE apps expose one node) | Coordinates |

GTK4 apps, like Files, Text Editor and Calculator, report every element at `x: 0, y: 0`. Most buttons have actions and click fine by index. Rows without actions, like the Files sidebar, don't. An index click on one reports `ok: true` and lands at the wrong spot.

`element_index` refers to the latest `get_app_state` only. After anything changes, look again before clicking by index.

### Coordinates

To click a spot read off a window screenshot, pass `window_id`, `x`, `y` and `relative: true`. Divide the position by the screenshot's `scale` first, if it isn't 1.

Without `relative: true`, `x` and `y` are full-screen coordinates, even when you pass `window_id`. Use that only with a full-screen screenshot.

If a look shows the GNOME Activities overview (shrunken windows and the dock), press `escape` before anything else. Every click misses while it's open.

To wait, use `screenshot_after` or another look. Code-mode harnesses don't have `setTimeout`.

## When it breaks

The harness owns the `computer-use-linux mcp` process. Leave every `computer-use-linux` process running, since killing one disconnects the tools for the rest of the session. If the tools are missing from your tool list, stop and tell the user.

Run `computer-use-linux doctor | jq .readiness` in the shell. If `screenshot` fails with a portal timeout, GNOME is showing a permission prompt. Ask the user to click Allow, then retry.
