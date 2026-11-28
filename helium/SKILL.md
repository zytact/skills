---
name: helium
description: Drive the user's own Helium browser over DevTools from Linux, WSL or Windows, with their logins, in tabs kept apart from theirs. Use when a task needs a site the user is signed in to, a real non-headless browser that captchas accept, or a page handed to the user to finish.
---

# Helium

`scripts/helium.mjs` in this skill's folder drives the user's own Helium over DevTools, so it carries their logins in one cookie jar. It is a real, non-headless browser, because captchas reject headless ones. From WSL it reaches the Windows Helium through a PowerShell relay.

`start` attaches through one connection that a background process holds until `stop`. Helium asks the user to approve each new connection, so every later command reuses it. Each tab you `open` gets its own minimized window, and the commands act only on those tabs, never on the user's. Every command prints one JSON line. The commands here are bash; on Windows, run them in Git Bash.

```bash
H=<this skill's folder>/scripts/helium.mjs
node $H start                 # attach to Helium, opening it if closed; waits up to 2 minutes for the user to approve the connection, and after 3 seconds shows a desktop notification and raises Helium
node $H open <url>            # new tab, becomes current
node $H snapshot              # page text plus numbered visible elements, shadow DOM included; scoped to an open modal, --all for the whole page
node $H click <ref>           # prints dialog: true when a modal is open after the click
node $H fill <ref> <text>     # replaces the field's text, prints the value it now holds; a month input takes 2027-07
node $H select <ref> <label>  # native <select> only; for custom dropdowns click, snapshot, click the option
node $H upload <ref> <file>   # file inputs show in snapshots even when hidden
node $H press Enter           # also Tab, Escape, ArrowDown, ArrowUp, Backspace
node $H tabs                  # a link that opens a new tab lands here; switch with: node $H use <id>
node $H goto <url>
node $H eval '<js>'           # read what a snapshot misses, such as an iframe's src
node $H dialog accept         # or dismiss; answers a page's alert, confirm or prompt, which fails every other command with its text until answered
node $H shot                  # screenshot path, for showing the user
node $H show                  # bring the current tab's window up for the user; hide minimizes it again
node $H close
node $H stop                  # close every tab this connection opened and detach; Helium stays open
```

When `start` fails, do no browser work and report its error, such as an unapproved connection or remote debugging turned off.

Refs come from the latest snapshot. Take a new one after every click that changes the page. A typeahead field, such as a city, wants you to fill it, snapshot, and click a suggestion. Snapshots reach into same-origin iframes. When a form sits in a cross-origin iframe, `eval` its `src` and `goto` it.

One connection serves the whole machine, so two runs that use it at once share tabs and the current tab, and either one's `stop` closes both runs' tabs.

## Setup

`start` needs Helium at `/opt/helium/helium` on Linux or under `%LOCALAPPDATA%\imput\Helium` on Windows and WSL, with remote debugging on at `chrome://inspect/#remote-debugging`. Set `HELIUM_BROWSER` when Helium lives elsewhere and `HELIUM_USER_DATA` when its user data folder does. Its state, log and screenshots go in `~/.local/state/helium/`.
