---
name: single-review
description: Run adversarial code, plan, or PR reviews with exactly one Codex reviewer subagent. Use when the user asks for single review, one reviewer, one subagent review, solo review, non-parallel review, or a lighter version of the parallel-review workflow in Codex.
---

# Single Review

Run one focused `reviewer` subagent, then synthesize its findings. Use a fresh-context reviewer by default so it inspects the repo, instructions, target, and diff directly instead of inheriting the main conversation.

## Workflow

1. Identify the review target from the user request. If none is given, use the current work/current diff. If the request names a URL, issue, file, plan, branch range, or freeform focus, inspect that target before selecting the review angle and pass it to the reviewer.
2. Choose one review angle from the work. If the user names an angle, use that. For broad requests, prefer correctness and regressions, with tests and maintainability as secondary concerns inside the same review.
3. Spawn exactly one `reviewer` subagent. Set `fork_context=false` unless the user explicitly asks for forked context. The custom `reviewer` agent is expected at `~/.codex/agents/reviewer.toml` and should be pinned to `gpt-5.4` with high reasoning.
4. In the subagent prompt, name the angle, repository path, target/diff scope, and output contract. Tell it to use read-only analysis and not edit files.
5. While the reviewer runs, do only narrow parent inspection if useful. Do not duplicate all reviewer work.
6. Wait for the reviewer. Rank findings.
7. Return:
   - fixes worth doing now
   - optional improvements
   - feedback to ignore or defer, with short reasons

Do not blindly apply every reviewer suggestion.

## Angle Selection

Use or adapt these examples:

- Correctness and regressions: request satisfaction, preserved behavior, edge cases, runtime failures.
- Tests and validation: right test layer, meaningful assertions, enough verification commands.
- Simplicity and maintainability: unnecessary complexity, duplication, brittle abstractions, confusing names, cleanup worth doing.
- TypeScript-heavy changes: type safety, source-of-truth types, casts, error-boundary discipline.
- UI-heavy changes: UX, accessibility, copy, visual quality, responsive behavior.
- Security-sensitive changes: unsafe input/output handling, auth boundaries, privacy, data exposure.
- Docs-heavy changes: clarity, accuracy, completeness, reader flow, non-robotic prose.
- Large multi-file changes: structural friction, module boundaries, testability.

## Reviewer Prompt Shape

Use this shape for the subagent:

```text
Fresh-context adversarial review. Do not rely on the parent conversation.
Repo: <absolute repo path>
Target/scope: <current diff, branch range, PR, issue, file, plan, or focus>
Angle: <specific angle>

Inspect repository instructions and relevant files directly. Start with git status/diff/log or the named target as appropriate.
Use read-only analysis. Do not edit files.
Return concise, evidence-backed review findings only, not a context summary.
For each finding include severity, file/line refs when applicable, why it matters, and a suggested fix.
If there are no actionable findings for this angle, say so plainly.
```

## Autofix

If the user includes the exact word `autofix`, treat it as workflow control, not review scope. Remove it before deciding the target. After synthesis, apply only fixes worth doing now, validate, and summarize. Do not apply optional improvements unless explicitly requested. If there are no fixes worth doing now, do not edit.

Without autofix, ask before applying fixes unless the user already told Codex to address review feedback. End with:

```text
Reply with [1], [2], or further instructions:
[1] Apply only the fixes worth doing now.
[2] Apply the fixes worth doing now plus optional improvements.
```
