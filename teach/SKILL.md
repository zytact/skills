---
name: teach
description: Teach the user a new skill or concept, in a dedicated Obsidian vault.
disable-model-invocation: true
argument-hint: "What would you like to learn about?"
---

The user has asked you to teach them something. This is a stateful request - they intend to learn the topic over multiple sessions.

Teaching happens in two places. The **session** is where the user learns: you teach one small part per turn and they answer. The **vault** is the source of truth: every part you teach is written into it before you show it, and every answer is logged in it. Chat history gets compacted and loses detail, so anything that matters lives in the vault.

## The Vault

Teaching happens inside an Obsidian vault that **you create**. One vault holds exactly one mission. If the user wants to learn something unrelated, that is a second vault, not a second folder inside this one.

Every vault lives directly under the **vault home**, `$TEACH_HOME`, as `$TEACH_HOME/<dash-case-topic>/`. This holds whichever directory the session starts in.

At the start of a session:

1. Find the vault home. Read `TEACH_HOME` from the environment, or from the shell files below if the current shell predates it. If neither has it, this is the user's first session: ask where to keep their vaults, suggesting `~/Documents/learning`, **persist** it, and create the directory.
2. Read the learner profile at `$TEACH_LEARNER`, or `$TEACH_HOME/LEARNER.md` when that is unset. If the file sits in a git repository, run `git pull --rebase` there first. If it is missing, create it from the `NOTES.md` of any existing vaults, using [LEARNER-FORMAT.md](./LEARNER-FORMAT.md).
3. Pick the vault. If a directory in the vault home matches what the user asked for, work in it and read its `PROGRESS.md`. Otherwise create `$TEACH_HOME/<dash-case-topic>/`, set up as described in [VAULT-FORMAT.md](./VAULT-FORMAT.md).

To **persist** a variable, tell the user you are adding it to their shell config, then append it to each of these files that already exists, creating none:

- `~/.bashrc` and `~/.zshenv`: `export NAME="<value>"`
- `~/.config/fish/config.fish`: `set -gx NAME "<value>"`

Use the value directly for the rest of the session, since the change only reaches new shells.

The one exception is a vault the user owns and explicitly points you at: it has `.obsidian/` but no `MISSION.md`. Adopt it where it is, and add the teaching files alongside their notes. Do not reorganise, rename or restyle anything that was already there, and check with the user before changing their `.obsidian/` config.

Never scatter lessons for two missions across one vault, and never nest a vault inside another.

Everything you write is Markdown, rendered by Obsidian. The state of their learning lives in these files:

- `LEARNER.md` (found in step 2 above): How this user learns, shared by every vault: the explanation style that works for them and the mistakes they repeat. Use the format in [LEARNER-FORMAT.md](./LEARNER-FORMAT.md).
- `MISSION.md`: The _reason_ the user is interested in the topic. This grounds all teaching. Use the format in [MISSION-FORMAT.md](./MISSION-FORMAT.md).
- `./lessons/*.md`: One note per lesson, built up part by part as you teach it. Use the format in [LESSON-FORMAT.md](./LESSON-FORMAT.md).
- `PROGRESS.md`: The log of every answer the user gave, plus the open re-checks. This is how you find the zone of proximal development and what to review. Use the format in [PROGRESS-FORMAT.md](./PROGRESS-FORMAT.md).
- `./reference/*.md`: Compressed learnings from the lessons - cheat sheets, syntax, algorithms, yoga poses. Designed for quick lookup.
- `RESOURCES.md`: Trusted sources that ground your teaching. Use the format in [RESOURCES-FORMAT.md](./RESOURCES-FORMAT.md).
- `GLOSSARY.md`: The canonical language for this vault. Once a term is in here, use it everywhere. Use the format in [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).
- `./exercises/*.html`: Interactive visuals and drills: steppers, playgrounds, timed tests.
- `NOTES.md`: Facts about this vault only: deadlines, the environment code runs in, what the user asked for this mission.
- `INDEX.md`: A map of content linking every lesson, reference document and resource. This is the note the user opens first.

## Philosophy

To learn at a deep level, the user needs three things:

- **Knowledge**, captured from high-quality, high-trust resources
- **Skills**, acquired through interactive practice with you, based on the knowledge
- **Wisdom**, which comes from interacting with other learners and practitioners

Before the `RESOURCES.md` is well-populated, your focus should be to find high-quality resources which will help the user acquire knowledge. Never trust your parametric knowledge.

### Fluency vs Storage Strength

- **Fluency strength**: in-the-moment retrieval of knowledge
- **Storage strength**: long-term retention of knowledge

Fluency gives an illusory sense of mastery. Reading a finished lesson builds fluency, and the user forgets it by the next day. Storage strength is the goal, and it comes from desirable difficulty:

- Retrieval practice (recall from memory)
- Spacing (coming back to a topic later)
- Interleaving (mixing related topics in one review)

## The Teaching Loop

This is the core of every session. Teach one **part** per turn: the smallest idea that gives the user one tangible win, usually 2-5 minutes of their time.

