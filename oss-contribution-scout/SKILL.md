---
name: oss-contribution-scout
description: Scout issues for OSS Contribution
disable-model-invocation: true
---
# Open-Source Contribution Scout

## Purpose

This skill finds the highest-value open-source contribution opportunities for one contributor.

The objective is not to maximize:

* pull request count,
* GitHub activity,
* contribution streaks,
* easy merges,
* famous repository names,
* or work that merely matches the contributor's current stack.

The objective is to convert engineering ability into:

1. **Strong technical evidence**
2. **External validation**
3. **Useful maintainer relationships**
4. **A coherent open-source reputation**
5. **Better employment or internship prospects**

It is better to return 6 excellent opportunities than 15 padded ones.

The scout must distinguish between:

* a good **individual issue**,
* a good **repository for repeated contribution**,
* a good **technical stretch contribution**,
* and a good **opportunistic contribution when the contributor personally encounters a bug**.

These are not the same thing.

---

# Input

The user gives two dynamic inputs.

## Input 1 — Project Set

A list of projects or repositories.

It may also be:

* a URL containing repositories,
* a machine-generated inventory,
* a previous OSS scouting report,
* or multiple sources.

Keep the source for each project.

## Input 2 — Contributor Profile

The contributor profile can contain:

* skills,
* languages,
* experience level,
* personal projects,
* previous OSS work,
* career goals,
* technologies actively used,
* technologies the contributor is willing to learn,
* current employment/internship goals,
* and relevant constraints.

Ask for the contributor profile only when it was not supplied.

Do not assume that unfamiliar technology means poor fit.

If the contributor has demonstrated the ability to enter unfamiliar codebases, treat unfamiliarity mainly as an **onboarding cost**, not as a reason to reject technically valuable work.

---

# Core Principles

## 1. Optimize for conversion, not activity

A contribution is valuable when it improves the contributor's external career position.

Do not optimize for:

* "getting the contribution graph moving,"
* collecting many tiny merges,
* contributor badges,
* arbitrary GitHub visibility,
* or having many repositories listed on a résumé.

One technically meaningful, well-reviewed contribution can be worth more than ten trivial merges.

---

## 2. Distinguish career signal from difficulty

A difficult issue is not automatically a valuable issue.

Ask:

> If this contribution is merged and explained in an interview, what does it prove?

Strong evidence may include:

* tracing and fixing a semantic compiler bug,
* safely redesigning concurrent operations,
* fixing protocol translation,
* improving production performance,
* implementing platform or OS protocols,
* debugging state synchronization,
* correcting subtle runtime behavior,
* addressing networking or streaming problems,
* changing architecture with regression coverage.

A large diff is not automatically impressive.

A small diff can still be highly impressive when the reasoning is deep.

---

## 3. Do not confuse acceptance probability with value

A 95% chance of merging a trivial change does not automatically beat a 65% chance of merging a substantive contribution.

Acceptance probability matters because work that is never reviewed produces little external validation.

But acceptance is a multiplier on useful work, not the goal itself.

---

## 4. Separate maintainer accessibility from professional network value

Do not combine these into one score.

### Maintainer Accessibility

How likely is a good outside contributor to:

* receive review,
* get useful feedback,
* discuss implementation choices,
* become recognizable,
* and build contributor trust?

### Professional Network Value

If the contributor becomes known in this community, how professionally useful could those relationships become?

Consider:

* ecosystem relevance,
* maintainers' roles,
* companies involved,
* adjacent communities,
* potential referral/hiring value,
* whether repeat contributors actually enter the project's social orbit.

A famous maintainer who barely interacts with contributors does not automatically provide high network value.

A less-famous maintainer who gives deep reviews may have excellent accessibility.

---

## 5. Reconcile written contribution policy with current behavior

This is a critical rule.

Do **not** treat the CONTRIBUTING file, README, or issue templates as the sole source of truth.

Do **not** treat recent merge history as the sole source of truth either.

You must reconcile both.

### When policy sounds restrictive but recent behavior is welcoming

If written policy says things such as:

* unsolicited PRs may be ignored,
* contributors should discuss changes first,
* large PRs are discouraged,
* or maintainers reserve the right to close outside work,

but recent evidence shows:

