---
name: ship
description: Take a task from implementation to a filed PR, with code review, a verification-skill audit and live verification on the way, then merge it when the merge gate passes.
disable-model-invocation: true
---

# Ship

Take the task passed to `/ship` from code to one filed PR: implement or fix it, review it, prove it live, file, then merge if the gate passes. Each step below ends on its completion criterion. Move to the next step only once it holds.

## 0. Locate the verification skill

Find the project's verification skill: the project-local skill with launch/drive sections and a feature map (usually `.agents/skills/verify-*/` or `.claude/skills/verify-*/`). Several candidates, ask which one. None, stop and ask the user whether to run `/create-verification-skill` first or ship without live verification.

If the change is user-visible, drive the current app with it now and capture the "before" evidence for the PR.

Done when the target verification skill is named and the "before" evidence exists, or the user chose to ship without one.

## 1. Implement

Branch off the default branch, then implement or fix the task.

Done when the change does what the task asks and the project's own checks (typecheck, lint, tests) pass.

## 2. Review

Invoke the `code-review` skill with the merge-base against the default branch as the fixed point. Fix every confirmed finding, or record why it stays.

The `code-review` skill allows 3 runs per branch. Once they are spent, fixes from steps 3 and 4 go in without another review, and the report lists them as unreviewed.

Done when every confirmed finding is fixed or has a recorded reason.

## 3. Maintain the verification skill

`maintain-verification-skill` is user-invoked, so the Skill tool cannot fire it. Read its `SKILL.md` (usually `~/.agents/skills/maintain-verification-skill/SKILL.md`) and run its pass against the skill from step 0, with these overrides:

- Scope the source read, live pass and missing-surface sweep to the features this branch adds or changes. Leave other features alone. Index hygiene still covers the whole map. If the map lacks a feature this branch adds, add it.
- `clean` and `changed` mean every in-scope feature got source and live coverage.
- Its corrections ride in this branch as their own commit. It files no PR of its own.
- A product gap caused by this branch's change gets fixed in the code, then goes back through step 2. Any other product gap is a pre-existing issue. Handle it as step 7 says.

Done when the pass reaches its `clean` or `changed` outcome. A `blocked` outcome stops the ship: report the blocker.

## 4. Verify

Use the refreshed verification skill to drive every behavior this branch changes, the way a user would. Capture the "after" evidence.

A failure is a bug in the change. Fix it, send the fix through step 2, and drive again.

Done when every changed behavior passed live and its evidence exists.

## 5. File the PR

Invoke the `file-pr` skill. Attach the before and after evidence.

Done when the PR is open and shows the uploaded evidence.

## 6. Merge

Call T3 Code's `watch_pull_request` on the PR and end your turn. T3 wakes you when a check fails, checks pass, a comment or review lands, or the PR conflicts. A wake is news, not a merge decision. Outside T3 Code, wait with `gh pr checks --watch` and then read the comments.

The repo's review bots are the ones that reviewed its recent merged PRs, such as CodeRabbit, Copilot or Greptile. A repo with no CI and no review bots has nothing to wait for, so go straight to the gate.

On each wake, read the full state with `gh pr checks` and `gh pr view --comments`, then act on it:

- A failed check, a conflict or a review comment: fix it, send the fix through step 2 and push, or reply with the reason it stays. Resolve the thread. The watch stays on, so end the turn.
- Checks still pending, or a review bot has not reviewed the latest push: end the turn.
- Otherwise, judge the gate.

Many repos have no branch protection, so GitHub will merge a PR with failing or missing checks. Enforce the gate yourself. Merge the PR only when all of these hold:

- The PR has checks, and every one is green. A repo with no CI fails this gate unless the project's own checks from step 1 pass on the final branch.
- Every review bot the repo uses has reviewed the latest push.
- Every confirmed review finding is fixed, or its recorded reason would convince a maintainer. No fix is unreviewed.
- Every changed behavior passed live in step 4.
- No review comment on the PR is unresolved.
- Reading the full diff once more, you are confident it is correct and ready.

Merge with the method the repo uses, judged from recent merged PRs, and delete the branch. If a condition fails and nothing on the branch can fix it, leave the PR open. Either way, call `unwatch_pull_request`.

Done when the PR is merged, or left open with the failed condition named, and the watch is off.

## 7. File pre-existing issues

Problems found along the way that this branch did not cause, such as product gaps, failing checks or bugs already on the default branch, go to GitHub as issues. Confirm each one reproduces on the default branch, and search open issues first so you do not file a duplicate. Give each issue the steps to reproduce and the evidence you have, and label it with every fitting label from `gh label list`, such as `bug` or `enhancement`. Do not fix them in this branch.

Done when every pre-existing problem has a labeled issue, new or already open.

## Report

End with the PR URL, whether it merged or which merge condition failed, review findings left unfixed and why, fixes left unreviewed, the maintain outcome, the behaviors verified live, and the issues filed or found for pre-existing problems.
