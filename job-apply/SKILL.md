---
name: job-apply
description: Find internships with is-dl and apply to them in a private browser that carries the user's logins, uploading a tailored resume, answering screening questions from the user's answer bank, and logging each submission in is-dl. Use when asked to apply to jobs, or when a scheduled application run fires.
disable-model-invocation: true
---

# Job apply

One run finds fresh listings with is-dl, applies to up to 5 of them, and logs each one. The user is only needed when a form asks for something you cannot answer from what you have.

This skill builds on `is-dl`. Read its skill file (`~/.agents/skills/is-dl/SKILL.md`) before the first command. Its rules hold here, above all that a resume only selects bullets and never gains a sentence. One rule is overridden: is-dl says a human presses send. Here you submit and log, except in a trial.

## The browser

`scripts/browser.mjs` in this skill's folder drives a private Helium in a window on a virtual X display, never on the user's screen. It is not headless, because captchas reject headless browsers. It runs on a copy of the user's main Helium profile, so it is signed in to LinkedIn, Google and the rest. It never touches the browser the user has open. Every command prints one JSON line.

```bash
B=<this skill's folder>/scripts/browser.mjs
node $B start                 # refresh the profile copy and launch
node $B open <url>            # new tab, becomes current
node $B snapshot              # page text plus numbered elements; scoped to an open modal, --all for the whole page
node $B click <ref>            # prints dialog: true when a modal is open after the click
node $B fill <ref> <text>     # replaces the field's text, prints the value it now holds
node $B select <ref> <label>  # native <select> only; for custom dropdowns click, snapshot, click the option
node $B upload <ref> <file>   # file inputs show in snapshots even when hidden
node $B press Enter           # also Tab, Escape, ArrowDown, ArrowUp, Backspace
node $B tabs                  # an external Apply often opens a new tab; switch with: node $B use <id>
node $B goto <url>
node $B eval '<js>'           # read what a snapshot misses, such as an iframe's src
node $B shot                  # screenshot path, for showing the user
node $B close
node $B stop
```

Refs come from the latest snapshot. Take a new one after every click that changes the page. A typeahead field, such as a city, wants you to fill it, snapshot, and click a suggestion. When a form sits in an iframe, `eval` its `src` and `goto` it.

A LinkedIn listing loads its description late. Wait about 6 seconds after `open`, click "… more" if the description shows one, then snapshot with `--all`.

## First run on a machine

A new machine lacks the user's private files. Set up whatever is missing, then continue with the run.

- **`~/.config/is-dl/answers.md`.** Copy `references/answers-template.md` from this skill's folder there. Ask the user for every `<placeholder>` in one message, fill in their answers in their words, and leave "Learned answers" empty. Take anything the resume already states, such as degree and graduation, from `resume.yaml` and ask only to confirm it. Never put the file in a git repository; if `~/.config/is-dl` is a stowed dotfiles folder, check that the repo ignores `answers.md`.
- **`$APPLICANT_PHONE`.** Ask the user for the number with country code. Add `export APPLICANT_PHONE=<number>` to `~/.secrets`, creating it if needed, and make sure the shell profile sources it (`. "$HOME/.secrets"` in `~/.zshenv`). Never write the number anywhere else.
- **Xvfb.** `start` needs `xvfb-run`. On Fedora it comes with `xorg-x11-server-Xvfb`.
- **Helium.** `start` fails without Helium at `/opt/helium/helium` and a signed-in profile at `~/.config/net.imput.helium`. Tell the user to install Helium and sign in to LinkedIn in it. Set `JOB_BROWSER` or `JOB_BROWSER_SOURCE` when either lives elsewhere.
- **is-dl.** `is-dl doctor` covers it. A missing resume (`~/.config/is-dl/resume/resume.yaml`) is the user's to supply; stop and say so.

## Usage gate

A run lasts 30 minutes or more, so a scheduled run first checks the model's 5-hour usage window. A scheduled run is one whose prompt says so, including a continuation. The gate trips when the window is at 70% or more and resets more than 45 minutes from now.

Read the window of the account the run's own model bills to:

- **Claude models.** Take `claudeAiOauth.accessToken` from `~/.claude/.credentials.json` and GET `https://api.anthropic.com/api/oauth/usage` with `Authorization: Bearer <token>` and `anthropic-beta: oauth-2025-04-20`. Use `five_hour.utilization` (a percentage) and `five_hour.resets_at`.
- **GPT models through Codex.** Take `tokens.access_token` and `tokens.account_id` from `~/.codex/auth.json` and GET `https://chatgpt.com/backend-api/wham/usage` with `Authorization: Bearer <token>` and `chatgpt-account-id: <account_id>`. The 5-hour window is whichever of `rate_limit.primary_window` and `rate_limit.secondary_window` has `limit_window_seconds` 18000. Use its `used_percent` and `reset_at` (epoch seconds). If neither has 18000, the plan has no 5-hour limit and the gate passes.

