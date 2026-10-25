---
name: windows-mcp
description: Drive the Windows desktop through the windows-mcp tools. Use for computer use on Windows, before the first windows-mcp call.
---

# windows-mcp

The windows-mcp server runs on the Windows side and controls the real desktop. The shell is WSL, so reach Windows apps through these tools, not the shell. Its PowerShell and Registry tools are turned off.

A skill named `computer-use` that talks about `mcp__computer-use__*` tools is written for Claude's desktop app. Those tools don't exist here. Follow this skill instead.

## Loop

Work in small steps: one action, then look.

1. Open an app with `App` in `launch` mode, using its Start Menu name. Bring an open one forward with `App` in `switch` mode.
2. Look with `Snapshot`. It returns the focused window, the open windows and the interactive elements, with labels and coordinates. Text that isn't interactive, like Calculator's result, can be missing from it. To read that, or to see images, call `Snapshot` with `use_vision: true` and a `region` around the area.
3. Act with `Click`, `Type`, `Scroll` or `Shortcut`, using coordinates from the latest `Snapshot`.
4. Look again before the next action. After a launch or navigation, `Wait` 2 to 5 seconds first, since a window can appear late.

`Snapshot` returns plain text, not an object. Read it as text. When a script needs a value from it, search the text.

The task is done when the last look shows the state the user asked for.

## USER_CONTROL

The server pauses whenever the user moves the mouse or types, and every call then returns `USER_CONTROL` with `wait_seconds`. Typing the prompt counts too.

When you get it, tell the user once that their input is pausing you. Then `Wait` for `wait_seconds` plus 1 and retry the same call. `ControlStatus` reports `"state": "ai"` when control is back.

## Reporting

Quote what the screen says, with its labels. For a table, give the column headers next to the numbers. Interpret a number only when you know what the app means by it. For example, Anki's deck list shows `New`, `Learn` and `Due`, and `Due` is the count of reviews due today.
