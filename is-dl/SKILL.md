---
name: is-dl
description: Drive the is-dl CLI to scrape LinkedIn and Unstop listings, filter out unpaid roles and ones already applied to or already shown, judge fit by reading descriptions, keep the documents and notes attached to a job, and build a tailored one-page resume PDF. Use when asked to find jobs or internships, triage scraped listings, save a hiring doc or note about a role, log an application, or build a resume variant.
disable-model-invocation: true
---

# is-dl

`is-dl` searches LinkedIn and Unstop, filters listings on facts, tracks what has been applied to, keeps the text attached to a job, and builds tailored resume PDFs. It never submits an application. Search, filter, log, build a PDF. A human presses send.

Every command takes `--json`, which puts one JSON document on stdout and all logs on stderr. Always pass it. Parse stdout only.

## Exit codes

| Code | Meaning | What to do |
| ---- | ------- | ---------- |
| 0 | ok | continue |
| 1 | error | read the message |
| 2 | usage | fix the flags |
| 3 | auth | stop and ask the human to run `is-dl login` |
| 4 | dependency | run `npx playwright install chromium` |
| 5 | aborted | the run was cancelled |
| 6 | config | fix the config file or profile name |

Exit 3 and 4 need a human or a one-line fix. Never retry them in a loop.

Both concern LinkedIn. In a default two-source search they surface inside `meta.sources[]` instead of as an exit code, because Unstop still succeeded.

Run `is-dl doctor --json` first if anything looks wrong. It reports node, playwright, the browser, the session and the resolved paths.

## Sources

`search` queries LinkedIn and Unstop together by default. `--source linkedin`, `--source unstop` or a comma-separated subset scopes it.

**Exit 0 does not mean every source ran.** One board failing is normal rather than an error: LinkedIn needs a stored session, Unstop needs none, so a machine that never ran `is-dl login` still returns Unstop results and exits 0. Read `meta.sources[]` before trusting a count.

```json
"sources": [
  { "source": "linkedin", "status": "failed", "count": 0, "error": "No LinkedIn session. Run: is-dl login" },
  { "source": "unstop", "status": "ok", "count": 8, "error": null }
]
```

Tell the human when a board was skipped. A shortlist drawn from one board while implying both is worse than a short one.

`--limit` is per source, not a total. Runs recorded before Unstop have `meta.source` and no `meta.sources[]`.

### Unstop

No auth, no browser, one HTTP request. It answers in about a second.

`--unstop-roles` is what makes it useful. Sales, Business Development and Customer Support dominate the corpus and software development is around 6% of it, so a developer search without role slugs returns mostly sales.

```bash
is-dl search -k developer --source unstop \
  --unstop-roles software-development,frontend-development,backend-development,full-stack-development \
  --json
```

`--unstop-opportunity` picks the corpus: `jobs`, `internships`, `hackathons`, `competitions`. They are separate sets rather than filters over one set, and student roles concentrate in `internships`.

The live corpus carries test listings, for example rows titled "DO NOT REGISTER" from "Unstop Testing". Drop them.

## Finding listings

```bash
is-dl search -k "backend developer intern" -l "Remote" --limit 50 \
  --remote-only --experience-level Internship \
  --exclude-unpaid --exclude-applied --exclude-seen --json
```

Three filters, three different questions:

- `--exclude-unpaid` drops listings classified `unpaid` and `token`.
- `--exclude-applied` drops anything already in the application log, so what you already sent.
- `--exclude-seen` drops anything an earlier saved run already showed you, applied to or not.

`--exclude-seen` is the one to reach for when re-running a search you have run before. Without it, run five of the same query returns mostly the same listings you triaged on run one.

**`--exclude-seen` used to mean what `--exclude-applied` means now.** If you find an older script or note passing `--exclude-seen` to skip applied roles, it is asking for the wrong flag today.

### How --exclude-seen counts

Every saved run adds its jobs to a ledger, whether or not that search filtered on one. The filter runs while the sources page, so `--limit 25` yields 25 jobs you have not been shown rather than 25 rows minus whatever you saw last time. A search that returns fewer than the limit with `--exclude-seen` on has genuinely run out of new listings, not run out of rows.