* frequent external merges,
* substantive first-time contributors,
* active maintainer review,
* and repeat outside contributors,

do **not** reject the repository.

Instead classify it according to both realities.

Examples:

* `High Competition / External PRs Accepted`
* `Discuss First`
* `Opportunistic`
* `Small Focused PRs Preferred`

Explain the discrepancy.

### When policy explicitly forbids unsolicited PRs

If current policy explicitly says that outside code PRs are:

* invitation-only,
* normally closed without review,
* or not accepted unless maintainers request implementation,

then do not classify the repository as a normal actionable contribution target merely because external contributors occasionally appear in history.

Classify it as:

* `Invitation-Only`
* `Issue Analysis / Diagnosis First`
* or `Opportunistic by Invitation`

Only recommend code contribution when there is evidence that an invitation is realistically obtainable for the specific issue.

### When policy and behavior conflict

Prefer current behavior for estimating:

* contributor friendliness,
* review likelihood,
* and actual repository openness.

But preserve explicit policy constraints when they directly control whether unsolicited code is allowed.

Always state the conflict.

Never silently choose one side.

---

## 6. Distinguish proactive hunting from opportunistic contribution

Some repositories are poor places to browse random issues but excellent places to contribute when the contributor personally encounters a bug.

Classify every repository as one of:

* **Repeat-Contributor Target**
* **Proactive Target**
* **Stretch Target**
* **Opportunistic Only**
* **Invitation-Only / Diagnosis First**
* **Skip**

Examples of `Opportunistic Only`:

* extremely crowded project,
* good issues get claimed quickly,
* contributor has unusually strong product intuition,
* worthwhile fixes appear organically during use,
* proactive issue hunting has poor expected value.

Do not reject such repositories outright.

---

## 7. Reward coherent contribution trajectories

Repeated substantive work in one ecosystem can be more valuable than unrelated work scattered across many repositories.

Look for trajectories such as:

> bounded entry issue → substantive follow-up → recognized contributor

or:

> ecosystem tool → adjacent package → deeper core contribution

or:

> familiar project → reviewed contribution → architectural issue

The scout should explicitly identify these opportunities.

---

## 8. Do not overfit personalization

Personalization is useful only when it changes expected execution quality.

Do not manufacture personal relevance.

Ask:

> Does this contributor's prior experience materially improve their ability to reproduce, understand, implement, or explain this issue?

Examples of legitimate personal advantage:

* actively uses the affected feature,
* has experienced the bug,
* has built a similar subsystem,
* already understands the protocol,
* knows adjacent tooling,
* knows the language/runtime/environment.

Weak connections such as "the contributor uses Linux and this is a Linux app" should not receive large score boosts by themselves.

---

# Step 1 — Collect the Projects

Build a canonical list of candidate repositories from Input 1.

Record:

* repository URL,
* source,
* whether the contributor actively uses it,
* whether the contributor has the source locally,
* main languages,
* project category.

Deduplicate:

* forks,
* mirrors,
* renamed repositories,
* duplicated inventory entries.

---

# Step 2 — Cluster and Triage

Do not deeply inspect every repository.

Create clusters such as:

* AI developer tooling
* editors
* terminals and shells
* compilers and language tooling
* browser tooling
* infrastructure and networking
* CLI utilities
* Python tooling
* Rust systems software
* web frameworks
* desktop Linux
* media tooling
* other relevant groups

Use the contributor profile to prioritize.

For each repository estimate:

* Domain Fit
* Onboarding Cost
* Potential Career Value

Do not reject a project merely because:

* the language is unfamiliar,
* the codebase is large,
* or the project is a monorepo.

Reject only when the opportunity cost is clearly poor.

---

# Step 3 — Investigate Clusters with Subagents

Use one subagent per non-overlapping cluster.

Each subagent performs Steps 4 through 9 for its cluster.

Run them concurrently when supported.

Each subagent must return:

* repository-level findings,
* issue-level findings,
* rejected repositories,
* unresolved uncertainties,
* evidence URLs,
* and confidence.

Do not make one agent scan a huge heterogeneous repository set when clustering is possible.

---

# Step 4 — Evaluate Repository Reality

Use current GitHub data.

Prefer:

* `gh repo view`
* `gh pr list`
* `gh issue list`
* `gh api`

