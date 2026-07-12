---
name: code-review
description: Run adversarial code, plan, or PR reviews with exactly one reviewer subagent. Use when the user asks for code review, adversarial review one reviewer, one subagent review, solo review, non-parallel review.
---

# Single Review

Run one focused `reviewer` subagent, then synthesize its findings. Use a fresh-context reviewer by default so it inspects the repo, instructions, target, and diff directly instead of inheriting the main conversation.

## Workflow

1. Identify the review target from the user request. If none is given, use the current work/current diff. If the request names a URL, issue, file, plan, branch range, or freeform focus, inspect that target before selecting the review angle and pass it to the reviewer.
2. If the user names an angle for the review, use that. For broad requests, prefer correctness and regressions, with tests and maintainability as secondary concerns inside the same review.
3. Spawn exactly one `reviewer` subagent. Set `fork_context=false` unless the user explicitly asks for forked context. 
4. In the subagent prompt, name the angle, repository path, target/diff scope, and output contract. Tell it to use read-only analysis and not edit files.
5. Wait for the reviewer. Rank findings.
6. Return:
   - fixes worth doing now
   - optional improvements
   - feedback to ignore or defer, with short reasons
7. If you use timeouts, make sure it is long enough for the reveiwer subagent to finish. Because most reviews will take very long. Around 600,000 ms or more.

Do not blindly apply every reviewer suggestion.

## Reviewing angle
### Coding standards: does the code conform to this repo's documented coding standards, if any.
Anything in the repo that documents how code should be written, or a project-level skill such as `CODING_STANDARDS.md`, `CONTRIBUTING.md` or a skill under `.agents/skills`, `.codex/skills` or `.claude/skills`.

On top of whatever the repo documents, the Standards axis always carries the smell baseline below — a fixed set of Fowler code smells (Refactoring, ch.3) that applies even when a repo documents nothing. Two rules bind it:

The repo overrides. A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
Always a judgement call. Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.
Each smell reads what it is → how to fix; match it against the diff:

- Mysterious Name — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- Duplicated Code — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- Feature Envy — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- Data Clumps — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- Primitive Obsession — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- Repeated Switches — the same switch/if-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- Shotgun Surgery — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- Divergent Change — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- Speculative Generality — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- Message Chains — long a.b().c().d() navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- Middle Man — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- Refused Bequest — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### Match intention: does the code faithfully implement the originating issue / PRD / spec?
- Look for the originating spec, github issue, ticket, plan, etc. It will probably be mentioned, but if not, look for it.
- If nothing is found, skip this part saying "No spec available".

## Autofix

If the user includes the exact word `autofix`, treat it as workflow control, not review scope. Remove it before deciding the target. After synthesis, apply only fixes worth doing now, validate, and summarize. Do not apply optional improvements unless explicitly requested. If there are no fixes worth doing now, do not edit.

Without autofix, ask before applying fixes unless the user already told to address review feedback. End with:

```text
Reply with [1], [2], or further instructions:
[1] Apply only the fixes worth doing now.
[2] Apply the fixes worth doing now plus optional improvements.
```
