---
name: computer-use-linux
description: Drive the Linux desktop through the computer-use-linux tools. Use for computer use on Linux, before the first computer-use-linux call.
---

# computer-use-linux

The computer-use-linux server controls the real GNOME Wayland desktop. It sends input through ydotool, uinput and the remote desktop portal, and reads AT-SPI accessibility trees.

A skill named `computer-use` that talks about `mcp__computer-use__*` tools is written for Claude's desktop app. Those tools don't exist here. Follow this skill instead.

## Loop

Work in small steps: one action, then look.

1. Launch apps from the shell, detached: `setsid nautilus >/dev/null 2>&1 &`. The server has no launch tool, and typing an app name into the GNOME overview is unreliable.
2. Get the window with `list_windows` and keep its `window_id`. Pass `window_id` to every call after that.
3. Look with `get_app_state` scoped to the window (`window_id` or `wm_class`). A call without a target returns the whole desktop tree and floods context.
4. Act, and pass `screenshot_after: "window"` so the action returns its own fresh look.
5. Check that look before the next action. A tool reporting `ok: true` means the input was sent, not that it landed.

The task is done when the last look shows the state the user asked for.

## What lands

Prefer the keyboard. It is the most reliable input here.

- **Navigate with the keyboard.** In Files, `ctrl+l`, then `type_text` with the full path, then `enter`, opens a folder.
- **Scroll with keys.** The mouse wheel doesn't move GTK views like the Files grid. Use `pagedown`, `pageup`, `home` and `end`.
- **Click by fresh index.** `element_index` refers to the latest `get_app_state` only. After anything changes, look again before clicking by index.
- **Click by coordinates in screenshot space.** Coordinates are in the screenshot's `coordinate_width` by `coordinate_height` space, not the pixels of a resized image. Divide image pixels by its `scale`.

To wait, use `screenshot_after` or another look. Code-mode harnesses don't have `setTimeout`.

## When it breaks

Run `computer-use-linux doctor | jq .readiness` in the shell. If `screenshot` fails with a portal timeout, GNOME is showing a permission prompt. Ask the user to click Allow, then retry.
