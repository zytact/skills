# Lesson Format

Lessons live in `./lessons/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`. A lesson teaches one tightly-scoped skill tied to the mission. It is made of **parts**, each one turn of the teaching loop in [SKILL.md](./SKILL.md), and grows by one part each time you teach one.

The syntax palette - callouts, Mermaid, LaTeX, wiki-links - is in [VAULT-FORMAT.md](./VAULT-FORMAT.md).

## Template

```md
---
tags: [lesson]
created: {YYYY-MM-DD}
---

# {What the user will be able to do}

> [!tip] The win
> {One sentence: the tangible thing the user can do after this lesson.}

## Part 1: {the idea}

{Numbered steps: worked example, then visual, then the rule. Cite as you go -
every non-obvious claim gets a link to a source in RESOURCES.md. Link
established terms with [[wiki-links]] to the glossary and reference notes.}

[Open the stepper](exercises/0001-part-1-stepper.html)

> [!question]- {A question that forces retrieval, not recognition}
> {The answer, plus one line on why.}

## Part 2: {the idea}

{...}

## Go deeper

{The single best primary source for this topic, linked, with one line on what
it covers and roughly how long it takes.}

---

> [!note] Stuck on any of this?
> Ask me. I'm your teacher for this vault - bring back anything that didn't land.
```

## Rules

- **Title by capability, not topic.** "Read an RPE score off a set" beats "RPE". The heading should name what the user can now do.
- **One win per lesson, one idea per part.** If a part has two takeaways, it is two parts. Working memory is the binding constraint.
- **Knowledge only in service of the skill.** Interesting context that does not feed the questions is cut, or moved to a reference note.
- **Cite everything non-obvious.** A lesson with no links is a lesson built on parametric guessing.
- **Keep the explanation that worked.** When a re-explanation, analogy or visual lands after the first try missed, it replaces the first try. The lesson is what the user rereads before the next review.
- **Questions keep their answers folded**, so the lesson doubles as self-review.

## Finishing a lesson

Once every part is taught:

1. Add `## Go deeper` and the closing note.
2. Link at least one neighbouring lesson and one reference note. The graph view is the map of what has been taught.
3. Compress into reference: ask what the user will want to look up in three months. That goes in `./reference/`, and the lesson links to it.

## Numbering

Scan `./lessons/` for the highest existing number and increment by one. Numbers are the teaching order, so never renumber an existing lesson.
