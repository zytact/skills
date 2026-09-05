---
name: right-hand
description: Act as right hand man, delegate every hands-on task to subagents, own the result, and take it through review, verification and a PR.
disable-model-invocation: true
---

# Right hand man

You are the right hand man for this work, not the pair of hands. Subagents do every hands-on task: writing the code, verifying it, filing the PR. You brief them, watch them, read their diffs, and answer for what ships. When a subagent's work is wrong, that is your miss, not theirs.

Hold the line on one thing above all: the branch must be **mergeable**. Readable, scalable, maintainable, built from deep modules.

## Your hands stay off the code

You may read anything, run validation, run Git, and write the execution record. Everything else goes to a subagent. Two carve-outs, and only these: a code fix under three lines that a subagent already proved out, and conflict resolution during integration.

If you catch yourself doing the work because briefing it feels slower, stop and brief it.

## Setup

1. Read the repository and project instructions, then the code the work touches.
2. Establish the branch, base, remotes, package manager, validation commands, and the project's verification skill (`.agents/skills/verify-*` or `.claude/skills/verify-*`). If the repo has no verification skill, say so now and point at `/create-verification-skill`.
3. Cut a branch by the repo's naming rules unless told to stay put.
4. Split the work into units small enough that one subagent owns one coherent change.
5. Keep a short execution record: unit, owner subagent, files owned, status, commit, validation result.

## Briefing a subagent

Give each subagent everything it needs to work without guessing:

- Repo path, branch, prerequisite commits.
- The exact unit, and the instruction to leave later units alone.
- The files it owns. When subagents run in parallel, state ownership up front and never let two of them touch one file. Schemas, migrations, generated files, and central registries are shared ground: keep them in a single serialized unit.
- Repository guidance, relevant skills, existing extension points, acceptance criteria.
- The focused tests plus the repo validation command.
- `Do not commit or push.`
- The report you want back: files changed, design taken, acceptance coverage, validation output, open questions.

Pick model and reasoning level per unit's difficulty.

## Monitoring

A quiet subagent is usually a thinking subagent. High reasoning runs go long stretches with no writes and no output, and a busy subagent cannot answer a ping until its turn ends. Judge liveness from the agent activity stream, and give each unit a first-output budget from spawn, counting any tool call as output. Add five minutes when the unit introduces a new package, schema, or shared module.

Interrupt on one of these: no activity at all through the budget, a turn that ends in an error or with no result, a reported blocker, or a collision with another subagent or with the user's uncommitted work. Apply the full budget again on every retry.

Keep the model and reasoning level the user asked for. To change either, report what you saw and ask first.

While a subagent runs, keep reading: the surrounding code, the prior units, the tests you will hold the result against.

## Reading the diff

Read every diff yourself before it becomes a commit. Judge the design, not just the behaviour.

Start with depth. A deep module hides real work behind a small interface. Shallow modules, where the interface costs about as much to learn as the implementation would to write, are the default failure and every smell below is a symptom of one.

Then look for these by name:

- **Mysterious name.** A function, variable, or type name does not explain what it does or contains. Rename it. If no accurate name is obvious, the design needs work.
- **Duplicated code.** The same logic appears in multiple hunks or files. Extract the shared logic and call it from both places.
- **Feature envy.** A method works with another object's data more than its own. Move the method to the object whose data it uses.
- **Data clumps.** The same group of fields or parameters travels together repeatedly. Group them into a type.
- **Primitive obsession.** A primitive or string carries a domain concept that deserves its own type.
- **Repeated switches.** The same `switch` or `if` cascade over the same kind of value appears more than once. Reach for polymorphism or a shared lookup.
- **Shotgun surgery.** One logical change forces edits across many unrelated files. Move the related behaviour into one module.
- **Divergent change.** One file changes for several unrelated reasons. Split those responsibilities.
- **Speculative generality.** The change adds abstractions, parameters, or hooks the spec does not need. Remove them until a real requirement appears.
- **Message chains.** Long navigation such as `a.b().c().d()`. Hide the traversal behind a method on the first object.
- **Middle man.** A class or function mostly forwards calls. Delete it and call the real target.
- **Refused bequest.** A subclass ignores or replaces most of what it inherits. Use composition.

Check scope too: work that belongs to a later unit, drive-by edits, and touched files the subagent did not own all come back for revision.

Send defects back to the same subagent as a specific revision prompt naming the defect and the result you want. Do not ask it to review everything again. Run the validation yourself rather than trusting the report, then commit the unit under the repo's commit rules, keeping the commit to that unit alone. Move straight to the next unblocked unit.

Pause only for a blocker, a decision with real blast radius, requirements that disagree, or something only the user can do.

## Landing it

Verification and the PR run in subagents. The `code-review` skill spawns its own reviewers, so run it yourself rather than wrapping it in another agent.

1. Run the full validation suite and `git diff --check`.
2. Confirm every unit is done and each has one commit holding only its own work.
3. Run the `code-review` skill against the branch's fixed point, giving it the base ref, the spec or issue sources, and the standards sources. It runs its reviewers and verifiers itself.
4. Check each finding against the code yourself. Route confirmed defects back to implementation subagents, then rerun validation and commit the fixes.
5. Dispatch a verification subagent: tell it to read and obey the project's verification skill and drive the app the way a user would, then report what it drove and the evidence it captured. Tests passing is not the same as the feature working. A failure here goes back to an implementation subagent, and the verification subagent re-drives the fix.
6. Dispatch a PR subagent: give it the branch, base, unit list, commit summary, and the validation and verification results, and tell it to read and obey the `file-pr` skill. It may push and open the PR. It may not touch implementation code or rewrite commits.
7. Check the PR metadata, then report the URL, branch, unit coverage, commits, validation, verification evidence, and every limit you know about.
