````md
---
name: code-review
description: Review changes since a fixed point such as a commit, branch, tag, or merge-base along two separate axes. Standards checks whether the code follows the repo's documented coding standards. Spec checks whether the code matches the originating issue or spec. Run both reviews in parallel sub-agents and report them separately. Use when the user wants to review a branch, PR, work-in-progress changes, or asks to "review since X".
---

Review the diff between `HEAD` and a fixed point supplied by the user along two axes:

- **Standards** checks whether the code follows the repo's documented coding standards.
- **Spec** checks whether the code implements what the originating issue or spec asked for.

Run the two reviews in parallel sub-agents so their reasoning stays independent. Aggregate the results without merging or reranking them.

The issue tracker should already be configured.

## Process

### 1. Pin the fixed point

Use whatever the user supplied as the fixed point. It may be a commit SHA, branch, tag, `main`, `HEAD~5`, or another valid Git ref.

If the user did not provide one, ask for it.

Use this diff:

```sh
git diff <fixed-point>...HEAD
```
````

The three-dot form compares `HEAD` against the merge-base.

Also capture the commits:

```sh
git log <fixed-point>..HEAD --oneline
```

Before continuing:

1. Check that the ref resolves with `git rev-parse <fixed-point>`.
2. Check that the diff is not empty.

Fail here if the ref is invalid or there is nothing to review. Do not leave either problem for the sub-agents to discover.

### 2. Find the spec

Look for the originating spec in this order:

1. Issue references in commit messages such as `#123`, `Closes #45`, or GitLab `!67`. Fetch them using `docs/agents/issue-tracker.md`.
2. A spec path supplied by the user.
3. A matching spec under `docs/`, `specs/`, or `.scratch/`, using the branch name or feature as a clue.
4. If none exists, ask the user where the spec is.

If the user says there is no spec, skip the Spec sub-agent and report `no spec available`.

### 3. Find the standards

Find files in the repo that describe how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

The Standards review also uses the smell baseline below, even when the repo has no written standards.

Two rules apply:

- **Repo rules win.** If a documented repo standard explicitly allows something the baseline would flag, do not report the smell.
- **Smells are judgement calls.** Label every smell as a heuristic, such as `possible Feature Envy`. Never report one as a hard violation.

Skip checks that existing tooling already enforces.

Use this baseline against the diff:

- **Mysterious Name.** A function, variable, or type name does not explain what it does or contains. Rename it. If no accurate name is obvious, the design may need work.
- **Duplicated Code.** The same logic appears in multiple hunks or files. Extract the shared logic and call it from both places.
- **Feature Envy.** A method works with another object's data more than its own. Consider moving the method to the object whose data it uses.
- **Data Clumps.** The same group of fields or parameters repeatedly travels together. Consider grouping them into a type.
- **Primitive Obsession.** A primitive or string represents a domain concept that would benefit from its own type.
- **Repeated Switches.** The same `switch` or `if` cascade over the same kind of value appears more than once. Consider polymorphism or a shared lookup.
- **Shotgun Surgery.** One logical change requires edits across many unrelated files. Consider moving the related behavior into one module.
- **Divergent Change.** One file or module changes for several unrelated reasons. Consider splitting those responsibilities.
- **Speculative Generality.** The change adds abstractions, parameters, or hooks that the spec does not need. Remove them until a real requirement appears.
- **Message Chains.** Code contains long navigation chains such as `a.b().c().d()`. Consider hiding the traversal behind a method on the first object.
- **Middle Man.** A class or function mostly forwards calls elsewhere. Consider removing it and calling the real target directly.
- **Refused Bequest.** A subclass or implementation ignores or replaces most inherited behavior. Consider composition instead of inheritance.

### 4. Spawn both sub-agents in parallel

Run the Standards and Spec sub-agents at the same time.

#### Standards sub-agent

Give it:

- The full diff command.
- The commit list.
- Every standards file found in step 3.
- The complete smell baseline from step 3. Paste it into the prompt because the sub-agent does not otherwise have access to it.

Use this brief:

> Review the diff against the supplied repo standards and smell baseline.
>
> For each relevant file or hunk, report:
>
> 1. Every documented standard the diff violates. Cite the standards file and rule.
> 2. Any baseline smell you find. Name the smell and quote the relevant hunk.
>
> Separate hard violations from judgement calls. A documented standards breach may be a hard violation. Baseline smells are always judgement calls. Repo standards override the smell baseline.
>
> Skip anything existing tooling already enforces.
>
> Stay under 400 words.

#### Spec sub-agent

Give it:

- The full diff command.
- The commit list.
- The spec path or fetched spec contents.

Use this brief:

> Review the diff against the supplied spec.
>
> Report:
>
> 1. Requirements that are missing or only partially implemented.
> 2. Behavior added by the diff that the spec did not request.
> 3. Requirements that appear implemented but whose implementation looks incorrect.
>
> Quote the relevant spec line for every finding.
>
> Stay under 400 words.

If no spec exists, do not spawn this sub-agent.

### 5. Aggregate

Present the reports under these headings:

```md
## Standards

...

## Spec

...
```

Keep each report verbatim or make only minor cleanup edits.

Do not merge findings from the two axes. Do not rerank them against each other.

Finish with one line containing:

- The number of findings on each axis.
- The worst Standards finding, if there is one.
- The worst Spec finding, if there is one.

Do not choose one overall worst finding.

## Why two axes

A change can succeed on one axis and fail on the other.

Code may follow every project standard while implementing the wrong behavior. That is a Standards pass and a Spec fail.

Code may implement the requested behavior correctly while breaking the project's conventions. That is a Spec pass and a Standards fail.

Keeping the reports separate prevents one kind of correctness from hiding problems in the other.

```

```