If the read fails, the gate passes and the report notes the failure.

When the gate trips:

1. `node $B stop` if the browser is running.
2. Create one `schedule_task` titled `Job apply continuation`, bound to this thread: `fixed_time` at the reset time plus 5 minutes, with `weekdays` set to that time's local weekday, not today's. Its prompt tells the run to find the task by title with `list_scheduled_tasks` and delete it, then run `/job-apply` (fallback: this skill file's path) as a scheduled, non-trial continuation that applies to at most `<n>` jobs, where `<n>` is what remains of the original run's 5.
3. End with the report.

A run the user starts by hand, and every trial, does not defer. Over the threshold, it reports the utilization and asks whether to go ahead.

## Before anything

1. On a scheduled run, the usage gate. If it trips, do nothing else.
2. `is-dl doctor --json`. Exit 3 means the is-dl LinkedIn session expired: stop and tell the user to run `is-dl login`.
3. Read `~/.config/is-dl/answers.md`. It holds every fact you may put in a form. The phone number is in `$APPLICANT_PHONE`. If either is missing, set it up as "First run on a machine" says.
4. Read `~/.local/state/job-apply/pending.json` if it exists. Apply first to its `queued` jobs and to `stopped` jobs the user has since answered. They count toward the run's 5. Never reopen an `interrupted` job; see Log.
5. `node $B start`, then `open https://www.linkedin.com/feed/` and `snapshot`. The page must show the feed, not "Sign in" or "Join now". If it is signed out, stop and tell the user to sign in to LinkedIn in Helium. Never ask for credentials.

## Find

```bash
is-dl search -k "<role> intern" --source linkedin -l "<location>" --remote-only \
  --experience-level Internship --posted-within "Past week" --exclude-unpaid --exclude-applied --exclude-seen --json
```

A search takes 2 to 5 minutes, sometimes more. Run each one in the background and read its output when it finishes, rather than in the foreground where a shell timeout can kill it.

LinkedIn searches one place at a time. It has no worldwide option, and `-l Worldwide` falls back to the account's country. Use these locations, one search each: `India`, `United States`, `Europe`.

Search software engineer in all three locations first. LinkedIn's search matches meaning, so a second role in the same location mostly repeats the first search's listings and then returns on-site ones. Only if you are still short of candidates, search one more role across the three locations, in this order: full stack developer, AI engineer, forward deployed engineer. Skip Unstop. A search can return the same `jobId` twice; keep one.

`--exclude-seen` hides every listing a search has returned before, opened or not. Keep `--posted-within`: without it, the search pages past the seen listings into months-old on-site results. Before you start applying, write the kept candidates to `pending.json` (see Log), so an interrupted run does not lose them.

Judge each listing by reading its description, as the is-dl skill describes. The pay label misses pay stated in the text, so read for it. Keep a listing only if all of these hold:

- Actually remote. `--remote-only` only adds "remote" to the query text, which LinkedIn ranks by but does not enforce, so first drop listings whose `jobType` says `On-site` or `Hybrid`. Among the rest, required office attendance rules it out. So does anything the user cannot meet from India: work authorization or residence in another country, enrollment at a university there, or a working language other than English. Many United States and Europe listings have one of these. A listing that states none of them stays in. A form question asking whether you can work from a named office also rules the job out; reject it then. A `locationConflict` raised by an optional perk, such as an office gym, does not.
- Paid or pay unstated. An internship counts when its stated pay is at least INR 5,000 a month, including "up to", performance-based and incentive stipends. A job that is not an internship (contract, full-time) counts at INR 40,000 a month or more in base pay, or INR 8 LPA or more in CTC. Indian listings often quote CTC; never read a CTC as base pay unless the listing says so. Unpaid and smaller amounts are out.
- A fit for the resume. Skip roles that need years of experience, or a language or field the resume does not show, such as Java or embedded systems. A framework the resume lacks is not a reason to skip when the resume shows its language. A Django role fits a resume with Python and FastAPI.
- A named company. Skip a listing with no company name.
- A real company hiring for its own product or clients. Skip internship mills: India-only outfits whose name is built around interning, skilling or mentoring (internmo, Skillzenloop, Unified Mentor), and listings that sell a "structured internship program" for freshers with a certificate, a performance-based "up to" stipend and the same template posted for many roles.

Hours do not decide. Never skip a listing for a `Full-time` tag or for stated full-time hours; the user settles hours with the company after an offer. If a form asks about hours, answer from `answers.md`.

Fewer good listings than the limit is fine. Never pad.

## Apply

For each kept listing, one at a time:

1. Add a variant to `variants.yaml` named `<company>-<role>`, by copying an existing block and changing only `headline`, `lead` and `drop`. Build it with `is-dl resume build --variant <name> --json` and take the PDF path from its output. Fix overflow by dropping bullets, as the is-dl skill says.
2. `open` the listing and `snapshot`.
3. Click Easy Apply, or Apply when it leads to the employer's site. External sites are fine, but only those that need no new account. A site you are already signed in to, such as Google Forms, is fine. If the listing only gives an email address, stop on this job. When `click` on Easy Apply prints `dialog: false`, wait 3 seconds and snapshot before clicking again. A second click on an open form closes it and asks "Save this application?"; answer Discard and start over.
4. Fill the form:
   - Contact fields and screening questions come from `answers.md`. Copy the facts. Do not round, stretch or guess. Where `answers.md` and `resume.yaml` disagree, `answers.md` wins in forms. Never edit `resume.yaml` to match.
   - Upload the built PDF. On LinkedIn, click "Upload resume" first so the file input exists, then `upload`. Snapshot and check the new file's radio is the selected one.
   - Years of experience with a skill: count only what the resume shows. Coursework and personal projects count as under one year. A field that only takes a number gets whole completed years, so `0` for under one year. LinkedIn prefills these from past applications; overwrite every prefilled answer with what the resume shows.
   - Uncheck "Follow company" and any other prechecked box that is not part of the application.
   - Short free-text answers, up to about 3 sentences, you write yourself from facts in `resume.yaml` and the listing. Never claim anything the resume does not show.
   - Easy Apply runs over several pages. Fill, click Next or Review, snapshot, repeat.
5. On the last page before submit, snapshot and check every field against what you meant to send.
6. Submit, then snapshot and confirm the page says the application was sent. Without that confirmation it did not happen. If nothing confirms within 60 seconds, do not resubmit. If the page loads a captcha script (`eval` for a `script[src]` containing `recaptcha`, `hcaptcha` or `turnstile`), the captcha most likely rejected it. Stop on the job and ask the user to apply by hand. Otherwise mark the job `interrupted`, as Log describes.
7. Log it, as described below.
8. `close` the tab. On a scheduled run, run the usage gate before the next listing, then wait 3 to 6 minutes.

`node $B stop` when the run ends.

When the user's prompt says this is a trial, stop at step 5 for every job instead. Show a `shot`, list what you filled in, and wait for the user to say submit. Keep the tab open and the browser running while you wait.

### When to stop on a job and ask

Stop on a job and move to the next one when it needs any of these:

- A cover letter, or a free-text answer longer than about 3 sentences.
- A question whose answer is not in `answers.md` and not in the resume.
- Something personal: health, disability, family, salary history, references, or anything you would not say on the user's behalf.
- A new account, an assessment, a test, a video, a payment, or joining a group or community such as WhatsApp.
- An email-only application.
- A captcha or security check. Do not retry it.

Record it in `pending.json` with the exact question and a link. At the end of the run, list each stopped job.

When the user answers, add each reusable fact under "Learned answers" in `answers.md` in their words, so the same question never reaches them twice. A cover letter is not a reusable fact.

## Log

`~/.local/state/job-apply/pending.json` is a JSON array, one entry per job not yet logged: `jobId`, `url`, `company`, `role`, `variant`, `pdf`, `status` (`queued`, `stopped` or `interrupted`), `question` when stopped, and `sent` when interrupted: the site and every field you submitted. Keep it current as you go. Remove an entry once its job is logged, or once you reject it; rejected jobs go in the report, not the file. When you reject a job that already has a variant, delete its block from `variants.yaml` and its build folder (the parent of `pdf`). A stopped job keeps its variant.

An interrupted job may have gone through, so no run submits it again, and it does not count toward a run's 5. It stays in the file until the user says what happened. If it went through, log it as below from its `sent` and remove the entry. If it did not, set it back to `queued`.

Run both commands right after the confirmation page:

```bash
is-dl apps add <jobId> --variant <name> --json
is-dl notes add <jobId> --title "Application answer and resume sent" --json <<'NOTE'
...
NOTE
```

The note records, word for word:

- The date applied, and whether it went through Easy Apply or which external site.
- Every screening question and the answer you submitted.
- The variant name, its headline, the built PDF path, and its `lead` and `drop` lists.
- One line on why this selection fits the role.

The user defends these answers in interviews, so the note has to say exactly what was sent.

## Report

End every run with:

- Each application: company, role, link, variant, and any answer you wrote yourself.
- Each stopped job and what it needs from the user.
- Each interrupted job, from every run so far: link and what was sent. Ask whether it went through.
- Listings you rejected, with one line each on why.
- How many of the run's 5 you applied to.
- When the usage gate deferred the run: the utilization, the reset time, and when the continuation fires.
