---
name: job-apply
description: Find internships with is-dl and apply to them in a private headless browser that carries the user's logins, uploading a tailored resume, answering screening questions from the user's answer bank, and logging each submission in is-dl. Use when asked to apply to jobs, or when a scheduled application run fires.
disable-model-invocation: true
---

# Job apply

One run finds fresh listings with is-dl, applies to up to 5 of them, and logs each one. The user is only needed when a form asks for something you cannot answer from what you have.

This skill builds on `is-dl`. Read its skill file (`~/.agents/skills/is-dl/SKILL.md`) before the first command. Its rules hold here, above all that a resume only selects bullets and never gains a sentence. One rule is overridden: is-dl says a human presses send. Here you submit and log, except in a trial.

## The browser

`scripts/browser.mjs` in this skill's folder drives a private headless Helium. It runs on a copy of the user's main Helium profile, so it is signed in to LinkedIn, Google and the rest. It never touches the browser the user has open. Every command prints one JSON line.

```bash
B=<this skill's folder>/scripts/browser.mjs
node $B start                 # refresh the profile copy and launch
node $B open <url>            # new tab, becomes current
node $B snapshot              # page text plus numbered elements; scoped to an open modal, --all for the whole page
node $B click <ref>
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

## First run on a machine

A new machine lacks the user's private files. Set up whatever is missing, then continue with the run.

- **`~/.config/is-dl/answers.md`.** Copy `references/answers-template.md` from this skill's folder there. Ask the user for every `<placeholder>` in one message, fill in their answers in their words, and leave "Learned answers" empty. Take anything the resume already states, such as degree and graduation, from `resume.yaml` and ask only to confirm it. Never put the file in a git repository; if `~/.config/is-dl` is a stowed dotfiles folder, check that the repo ignores `answers.md`.
- **`$APPLICANT_PHONE`.** Ask the user for the number with country code. Add `export APPLICANT_PHONE=<number>` to `~/.secrets`, creating it if needed, and make sure the shell profile sources it (`. "$HOME/.secrets"` in `~/.zshenv`). Never write the number anywhere else.
- **Helium.** `start` fails without Helium at `/opt/helium/helium` and a signed-in profile at `~/.config/net.imput.helium`. Tell the user to install Helium and sign in to LinkedIn in it. Set `JOB_BROWSER` or `JOB_BROWSER_SOURCE` when either lives elsewhere.
- **is-dl.** `is-dl doctor` covers it. A missing resume (`~/.config/is-dl/resume/resume.yaml`) is the user's to supply; stop and say so.

## Before anything

1. `is-dl doctor --json`. Exit 3 means the is-dl LinkedIn session expired: stop and tell the user to run `is-dl login`.
2. Read `~/.config/is-dl/answers.md`. It holds every fact you may put in a form. The phone number is in `$APPLICANT_PHONE`. If either is missing, set it up as "First run on a machine" says.
3. Read `~/.local/state/job-apply/pending.json` if it exists. It holds jobs an earlier run left waiting on the user or interrupted. Finish those first, using any answers the user has given since. They count toward the run's limit of 5 applications.
4. `node $B start`, then `open https://www.linkedin.com/feed/` and `snapshot`. The page must show the feed, not "Sign in" or "Join now". If it is signed out, stop and tell the user to sign in to LinkedIn in Helium. Never ask for credentials.

## Find

```bash
is-dl search -k "<role> intern" --source linkedin -l Worldwide --remote-only \
  --experience-level Internship --exclude-unpaid --exclude-applied --exclude-seen --json
```

LinkedIn reads `-l Worldwide` as text and tends to narrow it to the account's country. That suits this skill, but check each listing's location against the remote rule below.

Roles, one search each, in this order until you have enough candidates: software engineer, forward deployed engineer, full stack developer, backend developer, frontend developer. Add any other role the descriptions suggest fits. Skip Unstop. A search can return the same `jobId` twice; keep one.

`--exclude-seen` hides every listing a search has returned before, opened or not. Before you start applying, write the kept candidates to `pending.json` (see Log), so an interrupted run does not lose them.

Judge each listing by reading its description, as the is-dl skill describes. The pay label misses pay stated in the text, so read for it. Keep a listing only if all of these hold:

- Actually remote. Required office attendance, or a restriction to countries other than India, rules it out. A `locationConflict` raised by an optional perk, such as an office gym, does not.
- Paid or pay unstated. Pay counts when its stated amount is at least INR 5,000 a month, including "up to", performance-based and incentive stipends. Unpaid and smaller amounts are out.
- Doable alongside a final-year degree in about 6 hours a week, or hours unstated. Skip roles that demand full-time hours during IST working days.
- A fit for the resume. Skip roles that need years of experience or skills the resume does not show.

Fewer good listings than the limit is fine. Never pad.

## Apply

For each kept listing, one at a time:

1. Add a variant to `variants.yaml` named `<company>-<role>`, by copying an existing block and changing only `headline`, `lead` and `drop`. Build it with `is-dl resume build --variant <name> --json` and take the PDF path from its output. Fix overflow by dropping bullets, as the is-dl skill says.
2. `open` the listing and `snapshot`.
3. Click Easy Apply, or Apply when it leads to the employer's site. External sites are fine, but only those that need no new account. A site you are already signed in to, such as Google Forms, is fine. If the listing only gives an email address, stop on this job.
4. Fill the form:
   - Contact fields and screening questions come from `answers.md`. Copy the facts. Do not round, stretch or guess. Where `answers.md` and `resume.yaml` disagree, `answers.md` wins in forms. Never edit `resume.yaml` to match.
   - Upload the built PDF with `upload`. Replace any resume LinkedIn preselected.
   - Years of experience with a skill: count only what the resume shows. Coursework and personal projects count as under one year. A field that only takes a number gets whole completed years, so `0` for under one year.
   - Short free-text answers, up to about 3 sentences, you write yourself from facts in `resume.yaml` and the listing. Never claim anything the resume does not show.
   - Easy Apply runs over several pages. Fill, click Next or Review, snapshot, repeat.
5. On the last page before submit, snapshot and check every field against what you meant to send.
6. Submit, then snapshot and confirm the page says the application was sent. Without that confirmation it did not happen.
7. Log it, as described below.
8. `close` the tab, then wait 3 to 6 minutes before the next listing.

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

`~/.local/state/job-apply/pending.json` is a JSON array, one entry per job not yet logged: `jobId`, `url`, `company`, `role`, `variant`, `pdf`, `status` (`queued`, `stopped` or `interrupted`) and, when stopped, `question`. Keep it current as you go. Remove an entry once its job is logged, or once you reject it; rejected jobs go in the report, not the file.

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
- Listings you rejected, with one line each on why.
- How many of the run's 5 you applied to.
