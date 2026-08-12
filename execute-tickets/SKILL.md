---
name: execute-tickets
description: Execute an ordered range or list of implementation tickets end to end using supervised coding subagents, one commit per ticket, final code review, fixes, and a pull request.
disable-model-invocation: true
---

# Execute Tickets

Run the ticket sequence continuously. The parent agent owns orchestration, review, commits, and final integration. Subagents implement bounded tickets but never commit or push.

## Defaults

Unless the user overrides them:

- Create a new branch following repository conventions.
- Use model and reasoning level based on your choice for the ticket complexity.
- Process tickets in dependency order.
- Commit each accepted ticket separately.
- After all tickets, invoke the `code-review` skill with model and reasoning level based on what is best for both axes.
- Fix confirmed review findings in the parent session, then rerun validation and commit the fixes.
- Delegate filing the PR to another subagent. This is an easy task so reasoning level does not need to be that high. Require it to read and follow the `file-pr` skill. The PR subagent must not alter implementation code.

Explicit user choices always replace these defaults.

## Prepare

1. Read repository and project instructions.
2. Confirm the worktree, current branch, remotes, issue tracker, package tooling, and validation commands.
3. Fetch every requested ticket and its parent/umbrella issue. Determine dependencies and acceptance criteria before editing.
4. Inspect existing uncommitted changes. Preserve them and identify which ticket, if any, owns them.
5. Create the branch unless the user requested the current branch.
6. Build a short execution ledger containing ticket order, dependency, status, commit, and validation result.

Do not ask for information that the repository, issue tracker, or user request already provides.

## Decide concurrency

Default to sequential execution. Parallelize only tickets that are dependency-independent and have disjoint file ownership.

Before parallel work, state each subagent's ticket and file ownership. Never run agents concurrently when shared generated files, schemas, migrations, central registries, or likely integration points could collide. Integrate and review each result independently.

## Execute each ticket

For each ticket:

1. Re-read the issue against the current committed state and inspect relevant code, docs, and prior ticket changes.
2. Spawn a fresh coding subagent with a self-contained prompt that includes:
   - repository path, branch, and prerequisite commits;
   - the exact ticket and instruction not to implement later tickets;
   - issue-fetching instructions and relevant parent issue;
   - repository guidance and files or skills it must read;
   - acceptance criteria, constraints, existing seams, and known uncommitted user work;
   - focused test and repository validation expectations;
   - `Do not commit or push`;
   - a required report covering changed files, design, acceptance coverage, validation, and uncertainties.
3. Monitor the child. Continue useful inspection while it runs.
4. Review the actual diff and tests yourself. Compare behavior to every acceptance criterion, check scope, inspect repository status, and run the relevant validation independently.
5. If work is incomplete or poorly shaped, steer the same implementation through a focused revision prompt. State the concrete defect and required outcome rather than asking for a generic re-review.
6. Commit only after the implementation and validation passes. Follow repository commit conventions and keep the commit scoped to that ticket.
7. Update the execution ledger and immediately continue to the next unblocked ticket.

Do not stop after reporting an intermediate ticket. Pause only for a genuine blocker, destructive decision, unresolved requirement conflict, or required user action.

## Final integration

1. Run the repository's complete validation suite and `git diff --check`.
2. Confirm the requested ticket set is complete and each ticket maps to a focused commit.
3. Load and follow the `code-review` skill. Use the configured review agents for both Standards and Spec axes, supplying the fixed point, ticket sources, standards sources, and complete diff.
4. Verify review findings against the code. Fix confirmed issues yourself, rerun complete validation, and commit the fixes. Do not blindly implement review suggestions.
5. Spawn the configured PR subagent. Give it the branch, base, ticket list, commit summary, validation results, and instruction to read the `file-pr` skill. It may push and file the PR, but must not change implementation code or rewrite commits.
6. Verify the resulting PR metadata and return the PR URL, branch, ticket coverage, commits, validation, and any honest limitations.
