---
name: shop
description: Find clothes and shoes on Indian shopping sites (Myntra, Meesho, Bewakoof, Cahoot, Flipkart, Amazon, Nykaa Fashion) that fit the user's body, sizes and looks, rate them with two independent model raters, and keep a profile of what has worked. Use when the user wants to find or buy clothes, shoes or accessories, asks what would suit them, or tells you about something they bought and how it fit.
---

# Shop

Shopping happens in two places. The **profile** is the source of truth about the user: body, sizes, the looks that work and the ones that don't, and every purchase with how it fit. A **work folder** holds one search: candidates, photos, scores. Chat history gets compacted, so anything worth keeping goes in the profile.

## At the start

1. Read the profile at `$SHOP_PROFILE`. If the variable is unset in this shell, read it from `~/dotfiles/home/dot_config/shell/env.sh`. If the file sits in a git repository, run `git pull --rebase` there first. If it is missing, create it from [PROFILE-FORMAT.md](./PROFILE-FORMAT.md).
2. Read the delivery pincodes from `SHOP_PINCODES` in the environment or in `~/.secrets`. They are comma-separated, and the first is the default. Never write a pincode into the profile, a page or a commit, because the profile repo is public.

A request is either a **purchase report** (the user shares something they bought) or a **search**.

## Purchase reports

A purchase that fit, with its garment measurements, is the best sizing data there is. It beats every general rule.

1. Open the link and record the item, brand, the size bought, that size's garment measurements, the fabric and the price. For Myntra, `node scripts/myntra.mjs <id>` returns all of it.
2. Ask only what the user hasn't said: how the chest, shoulders, length and sleeves fit, how it looks on them, what they changed (rolled sleeves, tailoring, tucked), and whether they would buy it again.
3. Add it under Purchases in the profile. If it moves a rule, edit the rule too. For example, "S at 40.5 inch chest fit right" sets the chest range in Sizes.
4. Commit and push the profile.

## Searches

1. **Brief.** Fill in everything the profile already answers. Ask the rest in one question round, usually budget per item, item types, colors and which pincode if it isn't the default. Don't ask what the profile answers.
2. **Candidates.** Search every site the user names, or all seven by default. Read each site's own JSON through the browser rather than screenshots. Per-site methods, endpoints and known blocks are in [SITES.md](./SITES.md). Work in a new folder in the session's scratch directory.
3. **Hard filters**, before any rating. An item passes only if all of these hold:
   - The user's size is in stock.
   - It delivers to the pincode in that size. Check per size, since sizes ship from different warehouses: one Myntra item delivered in M but not in S.
   - That size's garment measurements match the fit rule in the profile. Names lie, and many "regular fit" listings measure oversized. With no measurements, keep it only if buyer polls or reviews confirm the fit, and flag it.
   - It is within budget. Show near misses in their own list, each with how much it goes over.
   - It has enough ratings to trust, about 100 or more. Keep a zero-review item only as a flagged comparison.
   - Nothing on the profile's avoid list applies.
4. **Evidence.** For each item, save 2 photos to the work folder, and collect the listed material, the seller's description, the buyer reviews and the buyer polls (fit, length, thickness).
5. **Rate** with two independent raters, as [RATING.md](./RATING.md) describes.
6. **Rank** with `node scripts/rank.mjs items.json <rater-a>.json <rater-b>.json > ranked.json`.
7. **Present** the shortlist as a page with the `html-communication` skill. Each card has the photos, link, site, price, the size's garment measurements, the buyer poll, both raters' scores and a "Why this score?" button that opens a dialog with each factor's score, its reason and its source, plus the reviews the raters read. In chat, give the top picks with link, price and the deciding factor, then one line per other site on what it added or why it dropped out.
8. **Learn.** When the user reacts ("too sporty", "I like this collar"), write it to the profile and commit.

When sources disagree, trust buyer reviews and polls first, then the seller's description, then the listed material field. Photos decide how an item looks.

## The profile

Write it the moment you learn something: a stated preference, a size that worked, a look the user rejected twice. Edit a line in place when a preference changes, rather than adding one that contradicts it. Keep it about the user. Facts about one search stay in its work folder. After every change, commit and push, so the user's other machines get it.