Use `gh search` sparingly.

Focus primarily on the last **30–90 days**.

Older evidence may be used when current samples are thin, but label it as historical.

---

## 4A. Read contribution policy

Read:

* CONTRIBUTING
* README contribution sections
* issue templates
* PR templates
* relevant discussions
* recent maintainer comments

Extract:

* whether outside PRs are accepted,
* whether issue discussion is expected first,
* whether large PRs are discouraged,
* whether new contributors face special rules,
* whether invitation is required.

Do not stop here.

---

## 4B. Inspect actual recent behavior

Read approximately 40–100 recent merged PRs where possible.

Determine:

* internal/core-team share,
* bot share,
* external contributor share,
* apparent first-time contributor share,
* substantive external merge share,
* typical review latency,
* typical merge latency,
* quality of maintainer interaction.

Do not count dependency bots as evidence of contributor friendliness.

Do not count typo-only merges as evidence that substantive external contributions are welcome.

---

## 4C. Reconcile policy and behavior

Produce a short explicit note:

**Written policy:**
**Observed behavior:**
**Conclusion:**

Examples:

> Written policy warns that unsolicited PRs may be ignored, but 18 substantive external PRs were merged in the last 45 days. Treat as contributor-friendly but high-competition; discuss larger changes first.

or:

> Recent history includes outside contributors, but current policy explicitly says unsolicited code PRs are closed unless invited. Treat as invitation-only; recommend diagnosis/design contribution first.

This field is mandatory.

---

## 4D. Repository scores

Assign:

### External Contribution Health

* Excellent
* Good
* Mixed
* Poor
* Effectively Closed

### Maintainer Accessibility

0–10

### Professional Network Value

0–10

### Technical Reputation Potential

0–10

### Competition

0–10

### Onboarding Cost

0–10

### Recommended Role

One of:

* Repeat-Contributor Target
* Proactive Target
* Stretch Target
* Opportunistic Only
* Invitation-Only / Diagnosis First
* Skip

---

# Step 5 — Reject or Downgrade Poor Targets

Reject or heavily downgrade when evidence shows:

* unsolicited outside PRs are normally closed;
* substantive external work is rarely merged;
* almost all merges are bots or core team;
* outside PRs sit untouched for long periods;
* required infrastructure is inaccessible;
* issues are routinely claimed immediately;
* maintainers are not triaging the tracker;
* project is effectively abandoned.

Do not reject merely for:

* high PR count,
* large codebase,
* difficult technology,
* unfamiliar language,
* restrictive wording that current behavior contradicts.

These belong in Competition, Onboarding Cost, or Policy/Behavior reconciliation.

---

# Step 6 — Find Candidate Issues

Search surviving repositories for:

* correctness bugs,
* regressions,
* performance problems,
* concurrency issues,
* state synchronization bugs,
* protocol incompatibilities,
* provider translation bugs,
* networking issues,
* parser/compiler bugs,
* platform-specific failures,
* integration bugs,
* architecture problems,
* maintainer-requested missing behavior,
* reproducible issues with no implementation,
* recently active maintainer-backed issues,
* older still-relevant actionable issues.

Do not restrict discovery to:

* `good first issue`
* `help wanted`

---

## Reject an issue when

* someone is actively assigned and working on it;
* an open PR already addresses it;
* another contributor clearly claimed it;
* it is stale and maintainers appear uninterested;
* scope is too vague;
* required infrastructure is inaccessible;
* it is speculative with no maintainer support;
* it is mostly typo/docs work;
* it is mechanically trivial with little strategic value;
* it appears to require months before producing reviewable value.

An assigned issue may remain only if maintainers explicitly welcome another implementation.

---

## Prefer an issue when

* maintainers confirmed it;
* maintainers described likely fix shape;
* reproduction is clear;
* expected behavior is clear;
* tests exist nearby;
* no competing PR exists;
* contributor has genuine product intuition;
* contribution creates a strong engineering story;
* it opens a path to deeper work in the same ecosystem.

---

# Step 7 — Feasibility Reconnaissance

Do not highly rank an issue from discussion alone.

Inspect enough code to determine:

* likely subsystem,
* likely files/modules,
* current execution path,
* whether the apparent fix is local or architectural,
* nearby tests,
* hidden complexity,
* special infrastructure requirements,
* likely review concerns.

Do not implement the issue.

This step is reconnaissance only.

Estimate:

* Onboarding Cost
* Scope Risk
* Implementation Shape
* Confidence

If scope remains unclear, lower confidence and score accordingly.

---

# Step 8 — Score Each Candidate

Use whole numbers or half-points.

Avoid fake precision.

## A. Career Signal — 30%

Ask:

> If this is merged and explained well in an interview, what does it prove?

Consider:

* technical substance,
* production relevance,
* architectural depth,
* generalizability,
* project credibility,
* whether it adds evidence not already obvious in the contributor's portfolio.

Do not over-score trivial fixes because the repository is famous.

---

## B. PR Acceptance Probability — 25%

Estimate the chance that a **high-quality implementation** would merge.

Consider:

* actual recent external merges,
* policy,
* maintainer endorsement,
* issue ownership,
* competing PRs,
* project philosophy,
* scope clarity,
* review responsiveness,
* testability.

Give a broad percentage only when useful.

Example:

`7/10 — approximately 60–75% if the proposed approach is accepted`

The percentage is an estimate, not a mathematical probability.

---

## C. Maintainer Accessibility — 15%

How likely is good work to receive:

* review,
* substantive feedback,
* discussion,
* recognition,
* contributor trust?

---

## D. Professional Network Value — 10%

How professionally useful could recognition in this ecosystem become?

Consider:

* ecosystem importance,
* maintainer positions,
* adjacent communities,
* hiring/referral possibilities,
* whether repeat contributors actually interact with influential engineers.

Explain this as an inference.

Do not derive it from fame alone.

---

## E. Technical Depth — 10%

Evaluate actual engineering depth.

High-depth work may involve:

* compilers/parsers
* concurrency
* distributed systems
* networking
* protocol translation
* streaming
* platform protocols
* terminal internals
* browser internals
* rendering
* performance
* state synchronization
* authentication
* difficult compatibility behavior

Large diff size does not imply depth.

---

## F. Personal Advantage — 5%

Score only special contributor-specific leverage.

Examples:

* has reproduced the issue,
* actively uses the exact feature,
* knows the relevant protocol,
* built an analogous subsystem,
* already understands adjacent architecture.

Mere language familiarity should have little weight.

---

## G. New-Contributor Friendliness — 5%

Use recent substantive merge evidence.

Distinguish:

* trivial outside fixes
  from
* meaningful first-time contributor work.

---

# Step 9 — Record Non-Weighted Metrics

For every issue include:

## Competition

0–10

`0 = effectively uncontested`
`10 = duplicate effort is very likely`

## Onboarding Cost

0–10

## Scope Risk

0–10

## Research Confidence

* High
* Medium
* Low

## Estimated Time to Meaningful PR

* <1 day
* 1–3 days
* 3–7 days
* 1–2 weeks
* 2–4 weeks
* > 1 month

Assume strong AI coding agents are available.

Do not assume AI eliminates:

* codebase learning,
* reproduction,
* setup,
* debugging,
* architecture reasoning,
* testing,
* maintainer review,
* iteration.

---

# Step 10 — Calculate Strategic Value

Use the weighted score as a baseline.

Then apply judgment.

## Penalize

* extreme competition,
* high scope uncertainty,
* famous repo with poor actual review,
* large onboarding cost with mediocre payoff,
* issue likely to be claimed quickly,
* unclear maintainer intent,
* trivial implementation disguised as high value,
* mechanical work with little interview story,
* contribution that duplicates evidence already obvious from the contributor's portfolio.

## Boost

* unusually strong engineering story,
* explicit maintainer request,
* clear pathway to repeat contribution,
* contribution fills a gap in existing proof-of-work,
* contributor has genuine firsthand insight,
* issue can lead naturally to deeper work.

Explain meaningful overrides.

---

# Step 11 — Assign a Strategic Role

Every issue gets exactly one:

## Fast Credibility Win

Small-to-medium scope, strong acceptance odds, real external validation.

Still must involve genuine engineering.

Do not recommend many of these merely to generate activity.

## Core Contribution

Strong balance of:

* career signal,
* acceptance,
* review opportunity,
* meaningful engineering.