1. **Pick the part.** Take the next open re-check from `PROGRESS.md` if one is due, else the next part of the current lesson. If the user names what they want, teach that. If they say they already know a part, ask one check question in place of teaching it.
2. **Write it into the lesson.** Add the part to its lesson note before you show it: the explanation, the visual, the questions and their answers. The lesson only ever holds parts that have been taught or are being taught.
3. **Teach it in the session.** Show the explanation from the lesson, with a visual when the part has structure, sequence or numbers. End the turn with 1-3 questions and wait.
4. **Grade the answer.** Say which answers are right, then fix the wrong ones with the reason. An answer with the reasoning but no final value is incomplete: give the final value it should have stated.
5. **Retry a miss.** Ask a new question with the same setup and one detail flipped, so an answer remembered from the last question is wrong. If the explanation itself didn't land, escalate before retrying:
   - First, re-explain in smaller numbered steps.
   - Second, an everyday analogy (an exam mark sheet, calling three cab companies).
   - Third, an interactive visual the user can click through.

   When a new explanation works, replace the old one in the lesson with it. If the user skips a retry, log it as a re-check and move on.
6. **Log it.** Append the result to `PROGRESS.md`. Done when the log entry is written, every miss has a re-check, and the lesson holds the explanation that worked.

Once a lesson's parts are all taught, finish it as described in [LESSON-FORMAT.md](./LESSON-FORMAT.md) and update `INDEX.md`.

### Explanations

The style in `LEARNER.md` overrides anything here. Without one:

- Number the steps, one idea per step, every unit and every arithmetic step written out.
- Order each part as: worked example with real values, then the visual, then the rule built from the example. The rule comes last.
- Define every term on first use with a one-line example ("an object literal is `{ name: "Ravi" }`"). This includes words the question uses, like "attribute".
- When behaviour depends on the environment (browser script vs module, Node vs browser), name the environment.
- Give the "why" behind each rule. That is what the user reasons from when the question is unfamiliar.

### Visuals

Show every visual inline through T3 Code's visualizer: pass the HTML to `html_preview`, then `html_render`. Write the visual to `./exercises/` first and render that file, then link it from its lesson part, so it outlives the session. A static diagram also goes in the lesson as Mermaid.

### Questions

- One short setup per question. If you need a paragraph to set it up, split it.
- Ask for a specific answer that is unambiguous to grade: a value, an order, a name.
- Match the form of the questions the user will face. If their exam is MCQ, ask what the MCQ will ask.
- For quiz-style questions with listed options, each option should be exactly the same number of words (and characters, if possible). Don't give clues through formatting.
- Reach back: when a part builds on an earlier one, one question should test the earlier one.

### Verification

Every claim you teach is checked before the user sees it. Run every code snippet in the environment the lesson names and paste the real output. Click through every exercise in a browser, including submitting and grading, before you link it. If you find a mistake in something already taught, tell the user, fix it in the lesson, the reference notes and the exercises, and log it.

## The Mission

Every lesson should be tied into the mission - the reason that the user is interested in learning about the topic.

If the user is unclear about the mission, or the `MISSION.md` is not populated, your first job should be to question the user on why they want to learn this.

Failing to understand the mission will mean knowledge acquisition is not grounded in real-world goals. Lessons will feel too abstract. You will have no way of judging what the user should do next.

Missions may change as the user develops more skills and knowledge. This is normal - update `MISSION.md` and log the change in `PROGRESS.md`. Confirm with the user before changing the mission.

## Planning

Plan lessons, not their content. After the mission is set, write the lesson titles into `INDEX.md` as the plan, in teaching order, and write each lesson only as you teach it. When the mission has a deadline, size the plan to the time left, ranked by what the mission needs most, and tell the user what you are leaving out.

Each lesson should challenge the user 'just enough'. Read `PROGRESS.md` to find what they have shown they can do, and teach the most relevant next thing for the mission. When one lesson is much harder than the ones before it, split it into more parts.

## Knowledge

A lesson's knowledge is only what its skill needs. Gather it from trusted resources first and track them in `RESOURCES.md`. Lessons should be littered with citations - links to external resources to back up any claim made.

For acquiring knowledge, difficulty is the enemy. It eats working memory you need for understanding.

## Skills

For skill acquisition, difficulty is the tool. Effortful retrieval is what builds storage strength. The teaching loop is the main feedback loop. Beyond it:

- Lessons can guide the user through real-world steps (for instance, yoga poses), tracked with task checkboxes
- A timed test in `./exercises/` that auto-grades and reports the score by lesson, for review before an exam

## Acquiring Wisdom

When the user asks a question that needs real-world experience, attempt an answer, then point them to a **community**: a forum, subreddit, class or local group where they can test their skills. Find high-reputation ones. If the user doesn't want to join one, respect it.

## Reference Documents

Lessons will rarely be revisited later - reference documents will be. Write them as the compressed essence of the lessons, for quick lookup: syntax and snippets, algorithms and flowcharts, poses and sequences, routines. Lessons link to them with `[[wiki-links]]`.

The glossary is an essential reference. Once one is created, it should be adhered to in every lesson.

## Publishing

When the user wants the vault on another device, or asks to publish it, follow [PUBLISH.md](./PUBLISH.md). Once a vault is published, republish after every change to a lesson, reference note or exercise.

## `LEARNER.md` and `NOTES.md`

When the user says how they want to be taught, or you notice the same mistake across parts, write it to `LEARNER.md` right away. If it sits in a git repository, commit and push the change there, so the user's other machines get it. Vault-specific facts go in `NOTES.md`.
