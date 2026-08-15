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
* easy merges,
* contribution streaks,
* famous repositories,
* or work that merely matches the contributor's existing skills.

The objective is to find work that can convert engineering ability into:

1. **Strong technical evidence**
2. **External validation from respected maintainers**
3. **Useful contributor relationships**
4. **A coherent open-source reputation**
5. **Better employment or internship prospects**

It is better to return 6 genuinely strong opportunities than 15 padded ones.

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

It can also be:

* a URL containing repositories,
* a machine-generated inventory,
* a previous OSS scouting report,
* or multiple sources.

Keep the source for each project.

## Input 2 — Contributor Profile

The contributor profile contains:

* skills,
* languages,
* current experience,
* projects,
* previous OSS work,
* career goals,
* technologies they actively use,
* technologies they are willing to learn,
* and any constraints.

Ask for the contributor profile only when it was not supplied.

Do not assume that unfamiliar technology means poor fit.

If the contributor has demonstrated an ability to learn unfamiliar codebases, treat unfamiliarity mainly as an **onboarding cost**, not as a reason to reject technically valuable work.

---

# Core Principles

## 1. Optimize for conversion, not activity

A contribution is valuable when it improves the contributor's external career position.

Do not optimize for:

* "getting the contribution graph moving,"
* accumulating many small merges,
* collecting contributor badges,
* or having many repositories listed on a résumé.

One technically meaningful, well-reviewed contribution can be more valuable than ten trivial merges.

## 2. Distinguish career signal from difficulty

A large or difficult issue is not automatically impressive.

Career signal comes from the engineering story that remains after the work is finished.

Ask:

> If the contributor explains this contribution in an interview, what does it prove?

Examples of strong signals include:

* tracing and fixing a semantic compiler bug,
* redesigning concurrent API operations safely,
* fixing protocol translation across providers,
* addressing a performance bottleneck in a production editor,
* implementing a platform protocol correctly,
* debugging state synchronization or concurrency,
* correcting subtle browser/runtime behavior,
* or changing architecture with strong regression coverage.

A large CSS diff or mechanical rule port can still be useful, but should not receive the same career score.

## 3. Do not confuse acceptance with value

A 95% chance of merging a trivial fix does not automatically beat a 65% chance of merging a substantial contribution.

Acceptance probability is important because unreviewed work has little external value.

But acceptance probability is a multiplier on useful work, not the final objective.

## 4. Separate accessibility from network value

Do not use one combined "Maintainer and Network Upside" score.

Use two different concepts:

### Maintainer Accessibility

How likely is a good external contributor to:

* receive review,
* get useful feedback,
* have discussions,
* and become recognizable through repeated good work?

### Professional Network Value

If the contributor becomes known in this community, how valuable could those relationships be professionally?

Consider:

* ecosystem relevance,
* maintainer roles,
* companies involved,
* adjacent projects,
* hiring/network effects,
* and whether repeat contributors actually enter the project's social orbit.

A famous maintainer who rarely interacts with contributors does not automatically produce high network value.

A less-famous maintainer who deeply reviews contributors may have high accessibility.

## 5. Distinguish proactive hunting from opportunistic contribution

Some repositories are poor places to search for random issues but excellent places to contribute when the contributor personally encounters a bug.

For every repository classify it as one of:

* **Proactive Target**
* **Repeat-Contributor Target**
* **Stretch Target**
* **Opportunistic Only**
* **Skip**

Examples of reasons for `Opportunistic Only`:

* huge issue/PR competition,
* contributor already has unusually strong product intuition,
* good fixes are valuable but disappear quickly,
* difficult to find uncontested work proactively.

Do not reject such repositories outright.

## 6. Reward coherent trajectories

Repeated substantial work in one ecosystem can be more valuable than isolated work across many repositories.

Look for possible trajectories such as:

> easy entry issue → substantive issue → recognized recurring contributor

or:

> ecosystem library → adjacent tooling → deeper core contribution

or:

> familiar project → reviewed contribution → harder architectural contribution

The scout should identify these explicitly.

---

# Step 1 — Collect the Projects

Make a list of all candidate projects from Input 1.

For each project record:

* repository URL,
* source of discovery,
* whether the contributor actively uses it,
* whether the contributor has its source checked out,
* relevant languages,
* and broad project category.

