# Driving a browser from WSL

Read this when the machine is WSL (`WSL_DISTRO_NAME` is set) and the drive needs a browser or desktop window. A CLI, TUI or HTTP surface runs inside WSL exactly as on Linux and needs none of it.

The route is proven for Chromium browsers driven over CDP. For any other window, the Windows side rules below still hold, and the rest is yours to work out and prove.

## The route

Run the browser on Windows. Keep everything else in WSL: the build, the dev server, the CLI and the drive scripts. A browser inside WSL shares the VM's memory, which `.wslconfig` caps, and its WSLg window takes the person's focus.

A Windows browser reaches a server listening on WSL's `127.0.0.1` at the same `http://localhost:<port>` URL.

## Windows side

- **Its own profile.** Launch with a `--user-data-dir` of the skill's own, which makes it a separate process from the browser the person has open. Leave their browser alone: do not connect to it, drive it, stop it, or read its `DevToolsActivePort`.
- **Files under `%LOCALAPPDATA%\<skill>\`.** Put the profile, an unpacked extension and the downloads folder there. A profile opened from `\\wsl.localhost` fails with `LockFileEx: Incorrect function` and `database is locked`. Find the folder with `wslpath "$(cmd.exe /d /c 'echo %LOCALAPPDATA%' | tr -d '\r')"`.
- **Run Windows tools from `/mnt/c`.** `cmd.exe`, `powershell.exe` and `reg.exe` warn or fail when their working directory is inside WSL.
- **Paths.** Convert every path the browser receives with `wslpath -w`, such as an upload or a `--load-extension` folder. Read what the browser wrote through `/mnt/c`.

## CDP

WSL in NAT mode cannot reach Windows `127.0.0.1`. Launch with `--remote-debugging-port=0` and read the port from the `DevTools listening` line of that browser's own output. Then start [`../scripts/cdp-relay.mjs`](../scripts/cdp-relay.mjs) and hand the drive scripts the relay's local port:

```bash
node scripts/cdp-relay.mjs <windows-port> <local-port> &
```

Each connection costs about a second, because it starts one `powershell.exe`. Reuse a connection across commands where the drive script allows it.

## Focus

A browser window opening on Windows takes focus from the person. Pick the first that the app allows:

1. **Headless.** The default.
2. **Hidden desktop**, when the site rejects headless, as captchas do. [`../scripts/hidden-desktop.ps1`](../scripts/hidden-desktop.ps1) starts the browser on a separate Windows desktop. The window is real and renders, and it never shows. It is the Windows counterpart of Xvfb.

   ```bash
   (cd /mnt/c && powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass \
     -File "$(wslpath -w scripts/hidden-desktop.ps1)" <desktop-name> "$(printf '%s' "$command_line" | base64 -w0)")
   ```

   It prints the browser's Windows process ID.
3. **Visible**, only for a step a human has to do. Tell the person a window is about to open.

## Sign-in

A Linux profile's cookies do not carry to Windows. When the app needs a signed-in session, copy it from the person's own browser profile into the skill's profile: `Local State`, `Preferences`, `Secure Preferences`, `Network`, `Local Storage`, `Session Storage`, and the site's IndexedDB folders.

The browser locks its cookie file while it runs, so the copy needs it closed. Ask the person to close it, run the copy yourself, and tell them when they can reopen it. When the browser is open at launch, reuse the last copy and report that it may be stale.

## Native messaging

On Windows, Chromium finds a native host only through the registry, never in the profile. Register it under `HKCU\Software\Chromium\NativeMessagingHosts\<name>`, pointing at a manifest whose host is a `.bat` that runs `wsl.exe -d $WSL_DISTRO_NAME -e node <host>`. The host and its socket then stay in WSL.

That key is per user, so the person's own browser sees it too. Gate the `.bat` on an environment variable that only the verification launch sets:

```bat
if not defined <APP>_IPC_PATH exit /b 1
```

Pass the variable with plain `WSLENV=<APP>_IPC_PATH`. The `/u` flag drops it.

## Cleanup

Close the browser with `Browser.close` over CDP. As a fallback, `taskkill.exe` the processes whose command line contains the skill's profile path, and nothing else named `chrome.exe`. Stop the relay, remove the registry key and the downloads folder, and keep the profile for the next run.

## What the generated skill carries

- Every script takes the same commands and writes the same session variables on both machines. It branches on `WSL_DISTRO_NAME`.
- `scripts/wsl.sh` holds the Windows-specific functions, and the scripts source it only on WSL.
- A sibling `wsl.md` records the Windows paths, the sign-in copy and the failures this app showed.
- `SKILL.md` gets one line: on WSL the scripts drive the Windows browser with the same commands, and `wsl.md` is for when a WSL launch, sign-in or cleanup fails, or a run needs a visible window.
- Copies of `cdp-relay.mjs` and `hidden-desktop.ps1`, when the route uses them.