The ledger only records runs that reach the run store. `-o -` and `--out <dir>` write elsewhere and are never recorded, so a run made that way stays invisible to every future `--exclude-seen`. Use plain `--json` if the run should count.

A job with no id cannot be tracked and will resurface. Reposts get fresh ids and resurface too, which is correct: a repost is a new opportunity.

Saved profiles live in config, so a repeated search is `is-dl search --profile frontend-intern --json`.

LinkedIn scraping is slow and rate-limited on purpose, around 1 to 3 seconds per listing, so a 50-listing run takes minutes and a mixed search runs at LinkedIn's pace. Do not run several searches in parallel; they share one browser and one session. LinkedIn navigation times out intermittently, so retry a failed search once or twice before reporting it as broken.

With `--exclude-seen` on, LinkedIn skips a known listing before opening it, so a repeat search is faster than the first one rather than slower. A log line reading `Giving up after 5 jobs in a row failed to open` means the page shape moved, not that the search was empty. Report that as broken instead of retrying it.

## Reading the output

Each listing carries:

- `pay: { kind, evidence, amount }` where kind is `paid`, `token`, `unpaid` or `unstated`. `evidence` is the exact matched snippet. `amount` holds figures only when the board published them as data, which Unstop does for roughly 43% of listings and LinkedIn does not. Quote them rather than trusting the label blindly.
- `locationConflict: { tagged, claimed }` when a board tags a role Remote but the body demands attendance. Never filtered, only surfaced. Always mention it.
- `source` names the board the listing came from.

`unstated` means the listing says nothing about pay. It is not a negative signal and is never filtered. Plenty of good roles omit pay.
Never just trust the tags. They may be mislabeled. So read the job description too.

## Judging fit

There is no scoring command and this is deliberate. Tag matching approximated judgment badly, so the tool does facts and the agent does judgment.

Read the descriptions. Weigh what the role actually requires against the candidate's real experience. Report a shortlist with reasons, and say plainly which ones are a stretch or a waste of time. Do not pad a shortlist to hit a number.

When reporting, lead with the role, company, pay kind and link. Flag unpaid, token and location conflicts explicitly. The most useful output is usually the listings you rejected and why.

## Past runs

```bash
is-dl runs list --json
is-dl runs show latest --json
is-dl runs rm <runId>
```

`runs rm` deletes the run file. It does not unrecord that run's jobs, so they stay filtered by `--exclude-seen`. Removing a run to make its listings show up again does not work.

## Application log

Append-only JSONL. The last record for a job is its current state, keyed by board and id because the two boards hand out colliding numeric ids.

```bash
is-dl apps add <jobId> --variant ai --from-run latest --json
is-dl apps status <jobId> rejected --json
is-dl apps list --status applied --older-than 10d --json
is-dl apps show <jobId> --json
```

Log an application immediately after the human confirms they sent it, never before. This is what makes `--exclude-applied` work, so skipping it degrades every future search.

`apps status` and `apps show` take `--source` when one id exists on both boards.

`apps list --older-than 10d --status applied` answers "who should I follow up with". Read that job's notes before drafting the follow-up; the process and the names are usually in there.


## Notes

A listing is rarely the whole story. The compensation band and the interview rounds usually arrive as a Google Doc or a recruiter's email, and none of that survives in the run file. `notes` keeps that text.

```bash
is-dl notes add <jobId> --title "Hiring process" --url <where the text came from> --json
is-dl notes attach <jobId> --file <path> [--as <name>] --json
is-dl notes list [<jobId>] --json
is-dl notes show <jobId> [--note <noteId>] --json
is-dl notes path <jobId> [--note <noteId>] --json
is-dl notes rm <jobId> --note <noteId> --json
```

The text comes from `--text`, `--file <path>`, or stdin. Stdin is the one to reach for, since it survives quoting and newlines that `--text` mangles.

```bash
is-dl notes add 4055 --title "Comp and process" --url https://docs.google.com/... --json <<'NOTE'
Stipend 40k/month, 6 months, extendable.
Three rounds: DSA screen, system design, culture.
NOTE
```

**Save the text, not a link to it.** A URL in `--url` records where it came from, and a link alone is worthless later, once the doc is locked, moved or revoked. Paste the content.

