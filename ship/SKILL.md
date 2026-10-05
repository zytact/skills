---
name: ship
description: Take a task from implementation to a filed PR, with code review, a verification-skill audit and live verification on the way.
disable-model-invocation: true
---

# Ship

Take the task passed to `/ship` from code to one filed PR: implement or fix it, review it, prove it live, then file. Each step below ends on its completion criterion. Move to the next step only once it holds.

## 0. Locate the verification skill

Find the project's verification skill: the project-local skill with launch/drive sections and a feature map (usually `.agents/skills/verify-*/` or `.claude/skills/verify-*/`). Several candidates, ask which one. None, stop and ask the user whether to run `/create-verification-skill` first or ship without live verification.

If the change is user-visible, drive the current app with it now and capture the "before" evidence for the PR.

Done when the target verification skill is named and the "before" evidence exists, or the user chose to ship without one.

## 1. Implement

Branch off the default branch, then implement or fix the task.

Done when the change does what the task asks and the project's own checks (typecheck, lint, tests) pass.

## 2. Review

Invoke the `code-review` skill with the merge-base against the default branch as the fixed point. Fix every confirmed finding, or record why it stays.

Done when every confirmed finding is fixed or has a recorded reason.

## 3. Maintain the verification skill

`maintain-verification-skill` is user-invoked, so the Skill tool cannot fire it. Read its `SKILL.md` (usually `~/.agents/skills/maintain-verification-skill/SKILL.md`) and run its pass against the skill from step 0, with these overrides:

- Its corrections ride in this branch as their own commit. It files no PR of its own.
- A product gap caused by this branch's change gets fixed in the code, then goes back through step 2. Any other product gap goes to the final report.

The pass must cover the feature this branch adds or changes. If the map lacks it, add it.

Done when the pass reaches its `clean` or `changed` outcome. A `blocked` outcome stops the ship: report the blocker.

## 4. Verify

Use the refreshed verification skill to drive every behavior this branch changes, the way a user would. Capture the "after" evidence.

A failure is a bug in the change. Fix it, send the fix through step 2, and drive again.

Done when every changed behavior passed live and its evidence exists.

## 5. File the PR

Invoke the `file-pr` skill. Attach the before and after evidence.

Done when the PR is open and shows the uploaded evidence.

## Report

End with the PR URL, review findings left unfixed and why, the maintain outcome, the behaviors verified live, and any product gaps found outside this change.
