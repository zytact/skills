# PROGRESS.md Format

`PROGRESS.md` lives at the vault root. It is the record of what the user has shown they can do, and the only place session state survives compaction. Read it at the start of every session.

## Structure

```md
# Progress

## Re-checks

- [ ] {YYYY-MM-DD} [[0005-trace-a-promise-chain#Part 3]]: thinks `race` means first success. Ask with the first promise rejecting.
- [x] {YYYY-MM-DD} [[0005-trace-a-promise-chain#Part 2]]: `typeof` a promise is "object". Passed {YYYY-MM-DD}.

## Log

- {YYYY-MM-DD} [[0005-trace-a-promise-chain#Part 1]]: 1/1. Throw skips to `.catch`, chain recovers.
- {YYYY-MM-DD} [[0005-trace-a-promise-chain#Part 3]]: 0/1. Said `race` and `any` both give B. Timeline alone didn't land, cab-company analogy did. Re-check added.
```

## Rules

- **Log every graded answer.** One line per part: score, what was wrong and why, which explanation worked. Append after each grade, before you reply.
- **Every miss gets a re-check.** It names the misconception and the question to ask next time. Tick it with the date when the user passes it, then leave it in place.
- **Log what was skipped.** "Already knows lessons 1-4" or "skipped the retry" goes in the log, so later sessions don't re-teach it or forget the gap.
- **Log mission changes and mistakes you fixed** in already-taught material.
- **Promote patterns.** When the same kind of mistake shows up in a second part, it is about the learner, not the topic: add it to `LEARNER.md`.