**Copy it verbatim.** A note is evidence, so never summarize a doc into a note and never write a tidier version of what a recruiter said. is-dl stores the body byte for byte, indentation and blank lines included, so what you pipe in is what comes back out. If your own reading is worth keeping, add it as a second note titled as yours.

`notes attach` is for anything that is not text. It copies the bytes unchanged, so a PDF brief, a docx take-home or a screenshot keeps its original form and name. Reach for it when the document only makes sense as a file; use `notes add` when the words are the point, since only note bodies come back through `notes show`.

`notes add` reads the board from the run that surfaced the job, so anything from a search needs no `--source`. A job id from outside is-dl needs `--source linkedin` or `--source unstop`, otherwise the note has nowhere to live.

Notes are independent of the application log, which is deliberate. Note a role while deciding, before there is anything to log. `apps show <jobId>` lists what a job has, and `notes show` prints the bodies.

Each note is a markdown file under `notes/<source>/<jobId>/` in the data dir, so a human can grep and edit them outside is-dl. `notes path` prints the file, which is what to hand `$EDITOR`. Never write into that directory directly when a command will do it.

### When to write one

Save a note when the human hands you text about a role, or asks for one. That covers a pasted hiring doc, a recruiter email they forwarded, a page you fetched for them, and their own verdict on a role.

Do not write notes on your own initiative for every shortlisted job. Nothing downstream needs them, and a note nobody asked for is one more thing to read.

When the human gives you material the listing does not carry, offer to save it and say what you would title it. That usually means terms from a linked doc, so pay, duration, bond, equity or location, and the interview process, take-home brief or deadline.

Save it while the text is in front of you. Reconstructing it later is guesswork.

## Resume

```bash
is-dl resume path --json          # resolved input and output dirs
is-dl resume build --variant ai
is-dl resume build --all
is-dl resume check                # page count and text extraction, every variant
```

Inputs live in the config dir under `resume/`, outputs in the data dir under `resume/build/`. Both resolve per platform. Never hardcode either; call `resume path`.

Two files matter:

- `resume.yaml` is the superset of facts. Every bullet has an `id`.
- `variants.yaml` selects per variant. `lead` promotes ids to the top of a section, `drop` removes them, `tags` keeps only bullets carrying a tag.

**`drop` accepts bullet ids, not just entry ids.** This is the important part. When a build overflows, cut individual weak bullets before cutting a whole project. Per-entry `Technologies:` lines are the cheapest cut, since the Technical Skills section already covers that ground.

A build that does not fit fails loudly:

```
error: Variant "ai" is 2 pages. The "Projects" section pushed it over.
```

Fix it by adding ids to that variant's `drop` list, then rebuild. Never work around it by editing the preamble or shrinking type.

Adding a variant means copying an eight-line block in `variants.yaml`. Do that rather than overloading an existing variant.

## The rule that matters

**The pipeline selects, it never writes.** Every sentence in a built PDF is copied verbatim from `resume.yaml`. Reorder, omit and re-tag freely. Never invent a bullet, embellish a claim, paraphrase a metric, or write a nicer version of something the human wrote. They have to defend every line in an interview.

If a listing wants something the resume cannot honestly claim, say so. Do not fix it in the resume.

## Typical loop

1. `is-dl search --profile <name> --exclude-unpaid --exclude-applied --exclude-seen --json`
2. Check `meta.sources[]`, then read the descriptions, shortlist with reasons, flag conflicts and pay kinds.
3. `is-dl notes add <jobId>` when the human hands over a hiring doc, brief or thread, and `is-dl notes attach` when it is a file.
4. `is-dl resume build --variant <ai|research|fullstack>` for the ones worth applying to.
5. The human applies.
6. `is-dl apps add <jobId> --variant <name>`.

## Setup, for a fresh machine

```bash
npx playwright install chromium
is-dl login          # needs a real terminal, refuses without a TTY
is-dl doctor --json
```

Both steps are for LinkedIn. Unstop works on a bare machine, so `--source unstop` is the way to return results while a human is still around to log in.

Resume builds need `tectonic` on PATH. `is-dl doctor` reports whether it is present. Never install it automatically and never run sudo.