Usually the best immediate targets.

## Ecosystem Entry

A bounded first contribution that creates a realistic path toward deeper work.

The value is partly what comes next.

## Repeat-Contributor Opportunity

Useful when the contributor has already entered the ecosystem or the issue naturally follows prior work.

## Technical Stretch

Higher onboarding or implementation difficulty but unusually strong signal.

## Opportunistic High-Upside

Excellent if the contributor personally encounters or understands the issue, but poor for proactive hunting due to competition/timing.

## Invitation-Path Opportunity

Repository does not normally accept unsolicited code.

The recommended contribution is instead:

* reproduction,
* root-cause analysis,
* benchmark,
* design proposal,
* or other work that may earn an implementation invitation.

Do not present this as a normal PR opportunity.

---

# Step 12 — Build Contribution Trajectories

Create 2–4 plausible trajectories.

Examples:

## Recognition Lane

1. bounded contribution
2. substantive follow-up
3. deeper repeat contribution
4. recognizable contributor status

## Technical Depth Lane

1. manageable work in a harder ecosystem
2. meaningful systems/compiler/platform contribution
3. strong interview story

## Opportunistic Lane

Continue using a crowded familiar project.

When the contributor finds a real problem:

1. reproduce quickly,
2. inspect upstream,
3. check for competing work,
4. move only when expected value is high.

## Invitation Lane

For invitation-only repositories:

1. produce exceptional diagnosis,
2. engage constructively,
3. establish credibility,
4. pursue code only if explicitly invited.

---

# Step 13 — Adversarial Audit the Finalists

Before final ranking, use a separate subagent when available.

Audit approximately the top 8–12 issues.

For every finalist verify again:

* issue is still open;
* issue is still unclaimed;
* no new PR appeared;
* no contributor declared intent;
* contribution policy remains the same;
* recent merge behavior still supports the repository classification;
* policy and observed behavior were reconciled correctly;
* expected fix is as bounded as claimed;
* career score is not inflated by repository fame;
* network score is not inflated by maintainer fame;
* easy work is not being mistaken for strategic value;
* hard work is not being romanticized despite terrible acceptance odds;
* another issue in the same repository is not clearly better;
* the issue adds evidence not already obvious in the contributor's portfolio.

### Mandatory policy/behavior challenge

For every finalist repository ask:

> If I ignored the CONTRIBUTING wording and looked only at current behavior, what classification would I give?

Then ask:

> If I ignored current behavior and followed the written policy literally, what classification would I give?

If the answers differ, explicitly reconcile them.

This is mandatory.

---

# Step 14 — Write the Report

Write plain factual content before HTML rendering.

Include six sections.

---

## Part 1 — Executive Findings

State:

* best ecosystem for repeated contribution;
* best technical stretch target;
* best meaningful high-acceptance issue;
* best opportunistic project;
* best invitation-path project if relevant;
* major attractive projects that were rejected or downgraded;
* largest research uncertainty.

Do not merely repeat numeric ranks.

---

## Part 2 — Top Contribution Opportunities

Return approximately 6–12 strong issues.

Do not pad to a fixed count.

For each include:

### Project / Issue

**Repository:**
**Issue URL:**
**Strategic Role:**
**Overall Assessment:** Strong / Very Strong / Exceptional / Conditional

**Why it matters**

2–4 sentences.

**What this would prove**

State explicitly what the contribution demonstrates to an employer or maintainer.

**Career Signal:** X/10

**Acceptance Probability:** X/10

**Maintainer Accessibility:** X/10

**Professional Network Value:** X/10

**Technical Depth:** X/10

**Personal Advantage:** X/10

**New-Contributor Friendliness:** X/10

**Competition:** X/10
**Onboarding Cost:** X/10
**Scope Risk:** X/10
**Research Confidence:** High / Medium / Low
**Estimated Effort:** range

**Policy vs Behavior**

* Written policy:
* Recent observed behavior:
* Practical conclusion:

**Likely Subsystem / Files**

**Likely Implementation Shape**

Do not implement.

**Acceptance Evidence**

Use real recent PR and maintainer evidence.

**Risks**

Be candid.

**Next Step**

Use one of:

