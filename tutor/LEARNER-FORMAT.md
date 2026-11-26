# LEARNER.md Format

`LEARNER.md` lives at `$TEACH_LEARNER`, or `$TEACH_HOME/LEARNER.md` when that is unset, outside every vault. It is how this user learns, so every vault reads it and no preference has to be taught twice. Point `TEACH_LEARNER` into a synced git repository to share it across machines.

## Structure

```md
# Learner

## How to explain
- {A preference, in the user's words where possible, and the example that showed it}

## Patterns
- {A mistake the user repeats across topics, and what to do about it}

## Background
- {What they already know, and how deep}
```

## Rules

- **Write it the moment you learn it.** A stated preference or a pattern seen twice goes in right away.
- **Name the model.** When an explanation clicks, name it as the one to copy ("the Ravi tickets walkthrough in prediction-markets lesson 1"), so later sessions know what good looks like.
- **Keep it about the learner.** Topic facts go in the vault. If a line only makes sense for one mission, it belongs in that vault's `NOTES.md`.
- **Revise in place.** When a preference changes, edit the line rather than adding a contradicting one.