Deduplicate forks, mirrors, renamed repositories, and duplicate inventory entries.

---

# Step 2 — Cluster and Triage

Do not deeply inspect every repository.

Group related projects into clusters such as:

* AI developer tooling
* terminals and shells
* compilers and language tooling
* browser tooling/extensions
* infrastructure/networking
* CLI utilities
* editors
* Python tooling
* Rust systems software
* web frameworks
* media tooling
* desktop Linux
* other relevant clusters

Use the contributor profile to prioritize clusters.

Do not reject a project solely because its main language is unfamiliar.

Instead estimate:

* **Domain Fit**
* **Onboarding Cost**
* **Potential Career Value**

Skip projects where all three are poor.

Skip giant monorepos only when the likely payoff is weak relative to the onboarding friction.

A difficult monorepo with unusually strong technical or professional upside may remain a Stretch Target.

---

# Step 3 — Investigate Clusters in Parallel

Use one subagent for each cluster.

Give each subagent a non-overlapping set of repositories.

Each subagent performs Steps 4 through 8.

Run subagents concurrently where supported.

Do not run the entire investigation through one agent when multiple clusters exist.

Require every subagent to return:

* repository-level findings,
* issue-level findings,
* rejected repositories,
* unresolved uncertainties,
* and evidence.

---

# Step 4 — Evaluate Repository Reality

Use current GitHub data.

Prefer the `gh` CLI and GitHub API.

Useful commands include:

* `gh repo view`
* `gh pr list`
* `gh issue list`
* `gh api`

Avoid wasting search API quota.

Use activity primarily from the last **30–90 days**.

Historical evidence can be used when necessary, but label it as historical.

## Contribution policy

Read:

* CONTRIBUTING
* README contribution sections
* issue templates
* PR templates
* relevant maintainer comments

Do not trust obviously stale contribution warnings without comparing them against current behavior.

Current merge behavior takes precedence over old prose when they conflict.

## Sample recent merged PRs

Inspect approximately 40–100 recent merged PRs when the repository has enough activity.

Determine:

* how many were internal/core team,
* how many were bots,
* how many came from outside contributors,
* how many came from apparent first-time contributors,
* how many external contributions were substantive,
* review latency,
* merge latency,
* maintainer interaction quality.

Do not count dependency bots as contributor friendliness.

Do not count typo/documentation-only external PRs as proof that substantive outside contributions are welcomed.

## Repository classifications

Assign each repository:

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
* Skip

---

# Step 5 — Reject or Downgrade Bad Targets

Reject or heavily downgrade a repository when current evidence shows:

* unsolicited external PRs are normally rejected;
* external contributors rarely receive substantive merges;
* almost all recent merges come from bots or core team members;
* contributions regularly sit untouched for long periods;
* contribution policy requires access the contributor cannot obtain;
* issues are routinely claimed before outside contributors can act;
* maintainers have effectively abandoned issue triage;
* work requires proprietary infrastructure unavailable to the contributor.

Do not automatically reject a repository merely because:

* it has many open PRs,
* it is large,
* it has difficult code,
* or the contributor does not know the main language.

Those should affect Competition or Onboarding Cost instead.

---

# Step 6 — Find Candidate Issues

Search open issues in repositories that survived Step 5.

Do not restrict discovery to:

* `good first issue`
* `help wanted`

Search for:

* correctness bugs
* regressions
* performance problems
* concurrency problems
* state-management bugs
* protocol incompatibilities
* provider translation bugs
* networking problems
* parser/compiler bugs
* platform-specific problems
* integration failures
* architecture problems
* important missing behavior
* issues with maintainers proposing a likely solution
* reproducible bugs without an existing implementation
* recent high-interest issues
* older issues that remain relevant and actionable

## Reject an issue when

* someone is actively assigned and working on it;
* a current PR already addresses it;
* another contributor has clearly claimed it;
* it is stale and maintainers appear uninterested;
* it is too vague to scope;
* it needs unavailable proprietary infrastructure;
* it is a speculative feature with no maintainer support;
* solving it would mostly be typo/documentation work;
* it is obviously mechanical and provides little strategic benefit;
* it would require months of full-time work before producing reviewable value.

