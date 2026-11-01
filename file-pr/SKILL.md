---
name: file-pr
description: File a concise pull request. Use when the user asks to file, open or create a PR.
---

# File PR

Before filing, check whether a PR for this branch already exists. Review the diff locally against `origin/main` or `origin/master` to make sure its contents match the goal.

Aim for under 600 changed lines. If the diff is larger and splits into parts that each make sense on their own, stack it with the `gh-stack` skill. Never split only to get under the line count.

PR titles usually become commit messages, so follow the repository's title conventions. Look at recently merged PRs and Git history for examples. 

Prefer a concise, human-readable title that explains why the change matters:

BAD
> perf (server): negotiate permessage-deflate on the websocket

GOOD
> perf(server): cut websocket frame size by 70%+ with gzipping

Open the description with a simple explanation of the problem based on the user's original prompt, then briefly explain the solution. Do not lead with an implementation inventory:

BAD
> Removed implicit workspace carry-over from every "new thread" entry point (cmd+n / cmd+shift+o, sidebar v1/v2 buttons, command palette). New threads inherit only the project from context; branch, worktree, and env mode always come from the configured defaults. Deleted buildContextualThreadOptions, startNewThreadInProjectFromContext, and the v1 sidebar's seed-context machinery.

GOOD
> My "new worktree" default was ignored when starting new threads on existing worktrees. Super unintuitive. Now your preferences always apply.

Attach before and after screenshots or video to the description. Upload them with `gh`, which supports PR attachments, and never commit media to the repository. Open the filed PR and confirm the attachments render; a local file path does not count. If capture or upload is impossible, name the specific blocker in the PR and in your report.

If the PR closes one or more issues, use "Closes #<issue_number>" in the body.

Open a real PR rather than a draft so review bots run. If the user also asked, babysit it too.
