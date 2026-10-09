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
- The latest start time. No task launches after it, so a long deferral can't push the queue into the user's day.
- The model and effort for the main thread, if they didn't name one.
- Merge policy per task. A task that changes policy or leaves a design point open should get a PR left open for review.
- Shared external resources that threads on different providers would still compete for when they run at the same time.
- The usage gate's threshold, default 60% of the 5-hour window with the reset more than 45 minutes away, and which tasks it applies to.

Done when every task has a time, a branch name, a model, and a merge policy, and the queue has a latest start time.

## 2. Schedule

Scheduled tasks only recur, so make each one delete itself the moment it fires. Create one `schedule_task` per task:

- `schedule`: `fixed_time` and `weekdays` from its fire time, as described in "Fire times" below. A failed delete then repeats a week later, not tomorrow.
- Bound to this thread, title `<Skill> #<n>`, stable `clientRequestId`.
- A prompt with these steps for you to follow when it fires:
  1. Find the task by title with `list_scheduled_tasks` and delete it.
  2. Queue rule. If `t3_thread_list` shows an unfinished thread from this queue on the same provider, defer 30 minutes from now. A thread stopped by a usage limit that T3 will resume counts as unfinished. Also defer if a lower-numbered task on the same provider still has a pending schedule.
  3. Usage gate. If the gate applies to this task and trips, defer to the reset time plus 5 minutes.
  4. Run `t3_thread_launch` with the title, the worktree strategy (`baseRef` the default branch, the new branch, `startFromOrigin: true`), the model, and `runtimeMode: full-access`. Pass the thread message between `BEGIN` and `END` markers, verbatim.
  5. Confirm the thread started with `t3_thread_read`. If a launch fails, check `t3_thread_list` before you retry.

The provider is the account the task's model bills to, the same one the usage gate reads. At most one thread per provider runs at a time, and tasks on one provider launch in queue order. Tasks on different providers don't wait on each other. The queue rule runs first, so a blocked task doesn't read usage for nothing.

To defer, launch nothing. Add the task number in minutes to the deferred time, so a deferred task never lands on the same minute as another task's slot. If that time falls after the latest start time, skip the task instead. Otherwise create a new self-deleting schedule at that time with the same title and prompt. Either way, say why: the running thread's title, or the utilization and reset time.

### Fire times

Every schedule, initial or deferred, gets its time this way:

1. Compute the fire time as a full timestamp. Claude's `resets_at` is an ISO string and Codex's `reset_at` is epoch seconds.
2. Convert it to the machine's local time.
3. Set `fixed_time` to its local clock time and `weekdays` to its local weekday.

This keeps a schedule that crosses midnight from landing on a day that has already passed.

### Usage gate

Read the 5-hour window of the account the thread's model bills to, once per gate:

- **Claude models.** Take `claudeAiOauth.accessToken` from `~/.claude/.credentials.json` and GET `https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <token>` and `anthropic-beta: oauth-2025-04-20`. Use `five_hour.utilization` (a percentage) and `five_hour.resets_at`.
- **GPT models through Codex.** Take `tokens.access_token` and `tokens.account_id` from `~/.codex/auth.json` and GET `https://chatgpt.com/backend-api/wham/usage` with `Authorization: Bearer <token>` and `chatgpt-account-id: <account_id>`. The 5-hour window is whichever of `rate_limit.primary_window` and `rate_limit.secondary_window` has `limit_window_seconds` 18000. Use its `used_percent` and `reset_at` (epoch seconds). Which windows exist depends on the plan tier, so if neither has 18000, the plan has no 5-hour limit and the gate passes.

If the read fails, the gate passes and the launch notes the failure.

The thread message starts with `/<skill> <task>` and the skill file's path as a fallback, since user-invoked skills may not load from a message. It then covers:

- Unattended running: no questions. Decisions go in the PR body and the final report, and a real blocker stops the run.
- The worktree setup from step 1.
- Which model handles which step, through `delegate_task`, with a new task and `clientRequestId` for each round.
- Shared-resource limits: a minimal request budget, failures reported instead of retried in loops, real data only.
- The other tasks in the queue, and a rebase onto origin's default branch with checks rerun before the final push.
- `link_pull_request` for the PR, and that task's merge policy.

## 3. Schedule the check-in

T3 Code resumes threads stopped by a usage limit once the limit resets. The check-in catches the runs where that resume fails, or a thread stops for another reason. Add one more self-deleting schedule, `Night shift check-in`, at the latest start time plus one typical run. When it fires, bring every task to one of these states:

- Its original schedule never fired: delete it and report the task as skipped.
- A deferred schedule is still pending: leave it and report it as still deferred, with the last reason.
- A deferral would have missed the latest start time: leave it skipped and report it, so the user decides.
- It has no schedule and no thread: report it as lost. It deleted its schedule and then failed to create the deferred one.
- Its thread is still running: leave it.
- Its thread finished: PR open or merged per its merge policy, or a reported blocker.
- Its thread stopped partway through: one `t3_thread_send` telling it to resume the skill from where it stopped, then confirm it picked the work back up.

Each task keeps at most one thread. The check-in ends on a table of task, thread state, deferrals and their reasons, PR and action taken.

Done when every task and the check-in appear in `list_scheduled_tasks` with the right `nextRunAt`.

## Report

A table of time, task, provider, branch and merge policy, the latest start time, the check-in time, plus anything the user must keep true while away, such as the machine staying awake.
