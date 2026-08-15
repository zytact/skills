---
name: oss-contribution-scout
description: Scout issues for OSS Contribution
disable-model-invocation: true
---

# Open-Source Contribution Scout

## Purpose

This skill finds the best open-source contributions for one contributor.
Find issues with career value, technical depth, and a good chance of merge.
Match the issues to the contributor's skills and goals.
Do not try to make the count of pull requests high.
It is better to give 8 excellent issues than 15 weak ones.

## Input

The user gives two dynamic inputs.

Input 1 is the project set. It is a list of projects or repositories.
It can also be a URL that lists the projects.

Input 2 is the contributor profile. It has the contributor's skills, level,
and goals.
Ask the user for the profile when the user does not give it.
Use the profile in Step 2 and in the Personal Fit score.

## Step 1 - Collect the projects

Make a list of all candidate projects from Input 1.
Keep the source link for each project.

## Step 2 - Scope the projects and make clusters

Do not examine every project in full.
Group the projects by the type of work.
Keep the projects that fit the contributor's skills.
Skip the projects that do not fit the contributor's skills.
Skip large monorepos with high friction and weak fit.
Make one cluster for each group of related projects.

## Step 3 - Investigate the clusters with subagents

Use one subagent for each cluster.
Give each subagent a different cluster. Then the subagents do not collide.
Run all the subagents at the same time.
Each subagent does Step 4, Step 5, and Step 6 for its cluster.
Each subagent returns the scored issues and the rejected repositories.
Do not run the whole job in one agent when there are many clusters.

## Step 4 - Reject unwelcoming repositories (subagent task)

Check each repository before you trust it.
Use the gh CLI for all GitHub data.
Use `gh pr list`, `gh issue list`, `gh repo view`, and `gh api`.
Do not use `gh search` more than necessary. Its rate limit is low.
Use only data from the last 30 to 90 days.
Read the CONTRIBUTING file first.
Reject the repository when the CONTRIBUTING file refuses outside pull requests.
Read the last 40 to 100 merged pull requests.
Reject the repository when a bot or the internal team wrote almost all merges.
Reject the repository when one maintainer blocks all outside work.
Reject the repository when a bot closes unassigned pull requests fast.

## Step 5 - Find and filter candidate issues (subagent task)

Find open issues in the good repositories.
Reject an issue when a person already claimed it.
Reject an issue when an open pull request already fixes it.
Reject an issue when it is stale.
Reject an issue when it is vague.
Prefer an issue when a maintainer wrote the shape of the fix.
Prefer a project that the contributor uses.

## Step 6 - Score each issue (subagent task)

Give each issue a score from 0 to 10 on each dimension below.
Then give one overall score. Use these weights:

- Career Signal: 25 percent
- Pull Request Acceptance Probability: 20 percent
- Maintainer and Network Upside: 20 percent
- Personal Fit: 15 percent
- Technical Complexity: 10 percent
- New Contributor Friendliness: 10 percent

Score Personal Fit against the contributor profile from Input 2.
Also record Competition and Time to a Meaningful Pull Request for each issue.

## Step 7 - Merge and rank all findings

Collect the results from all the subagents.
Put all the scored issues in one list.
Rank the list by the overall score.
You can change the rank by judgment. State the reason when you do this.

## Step 8 - Write the report content

Write the report as plain content first.
Include these four parts:

1. The top issues, in rank order. Use one card for each issue.
   Each card has the scores, the effort, and these fields:
   why it is interesting, the acceptance evidence, the likely files,
   the approach, the risks, and the next step.
2. The best projects overall, in rank order, with a short tag for each.
3. A skip list of the rejected repositories, with the reason for each.
4. A portfolio strategy that groups the work into a few lanes.

Give a link for each important claim.
Use the pull request merge history and the review speed as evidence.
Do not trust the star count alone.

## Step 9 - Render and publish the report

Load the `html-communication` skill.
Use one subagent to build the HTML file. Give it all the report content.
Obey the `html-communication` skill for the design.
That skill uploads the file to Postplan.
Give the Postplan URL to the user.
