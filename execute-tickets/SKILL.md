---
name: execute-tickets
description: Use coding subagents to implement a specified range or list of tickets. Make one commit for each ticket. Complete a code review and create a pull request.
disable-model-invocation: true
---

# Execute Tickets

Run all tickets in the specified sequence. Do not stop between tickets.

The parent agent controls the work, reviews results, makes commits, and completes the integration. Subagents implement specified tickets. They do not commit or push.

## Defaults

If the user does not give different instructions, use these defaults:

- Create a new branch that follows the repository rules.
- Select the model and reasoning level for the complexity of each ticket.
- Complete the tickets in dependency order.
- Commit each accepted ticket separately.
- After all tickets are complete, use the `code-review` skill.
- Select the best model and reasoning level for each review type.
- Examine the review results in the parent session.
- Fix each problem that you find.
- Run the validation again.
- Commit the fixes.
- Use another subagent to create the pull request.
- Use a low reasoning level unless the task needs a higher level.
- Tell this subagent to read the `file-pr` skill.
- Tell this subagent to obey the `file-pr` skill.
- Do not let the pull-request subagent change implementation code.

The user instructions always replace these defaults.

## Preparation

1. Read the repository instructions and the project instructions.
2. Identify the worktree, current branch, remotes, issue tracker, package tools, and validation commands.
3. Fetch each specified ticket and its parent issue.
4. Identify the dependencies and acceptance criteria before you edit files.
5. Examine the uncommitted user changes.
6. Do not change the user work.
7. Identify the ticket that owns each change, if applicable.
8. Make the branch unless the user tells you to use the current branch.
9. Make a short execution record.
10. Include the ticket order, dependencies, status, commit, and validation result in this record.

Do not tell the user to give information that the repository, issue tracker, or user instruction supplies.

## Concurrent work

Use sequential execution by default. Use parallel execution only for dependency-independent tickets with separate file ownership.

Before parallel execution, state the ticket and file ownership for each subagent. Do not run subagents concurrently if their work can change the same files.

Shared generated files, schemas, migrations, central registries, and integration points can cause errors. Examine each result independently. Integrate each result independently.

## Subagent liveness

A subagent that is thinking is not necessarily a subagent that has failed. High reasoning levels produce long stretches with no file writes and no visible output. Treat only the absence of agent activity as evidence of failure.

Use the agent activity stream and the agent list as the liveness signal. A subagent is alive while it is still running, whatever it has or has not written yet.

Do not use these as evidence of failure:

- No file written yet.
- No reply to a status message. A busy subagent cannot process an incoming message until its current turn ends, so an unanswered ping is expected, not a symptom.
- Silence between tool calls.
- A long single reasoning stretch.

Give each subagent a first-output budget before you judge it. Measure from the spawn, and count any tool call as output:

Interrupt a subagent only when one of these is true:

- No agent activity at all for the budget above.
- The turn ends with an error or with no result.
- The subagent reports a blocker.
- Its work conflicts with another subagent or with user changes.

Apply the full budget to every retry. Do not shorten the budget after an interruption. Two short interruptions are not evidence that a model is unusable.

Before you call a model unusable, confirm from the transcript that it produced no tool calls within its budget. If it was interrupted before the budget, the interruption is the failure, not the model.

Keep the model and reasoning level the user requested. If you want to change either, report what you observed and ask first.

## Ticket execution

For each ticket:

1. Read the issue again against the most recent commit.
2. Examine the applicable code, documentation, and changes from previous tickets.
3. Start a new coding subagent.
4. Give the subagent a prompt that contains all necessary information.
5. Include this information in the prompt:
   - The repository path, branch, and prerequisite commits
   - The exact ticket
   - An instruction not to implement later tickets
   - Instructions to fetch the issue and its parent issue
   - The repository guidance and the necessary files or skills
   - The acceptance criteria, constraints, existing extension points, and known user changes
   - The focused tests and repository validation
   - The instruction, `Do not commit or push`
   - A report of changed files, design, acceptance coverage, validation, and information that is not clear.
6. Monitor the subagent as described in "Subagent liveness".
7. Continue useful inspection while the subagent runs.
8. Examine the diff and tests.
9. Compare the result with each acceptance criterion.
10. Check the scope.
11. Examine the repository status.
12. Run the applicable validation independently.
13. If the work has defects, send the same subagent a specified revision prompt.
14. State the defect and the necessary result.
15. Do not ask the subagent to examine all work again.
16. Commit only after the implementation and validation pass.
17. Follow the repository commit rules.
18. Keep the commit limited to that ticket.
19. Update the execution record.
20. Continue immediately to the next ticket that is not blocked.

Do not stop after a ticket. Pause for a blocker, a decision that can cause damage, requirements that do not agree, or a necessary user action.

## Final integration

1. Run the complete repository validation suite.
2. Run `git diff --check`.
3. Make sure that the specified ticket set is complete.
4. Make sure that each ticket has one commit that only contains work for that ticket.
5. Load the `code-review` skill.
6. Obey the `code-review` skill.
7. Use the configured review agents for the Standards review and the Spec review.
8. Give them the fixed Git reference, ticket sources, standards sources, and complete diff.
9. Check each review result against the code.
10. Fix the confirmed problems in the parent session.
11. Run the complete validation again.
12. Commit the fixes.
13. Start the configured pull-request subagent.
14. Give it the branch, base, ticket list, commit summary, and validation results.
15. Tell it to read the `file-pr` skill.
16. Tell it to obey the `file-pr` skill.
17. Tell it that it can push the branch.
18. Tell it that it can create the pull request.
19. Do not let it change implementation code.
20. Do not let it rewrite commits.
21. Check the pull-request metadata.
22. Give the pull-request URL, branch, ticket coverage, commits, validation, and all known limits.