An assigned issue may remain only when maintainers explicitly invite parallel/external implementation.

## Prefer issues where

* maintainers confirmed the bug;
* maintainers described the likely shape of the fix;
* the issue is reproducible;
* expected behavior is clear;
* relevant tests exist;
* no competing PR exists;
* the contributor has relevant product intuition;
* the contribution creates a strong engineering story;
* the issue opens a pathway to deeper work in the same ecosystem.

---

# Step 7 — Perform a Feasibility Pass Before Scoring Highly

Do not rank an issue highly from its title and discussion alone.

For serious candidates inspect enough code to answer:

* Where does the bug likely live?
* What subsystem is involved?
* What files/modules are likely relevant?
* Is the apparent solution local or architectural?
* Are there tests near the behavior?
* What hidden complexity may exist?
* Does the issue underestimate the work?
* Would the contributor need special hardware/accounts/services?
* Is the maintainer's proposed approach compatible with current architecture?

Do not implement the issue.

This is reconnaissance only.

If the real scope cannot be determined, explicitly lower confidence.

---

# Step 8 — Score Each Candidate

Scores are 0–10.

Avoid fake precision.

Do not pretend that an 8.63 issue is meaningfully better than an 8.51 issue.

Use whole numbers or half-points where helpful.

For each score give evidence.

## A. Career Signal — 30%

Ask:

> If this is successfully merged and explained well in an interview, how strong is the engineering story?

Consider:

* technical substance,
* production relevance,
* architectural depth,
* project credibility,
* generalizability to professional engineering,
* whether the work distinguishes the contributor from ordinary student projects.

Do not over-score trivial changes merely because the repository is famous.

## B. Pull Request Acceptance Probability — 25%

Estimate the chance that a **high-quality implementation** would be merged.

Consider:

* current outside merge history,
* maintainer endorsement,
* issue ownership,
* competing PRs,
* project philosophy,
* review responsiveness,
* scope clarity,
* testability.

Give a broad percentage range only when useful, such as:

`7/10 — roughly 60–75% if the proposed approach is accepted`

State that the percentage is an estimate.

## C. Maintainer Accessibility — 15%

How likely is good work to receive:

* review,
* substantive feedback,
* discussion,
* recognition,
* and eventually contributor trust?

## D. Professional Network Value — 10%

How useful could becoming known in this project's contributor ecosystem be professionally?

Do not infer this purely from repository fame.

## E. Technical Depth — 10%

Evaluate actual engineering depth.

Possible high-depth areas include:

* compilers/parsers
* concurrency
* distributed systems
* networking
* protocol design
* streaming
* platform integration
* terminal internals
* browser internals
* rendering
* performance
* state synchronization
* authentication
* complex compatibility work

A large diff is not automatically deep.

## F. Personal Advantage — 5%

This replaces broad "Personal Fit."

Score only the contributor's **special advantage** relative to another capable engineer:

* they actively use the software;
* they understand the failure mode firsthand;
* they know adjacent technologies;
* they previously built something similar;
* they already know the ecosystem.

Do not heavily reward mere language familiarity.

The contributor can learn.

## G. New-Contributor Friendliness — 5%

Measure substantive new-contributor acceptance using recent evidence.

Distinguish:

* tiny drive-by fixes
  from
* meaningful code contributions.

---

# Additional Non-Weighted Metrics

Record separately:

## Competition

0–10

`0 = effectively uncontested`
`10 = extremely likely to attract duplicate work`

## Onboarding Cost

0–10

Consider:

* codebase size,
* unfamiliar language,
* build complexity,
* architecture,
* test environment,
* domain knowledge.

## Scope Risk

0–10

How likely is the issue to expand far beyond what it initially appears to require?

## Estimated Time to a Meaningful PR

Use broad ranges:

* <1 day
* 1–3 days
* 3–7 days
* 1–2 weeks
* 2–4 weeks
* > 1 month

Assume strong AI coding agents are available, but the contributor must personally understand and review the work.

Do not treat AI as eliminating:

* architecture learning,
* reproduction work,
* build setup,
* debugging,
* review cycles,
* or maintainer communication.

---

# Step 9 — Calculate Strategic Value

Compute a base weighted score from Step 8.

Then apply qualitative adjustments.

## Penalize

