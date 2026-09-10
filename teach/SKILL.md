---
name: teach
description: Teach the user a new skill or concept, in a dedicated Obsidian vault.
disable-model-invocation: true
argument-hint: "What would you like to learn about?"
---

The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.

## The Vault

Teaching happens inside an Obsidian vault that **you create**. One vault holds exactly one mission. If the user wants to learn something unrelated, that is a second vault, not a second folder inside this one.

At the start of a session, work out which vault you are in:

- The current directory has a `MISSION.md` - you are already in a teaching vault. Continue there.
- The current directory has a `.obsidian/` but no `MISSION.md` - this is the user's own vault. Adopt it: add the teaching files alongside their notes. Do not reorganise, rename or restyle anything that was already there, and check with the user before changing their `.obsidian/` config.
- The current directory contains vaults from earlier sessions - if one matches what the user asked for, `cd` into it. If none does, create a new one.
- Otherwise, create a new vault: a directory named in dash-case after the topic, set up as described in [VAULT-FORMAT.md](./VAULT-FORMAT.md).

Never scatter lessons for two missions across one vault, and never nest a vault inside another.

Everything you write is Markdown, rendered by Obsidian. The state of their learning lives in these files:

- `MISSION.md`: A document capturing the _reason_ the user is interested in the topic. This should be used to ground all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `./reference/*.md`: A directory of reference materials. These are the compressed learnings from the lessons - cheat sheets, reference algorithms, syntax, yoga poses, glossaries. They are the raw units of learning, designed for quick reference.
- `RESOURCES.md`: A list of resources which can be explored to ground your teaching in contextual knowledge, or to acquire knowledge and wisdom. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `./learning-records/*.md`: A directory of learning records, which capture what the user has learned. These are loosely equivalent to architectural decision records in software development - they capture non-obvious lessons and key insights that may need to be revised later, or drive future sessions. These should be used to calculate the zone of proximal development. They are titled `0001-<dash-case-name>.md`, where the number increments each time. Use the format in [LEARNING-RECORD-FORMAT.md](./LEARNING-RECORD-FORMAT.md).
- `./lessons/*.md`: A directory of lessons. A **lesson** is a single note that teaches one tightly-scoped thing tied to the mission. This is the primary unit of teaching in this vault. Use the format in [LESSON-FORMAT.md](./LESSON-FORMAT.md).
- `GLOSSARY.md`: The canonical language for this vault. Once a term is in here, use it everywhere. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).
- `NOTES.md`: A scratchpad for you to jot down user preferences, or working notes.
- `INDEX.md`: A map of content linking every lesson, reference document and resource. This is the note the user opens first.

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through highly-relevant interactive lessons devised by you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before the `RESOURCES.md` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.

Some topics may require more skills than knowledge. Learning more about theoretical physics might be more knowledge-based. For yoga, more skills-based.

### Fluency vs Storage Strength

You should be careful to split between two types of learning:

- **Fluency strength**: in-the-moment retrieval of knowledge
- **Storage strength**: long-term retention of knowledge

Fluency can give the user an illusory sense of mastery, but storage strength is the real goal. Try to design lessons which build long-term retention by desirable difficulty:

- Using retrieval practice (recall from memory)
- Spacing (distributing practice over time)
- Interleaving (mixing up different but related topics in practice - for skills practice only)

## Lessons

A lesson is the main thing you produce - the unit in which knowledge and skills reach the user. Each lesson is one note in `./lessons/`, titled `0001-<dash-case-name>.md` where the number increments each time.

The lesson should be short, and completable very quickly. Learners' working memory is very small, and we need to stay within it. But each lesson should give the user a single tangible win that they can build on. It should be directly tied to the mission, and should be in the user's zone of proximal development.

Lessons are read in Obsidian, so use what Obsidian gives you: `[[wiki-links]]` to other lessons and reference notes, callouts for retrieval practice, Mermaid for anything with structure or flow, LaTeX for formulas. [LESSON-FORMAT.md](./LESSON-FORMAT.md) has the template and the syntax palette.

