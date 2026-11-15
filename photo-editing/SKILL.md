---
name: photo-editing
description: Edit a photo toward the look of the user's reference photos, with LightCraft and PhotoCraft.
disable-model-invocation: true
argument-hint: "Path to the photo, and any direction you have in mind"
---

The user has given you a photo to edit. They decide by reacting to results, in plain words. You pick every slider.

Editing happens with two CLIs. `lightcraft-cli` does the **grade**: colour, tone, grain. `photocraft-cli` runs after it for layered effects: halation and glow. Read [TOOLS.md](./TOOLS.md) before the first render. It holds the commands, the two effect recipes and the mistakes already made with them.

## The home folder

State lives in `~/Pictures/photo-editing/`, created on first run:

- `references/`: photos whose look the user likes. The user adds to it at any time, so list it every session. A **reference** shows a look to aim at. Its pose, subject and location are irrelevant.
- `looks/*.md`: one file per **look** the user approved, in the format below.
- `TASTE.md`: what the user has said they like and dislike, and which looks suit which scenes. Read it first. Write to it the moment the user states a preference.

## The loop

1. **See the photo.** Render an unedited preview and view it. Name the light (low sun, flat, night, flash), the dominant colours and the flaws: blown highlights, a colour cast, a dark face.

2. **Decide between a correction and a grade.** A **correction** fixes flaws and leaves colour alone. A **grade** changes the colour of the whole photo toward a reference. Choose a correction when colour is the subject: festive clothes, flowers, decorations, a clean vivid phone shot. Choose a grade when the colours are plain, such as greenery, sky, concrete or night streets, so the grade adds something. Say which you chose and why.

3. **Pick the reference.** For a grade, view the references whose light matches the photo's and choose the closest. Check `looks/` for one built from that reference and start from it. Then name what the reference does to each of these: greens, sky, skin, shadows, highlights, contrast, fine detail, grain. Those names are the target. A reference whose look comes from how it was shot, such as direct flash, lens blur or motion blur, is out of reach of editing. Say so and pick another.

4. **Render, compare, repeat.** Render a preview, view it beside the reference, and name each remaining gap in the same terms as step 3. Change the settings for those gaps and render again. Check skin every round, because it turns orange or grey before anything else does. Done when you can name no gap that editing could close, or after five rounds.

5. **Show the candidates.** Show the original beside two to four versions that differ in direction: the correction, the grade, and a stronger or weaker variant. Give a **verdict**: the one you would post and why. The original is always a candidate, and "leave it" is a valid verdict.

6. **Take the reaction.** Translate the user's words into settings and return to step 4. When they state a preference that outlives this photo, write it to `TASTE.md`.

7. **Export.** Once the user picks a version, render it at full size beside the original as `<name>-edited.jpg`. The original file stays untouched. Blur radii scale with image size, so recompute them as TOOLS.md describes.

8. **Save the look.** If the user approved a grade, write or update its file in `looks/`.

## Effects

Halation and glow are per-photo decisions, set by viewing the result:

- **Halation** is the red-orange glow around lamps and bright lights. It suits night and dusk photos with visible light sources. Its brightness cutoff is chosen per photo: too low and the sky glows, too high and nothing does.
- **Glow** is a soft bloom over the whole frame that deepens shadows and softens highlights. It raises saturation, so lower strong colours in the grade before adding it.

## Look format

```markdown
# <name>

Reference: <file in references/>
Suits: <light and scene it works on>
Fails on: <scenes where it was tried and looked wrong>

## What it does
<the step 3 names: greens, sky, skin, shadows, highlights, contrast, detail, grain>

## LightCraft
<one control=value per line, as passed to --set>

## PhotoCraft
<effect, blend mode, opacity, radius at a 1400 px long edge, or "none">

## Per photo
<the settings that had to change for each photo it was used on>
```

A look is a starting point. Exposure, white balance and the settings under "Per photo" are set again for every photo.
