# Lesson Format

Lessons live in `./lessons/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`. A lesson teaches one tightly-scoped thing tied to the mission and should be completable in a single sitting.

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

## {The knowledge}

{The minimum needed to acquire the skill. Cite as you go - every non-obvious
claim gets a link to a source in RESOURCES.md. Link established terms with
[[wiki-links]] to the glossary and reference notes.}

## Practice

> [!question]- {A question that forces retrieval, not recognition}
> {The answer, plus one line on why.}

> [!question]- {A second question, ideally reaching back to an earlier lesson}
> {The answer.}

## Go deeper

{The single best primary source for this topic, linked, with one line on what
it covers and roughly how long it takes.}

---

> [!note] Stuck on any of this?
> Ask me. I'm your teacher for this vault - bring back anything that didn't land.
```

## Rules

- **Title by capability, not topic.** "Read an RPE score off a set" beats "RPE". The heading should name what the user can now do.
- **One win per lesson.** If the lesson has two takeaways, it is two lessons. Working memory is the binding constraint.
- **Knowledge only in service of the skill.** Interesting context that does not feed the practice section is cut, or moved to a reference note.
- **Cite everything non-obvious.** A lesson with no links is a lesson built on parametric guessing.
- **Link outward.** Every lesson should link to at least one reference note and at least one neighbouring lesson. The graph view is the map of what has been taught.
- **Questions must be self-scorable.** The user grades themselves against a folded answer, so the answer has to be specific enough that "close enough" is obvious. Avoid "explain the concept of X".
- **Reach back.** At least one practice question should test something from an earlier lesson. Spacing and interleaving are why the vault beats a pile of standalone notes.
- **Compress into reference.** After writing the lesson, ask what the user will want to look up in three months. That goes in `./reference/`, and the lesson links to it.

## Numbering

Scan `./lessons/` for the highest existing number and increment by one. Numbers are the teaching order, so never renumber an existing lesson.
