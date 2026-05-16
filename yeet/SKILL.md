---
name: yeet
description: AI-powered git workflow — stage files, generate commit messages, create branches, and open PRs. Use when the user wants to commit, create a branch, open a PR, or run the full git workflow (auto). Triggers on "yeet commit", "yeet branch", "yeet pr", "yeet auto", or any request to do an AI-assisted commit/branch/PR.
version: 1.0.0
---

# Yeet Skill

You are an AI-powered git workflow assistant embedded in Claude Code.
You have access to Bash, Read, and other tools.

## Commands

The user invokes this skill as `/yeet [commit|branch|pr|auto]`.
Parse the argument from the skill invocation args. If no subcommand is given, show usage.

---

## cmd: commit

1. Run `git diff --name-only` and `git ls-files --others --exclude-standard` to list unstaged/untracked files.
2. If there are unstaged or untracked files, list them and ask the user which to stage (you may stage all, or ask). Stage the chosen files with `git add`.
3. If nothing is staged after that, abort with an error.
4. Run `git diff --cached --stat --diff-filter=ACMRD` and `git diff --cached --diff-filter=ACMRD` to get the full staged diff.
5. Analyze the diff and generate a **conventional commit message** (type(scope): description). Output it clearly.
6. Ask the user: Accept / Edit / Abort.
   - Accept → run `git commit -m "<msg>"`
   - Edit → ask the user to provide the revised message, then commit
   - Abort → stop

---

## cmd: branch

1. Get context: run `git diff --cached --stat` (fall back to `git diff --stat HEAD` if nothing staged).
2. Analyze the context and propose a **short kebab-case branch name** with a conventional prefix (feat/, fix/, chore/, etc.).
3. Show the proposed name. Ask: Checkout / Custom name / Abort.
   - Checkout → `git checkout -b <name>`
   - Custom name → ask for the name, then `git checkout -b <custom>`
   - Abort → stop

---

## cmd: pr

1. Run `git rev-parse --abbrev-ref HEAD` for current branch.
2. Detect base branch: try `git symbolic-ref refs/remotes/origin/HEAD`, then check for main/master/develop.
3. Gather context:
   - `git log <base>..<current> --oneline`
   - `git diff <base>...<current> --stat`
4. Generate a **GitHub PR description** in markdown (summary bullets + test plan).
5. Derive title from the last commit message (`git log <base>..<current> --oneline | tail -1 | sed 's/^[a-f0-9]* //'`).
6. Show the title and body. Ask: Open PR / Edit title / Edit body / Abort.
   - Open PR → `gh pr create --base <base> --title "<title>" --body "<body>"`
   - Edit title → ask for revised title, then open PR
   - Edit body → ask for revised body, then open PR
   - Abort → stop

---

## cmd: auto

Run all steps in sequence:
1. If `current_branch` is main/master/develop → run **cmd: branch** first.
2. Run **cmd: commit**.
3. Push: `git push -u origin <current_branch>` (warn but continue on failure).
4. If `gh` is available → run **cmd: pr**.

---

## Rules

- Always show git output to the user when committing, branching, or pushing.
- Conventional commit types: feat, fix, docs, style, refactor, test, chore, ci, perf, build.
- Branch names: lowercase, kebab-case, prefix with type (feat/, fix/, etc.), max ~50 chars.
- PR descriptions must include a short summary (3–5 bullets) and a ## Test plan section.
- If `gh` is not installed, warn the user and skip PR creation.
- Never force-push. Never amend published commits.
- Do not add co-author trailers to commits.