* extreme competition
* large scope uncertainty
* very high onboarding cost without corresponding payoff
* issue likely to be claimed before implementation
* unclear maintainer intent
* trivial work masquerading as high value
* famous project but weak external review
* mechanical implementation with little interview value

## Boost

* unusually strong engineering story
* explicit maintainer request for help
* natural follow-up opportunities
* credible pathway to repeat contribution
* issue aligns with contributor's firsthand knowledge
* contribution demonstrates a capability absent from the contributor's existing portfolio
* contribution would diversify the contributor's technical evidence

Explain every meaningful manual override.

---

# Step 10 — Assign Each Issue a Strategic Role

Every recommended issue must receive one role.

## Fast Credibility Win

Small-to-medium scope, high acceptance probability, useful external validation.

This should still be real engineering.

Do not recommend multiple trivial wins merely to build activity.

## Core Contribution

Strong balance of technical signal, acceptance probability, and review opportunity.

These are usually the highest-value targets.

## Ecosystem Entry

A deliberately bounded first contribution that creates a realistic path toward deeper work in a valuable project.

The value lies partly in what it enables next.

## Repeat-Contributor Opportunity

Best when the contributor already has one contribution in the project or when the issue naturally follows earlier work.

## Technical Stretch

Higher onboarding cost or technical difficulty, but unusually strong career signal.

## Opportunistic High-Upside

Excellent contribution when the contributor naturally finds/reproduces the problem, but poor for proactive issue hunting because of competition or timing.

Do not compare all roles as if they serve the same purpose.

---

# Step 11 — Build Contribution Trajectories

After ranking individual issues, identify 2–4 plausible trajectories.

Examples:

### Trajectory A — Become known in one ecosystem

1. bounded entry issue
2. substantive follow-up
3. deeper architectural contribution

### Trajectory B — Technical depth

1. manageable contribution in unfamiliar systems language
2. harder production issue
3. major stretch contribution

### Trajectory C — Opportunistic user advantage

Keep using a crowded project normally.
When the contributor personally discovers a reproducible bug, investigate and move quickly.

A trajectory is more valuable than three unrelated easy PRs when it creates:

* repeat maintainer recognition,
* coherent technical identity,
* or increasing engineering depth.

---

# Step 12 — Adversarial Audit of the Finalists

Before publishing the final ranking, take the top approximately 8–12 issues and challenge them.

Use a separate subagent when available.

For every finalist ask:

* Is this issue still open?
* Is it still unclaimed?
* Did a PR appear during the research?
* Did someone comment intent to implement it?
* Is the repository really accepting external code right now?
* Are recent first-time contributors doing substantive work?
* Is the expected fix actually as bounded as claimed?
* Is the career score inflated because the project is famous?
* Is the network score inflated because the maintainer is famous?
* Is the issue easy but strategically mediocre?
* Is the issue technically impressive but so risky that expected value is poor?
* Is there a better issue in the same repository?
* Does this duplicate technical evidence already obvious from the contributor's portfolio?

Downgrade candidates when the audit exposes weak assumptions.

This step exists specifically to prevent attractive but shallow rankings.

---

# Step 13 — Write the Report

Write the factual report content before rendering HTML.

The report must include six parts.

---

## Part 1 — Executive Findings

Briefly state:

* strongest ecosystem for repeated contribution;
* strongest technical stretch target;
* strongest high-acceptance meaningful issue;
* strongest opportunistic project;
* major repositories that looked attractive but were rejected;
* the biggest uncertainty in the research.

Do not merely repeat the numeric ranking.

---

## Part 2 — Top Contribution Opportunities

Return approximately 6–12 genuinely strong issues.

Do not fill the list to an arbitrary count.

For every issue include:

### Project / Issue

**Repository:**
**Issue URL:**
**Strategic role:**
**Overall assessment:** Strong / Very Strong / Exceptional / Conditional

**Why it matters**

Explain the engineering and career value in 2–4 sentences.

**Career Signal:** X/10
Evidence and interview story.

**Acceptance Probability:** X/10
Approximate range if justified.
Evidence.

**Maintainer Accessibility:** X/10
Evidence.

**Professional Network Value:** X/10
Evidence.

**Technical Depth:** X/10
Explain what makes the engineering difficult.

