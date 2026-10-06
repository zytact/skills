---
name: night-shift
description: Schedule a queue of tasks to run unattended, each in its own T3 Code thread and worktree at a set time, while the user is away.
disable-model-invocation: true
---

# Night shift

The user hands you a queue: tasks (usually issues), a start time for each, the skill each thread runs (usually `/ship`), and the models to use. They will be away while it runs, so every decision gets settled before they leave. Each thread runs **unattended**.

## 1. Settle the queue

Read each task. Run `orchestrator_capabilities` and map every model the user named to its exact provider instance, model ID and effort option.

Check what a fresh worktree lacks:

- Gitignored local state the run needs, such as a verification skill's browser profile. Find the skill's own instructions for copying it into a worktree.
- Uncommitted work on the default branch. Worktrees never receive it.
- A local default branch behind origin. Start each worktree from origin.

Then ask the user, in one batch, everything still open:

- Start times as fixed clock times. Turn "an hour after the last one" into a time.
- The model and effort for the main thread, if they didn't name one.
- Merge policy per task. A task that changes policy or leaves a design point open should get a PR left open for review.
- Shared external resources that threads running at the same time would compete for, such as one account's rate limit.

Done when every task has a time, a branch name, a model, and a merge policy.

## 2. Schedule

Scheduled tasks only recur, so make each one delete itself the moment it fires. Create one `schedule_task` per task:

- `schedule`: `fixed_time` at its time, `weekdays` set to today's weekday only. A failed delete then repeats a week later, not tomorrow.
- Bound to this thread, title `<Skill> #<n>`, stable `clientRequestId`.
- A prompt with these steps for you to follow when it fires:
  1. Find the task by title with `list_scheduled_tasks` and delete it.
  2. Run `t3_thread_launch` with the title, the worktree strategy (`baseRef` the default branch, the new branch, `startFromOrigin: true`), the model, and `runtimeMode: full-access`. Pass the thread message between `BEGIN` and `END` markers, verbatim.
  3. Confirm the thread started with `t3_thread_read`. If a launch fails, check `t3_thread_list` before you retry.

The thread message starts with `/<skill> <task>` and the skill file's path as a fallback, since user-invoked skills may not load from a message. It then covers:

- Unattended running: no questions. Decisions go in the PR body and the final report, and a real blocker stops the run.
- The worktree setup from step 1.
- Which model handles which step, through `delegate_task`, with a new task and `clientRequestId` for each round.
- Shared-resource limits: a minimal request budget, failures reported instead of retried in loops, real data only.
- The other tasks in the queue, and a rebase onto origin's default branch with checks rerun before the final push.
- `link_pull_request` for the PR, and that task's merge policy.

Done when every task appears in `list_scheduled_tasks` with the right `nextRunAt`.

## Report

A table of time, task, branch and merge policy, plus anything the user must keep true while away, such as the machine staying awake.