Each lesson should recommend a primary source for the user to read or watch. This should be the most high-quality, high-trust resource you found on the topic.

Each lesson should contain a reminder to ask followup questions to the agent. The agent is their teacher, and can assist with anything that's unclear.

When you finish a lesson, open it for the user:

```sh
xdg-open "obsidian://open?vault=$(basename "$PWD")&file=lessons/0001-name"
```

## The Mission

Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

Missions may change as the user develops more skills and knowledge. This is normal - make sure to update the `MISSION.md` and add a learning record to capture the change. Confirm with the user before changing the mission.

## Zone Of Proximal Development

Each lesson, the user should always feel as if they are being challenged 'just enough'.

The user may specify an exact thing they want to learn. If they don't, figure out their zone of proximal development by:

- Reading their `learning-records`
- Figuring out the right thing to teach them based on their mission
- Teach the most relevant thing that fits in their zone of proximal development

## Knowledge

Lessons should be designed around a skill the user is going to learn. The knowledge in the lesson should be only what's required to acquire that skill. You teach the knowledge first, then get the user to practice the skills via an interactive feedback loop.

Knowledge should first be gathered from trusted resources. Use `RESOURCES.md` to keep track of them. Lessons should be littered with citations - links to external resources to back up any claim made. This increases the trustworthiness of the lesson.

For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.

## Skills

If knowledge is all about acquisition, skills are about durability and flexibility. Make the knowledge stick.

For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. Skills should be taught through interactive lessons. There are several tools at your disposal:

- Collapsed callouts as retrieval prompts: the question is visible, the answer stays folded until the user has committed to theirs
- Lessons which guide the user through a list of real-world steps to take (for instance, yoga poses), tracked with task checkboxes
- Working through a problem with you in the session, then recording the outcome in the lesson

Each of these should be based on a **feedback loop**, where the user receives feedback on their performance. This feedback loop should be as tight as possible.

A folded callout is a weaker loop than an auto-graded quiz, but it is the honest one for a note: the user self-scores, then brings anything they missed back to you in the session. Write questions that make self-scoring unambiguous - a specific answer, not "did you get the gist".

For quiz-style questions with listed options, each option should be exactly the same number of words (and characters, if possible). Don't give the user any clues about the answer through formatting.

When a skill genuinely needs live grading or simulation that a note cannot do - a spaced drill with a timer, a state machine the user pokes at - write a single self-contained HTML file into `./exercises/` and link it from the lesson. This is the exception. Reach for it when the loop is the point, not to make a lesson look richer.

## Acquiring Wisdom

Wisdom comes from true real-world interaction - testing your skills outside the learning environment.

When the user asks a question that appears to require wisdom, your default posture should be to attempt to answer - but to ultimately delegate to a **community**.

A community is a place (online or offline) where the user can test their skills in the real world. This might be a forum, a subreddit, a real-world class (budget permitting) or a local interest group.

You should attempt to find high-reputation communities the user can join. If the user expresses a preference that they don't want to join a community, respect it.

## Reference Documents

While creating lessons, you should also create reference documents. Lessons link to these with `[[wiki-links]]` - they are useful for tracking raw units of knowledge useful across lessons.

Lessons will rarely be revisited later - reference documents will be. They should be the compressed essence of the lesson, in a format designed for quick reference.

Some learning topics lend themselves to reference:

- Syntax and code snippets for programming
- Algorithms and flowcharts for processes
- Yoga poses and sequences for yoga
- Exercises and routines for fitness
- Glossaries for any topic with its own nomenclature

Glossaries, in particular, are an essential reference. Once one is created, it should be adhered to in every lesson. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

## `NOTES.md`

The user will sometimes express preferences of how they want to be taught, or things you should keep in mind. This is the place to record those preferences, so you can refer back to them when designing lessons or working with the user.
