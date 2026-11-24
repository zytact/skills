# Rating

Two raters from different model families score every item that passed the hard filters, each on its own. Two families cancel out each other's blind spots, and where they disagree by 3 or more points, the item gets flagged.

## The raters

Run each rater as a T3 Code `delegate_task` child, a new task for each run:

- Opus 5.5 at medium effort, through the Claude provider.
- Gemini 4 Neon at `thought_level` medium, through the Antigravity provider.

Find the provider instances with `orchestrator_capabilities`. If one is unavailable, tell the user and stop. Don't swap models. Outside T3 Code, run them as your own sub-agents and say so. Each rater writes only its own file, `scores_<rater>.json`. State that ownership in both tasks.

Rate different item types (sweatshirts, denim jackets, shoes) as separate pools with separate briefs, and rank each pool on its own. A score only means something against the brief it was given.

## The item sheet

Write one Markdown file per pool that lists, for every item: id, brand, name, color, the garment measurements of the user's size, the listed material, the seller's description, the buyer polls, the reviews, and the paths of its 2 saved photos. Leave out price and the star rating, so the raters judge the garment and not the deal.

## The brief

Build it from the profile, then add the request:

1. **The person and the goal.** Their size and body measurements, the fit rule as garment measurements, the looks that work and the ones to avoid, and any goal for this search.
2. **What to look at.** The item sheet path, and an instruction to open every photo. No looking things up online.
3. **Order of trust.** Buyer reviews and polls beat the seller's description, which beats the listed material. A poll is many buyers at once, so it counts more than one review. Ignore reviews about another color or another product. Photos decide how an item looks. Few or no reviews means more doubt, so no high warmth or quality score from the listing alone.
4. **Scoring.** A 1-10 score for each factor that matters for this pool, and an `overall` 1-10 that is a judgment of the whole goal, not an average. Name which factors weigh most. Ask for strict use of the whole range, with 9 and 10 rare.
5. **Reasons.** For every factor, one reason of at most 20 words. When the score is 8 or more, it says what earned it. Below 8, it says what held it back. Each reason starts with its source in brackets: `[review]`, `[poll]`, `[photo]`, `[description]`, `[listing]` or `[measurements]`, using the most trusted source that supports it. Plus `better`: one sentence on what would have to change to score higher.
6. **Output.** One JSON array, every item present, and no other file touched:

```json
[{"id": 34694912, "overall": 7, "scores": {"fit": 7, "warmth": 5}, "reasons": {"fit": "[poll] 69% of 16 buyers say just right.", "warmth": "[review] Buyers call it light, for mild cold only."}, "better": "A heavier fleece back."}]
```

Ask for scores and reasons in the same run. Explaining scores after the fact means a second run per rater.

## Ranking

`scripts/rank.mjs` turns each rater's `overall` scores into standard scores, so a rater who scores everything higher doesn't count for more, then ranks by their mean. Ties break on the raw average, then on the star rating pulled toward 4.0 by 150 phantom ratings, so a 4.8 from 12 ratings doesn't beat a 4.4 from 3,000. It prints the agreement between the first two raters (a correlation) and flags splits of 3 or more points. Below about 0.6 agreement, re-read the brief for something ambiguous before trusting the ranking.