**Personal Advantage:** X/10
Explain contributor-specific advantage.

**New-Contributor Friendliness:** X/10
Use recent substantive contribution evidence.

**Competition:** X/10
**Onboarding Cost:** X/10
**Scope Risk:** X/10
**Estimated Effort:** range

**Likely subsystem/files**

List likely areas based on reconnaissance.

**Likely implementation shape**

Give a concise hypothesis.

Do not implement it.

**What this would prove**

State explicitly what the merged contribution would demonstrate to an employer or maintainer.

**Risks**

Be candid.

**Next step**

Choose one:

* reproduce locally;
* inspect specific subsystem;
* ask maintainer before coding;
* comment with proposed approach;
* ready to implement;
* wait for personal reproduction;
* skip unless circumstances change.

---

## Part 3 — Best Repositories for Repeated Contribution

Rank approximately 5–10 repositories separately from the issue ranking.

For each include:

* Recommended role
* Maintainer accessibility
* External contribution health
* Technical reputation potential
* Professional network potential
* Competition
* Contributor-specific advantage
* Why repeated work here could or could not compound

Use tags such as:

* Best ecosystem to become known in
* Best technical reputation
* Best balance
* Highest acceptance
* High upside / high competition
* Opportunistic only
* Best stretch ecosystem

Do not rank repositories based solely on the best currently open issue.

---

## Part 4 — Contribution Trajectories

Give 2–4 strategic lanes.

Prefer structures such as:

### Lane 1 — Recognition

Become a recurring contributor in one ecosystem.

### Lane 2 — Engineering Depth

Target one technically difficult contribution that expands the contributor's demonstrated range.

### Lane 3 — Opportunistic

Continue using crowded familiar projects and move quickly only when the contributor personally finds a strong bug.

Do not recommend accumulating trivial PRs for appearance.

---

## Part 5 — Skip / Deprioritize List

Include rejected and downgraded repositories.

For each give the current reason:

* effectively closed to outside PRs
* bot/internal-team dominated
* huge competition
* weak maintainer response
* no good issue currently available
* poor fit relative to opportunity cost
* issue pool dominated by trivial work
* excessive onboarding for weak payoff
* better treated opportunistically
* contribution policy requires prior invitation

Distinguish:

`Bad repository for contributing`

from:

`Good repository, bad place to proactively hunt today`

This distinction is important.

---

## Part 6 — Research Confidence

State:

* research date,
* sample windows,
* number of recent PRs inspected where relevant,
* any rate-limit problems,
* any repositories where evidence was thin,
* issues whose availability may change quickly.

Do not hide uncertainty behind precise scores.

---

# Step 14 — Evidence Rules

Give a URL for every important external claim.

Use:

* actual issue pages,
* actual PRs,
* merge history,
* CONTRIBUTING files,
* maintainer discussions,
* release notes,
* GitHub API data.

Do not rely primarily on:

* repository stars,
* search snippets,
* generic project descriptions,
* stale README comments,
* old contribution policies contradicted by current behavior.

For first-time contributor friendliness, inspect recent merges rather than guessing.

For maintainer responsiveness, sample actual review timelines.

For professional network value, explain the inference instead of presenting it as objective fact.

---

# Step 15 — Render and Publish

Load the `html-communication` skill.

Give one subagent the completed factual report.

The HTML subagent must not:

* change scores,
* change ranking,
* invent evidence,
* add unsupported claims,
* or re-evaluate repositories.

Its job is presentation only.

Follow the `html-communication` skill for design and publishing.

Upload to Postplan.

Return the Postplan URL to the user.

---

# Final Quality Test

Before finishing, ask:

1. Did we accidentally reward easy merges over meaningful engineering?
2. Did we overrate a famous repository or maintainer?
3. Did we confuse maintainer accessibility with professional network value?
4. Did we mistake language familiarity for career value?
5. Did we recommend small PRs merely to create visible activity?
6. Did we distinguish proactive targets from opportunistic projects?
7. Did we inspect code enough to challenge the apparent scope?
8. Did we check whether every recommended issue is still available?
9. Does each high-ranked issue add something meaningful to the contributor's existing proof of work?
10. Is there a coherent path from these contributions to external recognition or employment?

If the answer to any of these is no, revise the report before publishing.