* reproduce locally;
* inspect subsystem;
* comment with approach;
* ask maintainer before coding;
* ready to implement;
* wait for personal reproduction;
* produce diagnosis/design first;
* skip unless conditions change.

---

## Part 3 — Best Repositories for Repeated Contribution

Rank approximately 5–10 repositories separately from issue ranking.

For each include:

* Recommended Role
* External Contribution Health
* Maintainer Accessibility
* Professional Network Value
* Technical Reputation Potential
* Competition
* Onboarding Cost
* Policy vs Behavior summary
* Why repeated work could compound
* Why it might not

Possible tags:

* Best ecosystem to become known in
* Best technical reputation
* Best balance
* Highest acceptance
* High upside / high competition
* Opportunistic only
* Best stretch ecosystem
* Invitation-only but high-value diagnosis path

Do not rank repositories solely by their best currently open issue.

---

## Part 4 — Contribution Trajectories

Give 2–4 strategic lanes.

Prefer:

### Lane 1 — Recognition

Become a recurring contributor somewhere maintainers actually notice good work.

### Lane 2 — Engineering Depth

Land one contribution that materially expands demonstrated technical range.

### Lane 3 — Opportunistic

Use crowded familiar projects normally and move quickly only on personally understood issues.

### Lane 4 — Invitation Path

For closed or invitation-only repositories, contribute diagnosis/design rather than speculative code.

Do not recommend many trivial PRs just to create visible activity.

---

## Part 5 — Skip / Deprioritize List

Include rejected and downgraded repositories.

For each state the current reason:

* effectively closed to unsolicited code,
* invitation-only,
* internal/bot dominated,
* huge competition,
* weak maintainer response,
* no suitable issue currently available,
* poor opportunity-cost fit,
* trivial issue pool,
* excessive onboarding for weak payoff,
* better treated opportunistically.

Distinguish carefully:

`Bad repository for external contribution`

from:

`Good repository, poor place to proactively hunt right now`

from:

`Potentially valuable, but code contribution requires invitation`

---

## Part 6 — Research Confidence

State:

* research date,
* sample windows,
* number of recent PRs sampled,
* thin-evidence repositories,
* rate-limit problems,
* issues likely to change ownership quickly,
* cases where policy and behavior materially disagreed.

Do not hide uncertainty behind precise scores.

---

# Step 15 — Evidence Rules

Give a URL for every important external claim.

Use:

* issue pages,
* pull requests,
* merged PR history,
* CONTRIBUTING files,
* README policy,
* maintainer comments,
* discussions,
* release notes,
* GitHub API data.

Do not rely primarily on:

* stars,
* generic descriptions,
* stale snippets,
* historical contribution policy contradicted by current behavior.

For first-time contributor friendliness, inspect actual recent substantive merges.

For maintainer responsiveness, inspect actual review timelines.

For professional network value, clearly label inference.

---

# Step 16 — Render and Publish

Load the `html-communication` skill.

Give one subagent the completed factual report.

The HTML subagent must not:

* change scores,
* change ranking,
* invent evidence,
* reinterpret policies,
* add unsupported claims,
* or redo repository analysis.

Its task is presentation only.

Follow the `html-communication` skill.

Upload to Postplan.

Return the Postplan URL.

---

# Final Quality Test

Before publishing, verify:

1. Did we reward easy merges over meaningful engineering?
2. Did we overrate a famous repository?
3. Did we overrate a famous maintainer?
4. Did we confuse maintainer accessibility with professional network value?
5. Did we mistake stack familiarity for meaningful personal advantage?
6. Did we recommend tiny PRs merely to generate visible activity?
7. Did we distinguish proactive targets from opportunistic projects?
8. Did we distinguish normal PR targets from invitation-only repositories?
9. Did we inspect enough code to challenge issue scope?
10. Is every recommended issue still open and genuinely available?
11. Does each high-ranked issue add useful evidence beyond the contributor's current portfolio?
12. Did we explicitly reconcile written contribution policy with current repository behavior?
13. Did we avoid rejecting an active external-contributor project because of stale restrictive wording?
14. Did we avoid recommending unsolicited code to a repository whose current policy explicitly forbids it?
15. Is there a coherent route from these contributions to external recognition, stronger interviews, or employment?

If any answer is no, revise the report before publishing.

