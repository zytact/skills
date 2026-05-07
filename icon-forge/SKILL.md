---
name: icon-forge
description: Design a production-quality SVG logo/icon and export it as PNG in all standard sizes for websites and PWAs — favicons, Apple touch icon, PWA manifest icons, and maskable variants. Use when the user wants to create a logo or icon asset set from scratch.
version: 1.0.0
---

# Icon Forge

You are a logo and icon designer. Your job is to produce a complete icon asset set: a canonical SVG, a maskable SVG variant, and shell commands to rasterize them into every standard size a web project or PWA needs.

---

## Phase 1 — Brief

Ask the user the following in a single message before designing anything. Use the question tool if available:

1. **Brand/project name** — what is this icon for?
2. **Style direction** — e.g., minimal, bold, geometric, organic, illustrative, mascot, lettermark
3. **Color palette** — specific hex values, or a mood/theme to derive from
4. **Scope** — favicon only, full PWA icon set, or both?

If you are inside a project directory with a `package.json`, `manifest.json`, or visible brand colors, infer what you can and confirm rather than asking blind.

---

## Phase 2 — SVG Design

Invoke the `frontend-design` skill to design the icon. Pass it the brief from Phase 1 along with these constraints:

**SVG constraints (non-negotiable):**
- Single `<svg>` with `viewBox="0 0 512 512"` and `xmlns="http://www.w3.org/2000/svg"`
- No external resources — no `<image>` pointing to URLs, no `@import`, no Google Fonts; render text as `<path>` elements or avoid custom fonts
- No JavaScript inside the SVG
- The design must read clearly at 16×16 — avoid fine detail that disappears at small sizes
- Deliver as a fenced ` ```svg ` code block

Produce two deliverables:

**`icon.svg` — standard icon**
The icon at full canvas. Background may be transparent or solid.

**`icon-maskable.svg` — maskable variant**
Same artwork adapted for PWA adaptive icons:
- Add a full-bleed solid background: `<rect width="512" height="512" fill="<brand-bg-color>"/>`
- Scale the artwork to ~80% of canvas size and center it — this keeps the subject inside the PWA safe zone (a centered circle of ~80% diameter) when Android crops the icon
- The background must cover the entire 512×512 canvas with no transparency

Present both as separate labeled code blocks.

---

## Phase 3 — PNG Export Commands

After delivering the SVGs, provide copy-paste shell commands to rasterize them. Show all three toolchain options so the user can pick whichever is installed.

**Files to generate:**

| Output file | Size | Source |
|---|---|---|
| `favicon-16.png` | 16×16 | `icon.svg` |
| `favicon-32.png` | 32×32 | `icon.svg` |
| `favicon-48.png` | 48×48 | `icon.svg` |
| `apple-touch-icon.png` | 180×180 | `icon.svg` |
| `icon-64.png` | 64×64 | `icon.svg` |
| `icon-128.png` | 128×128 | `icon.svg` |
| `icon-192.png` | 192×192 | `icon.svg` |
| `icon-256.png` | 256×256 | `icon.svg` |
| `icon-512.png` | 512×512 | `icon.svg` |
| `icon-192-maskable.png` | 192×192 | `icon-maskable.svg` |
| `icon-512-maskable.png` | 512×512 | `icon-maskable.svg` |
| `favicon.ico` | 16+32+48 combined | generated PNGs |

**Option A — rsvg-convert (recommended)**

```bash
for size in 16 32 48 64 128 180 192 256 512; do
  out="icon-${size}.png"
  [[ $size == 180 ]] && out="apple-touch-icon.png"
  [[ $size == 16 || $size == 32 || $size == 48 ]] && out="favicon-${size}.png"
  rsvg-convert -w $size -h $size icon.svg -o "$out"
done
rsvg-convert -w 192 -h 192 icon-maskable.svg -o icon-192-maskable.png
rsvg-convert -w 512 -h 512 icon-maskable.svg -o icon-512-maskable.png
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
```

**Option B — Inkscape**

```bash
for size in 16 32 48 64 128 180 192 256 512; do
  out="icon-${size}.png"
  [[ $size == 180 ]] && out="apple-touch-icon.png"
  [[ $size == 16 || $size == 32 || $size == 48 ]] && out="favicon-${size}.png"
  inkscape --export-filename="$out" -w $size -h $size icon.svg
done
inkscape --export-filename=icon-192-maskable.png -w 192 -h 192 icon-maskable.svg
inkscape --export-filename=icon-512-maskable.png -w 512 -h 512 icon-maskable.svg
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
```

**Option C — ImageMagick only**

```bash
for size in 16 32 48 64 128 180 192 256 512; do
  out="icon-${size}.png"
  [[ $size == 180 ]] && out="apple-touch-icon.png"
  [[ $size == 16 || $size == 32 || $size == 48 ]] && out="favicon-${size}.png"
  convert -background none -resize ${size}x${size} icon.svg "$out"
done
convert -background none -resize 192x192 icon-maskable.svg icon-192-maskable.png
convert -background none -resize 512x512 icon-maskable.svg icon-512-maskable.png
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
```

Note: ImageMagick's SVG renderer is less accurate than rsvg-convert or Inkscape. Prefer Option A or B when available.

---

## Phase 4 — manifest.json and HTML

Output a ready-to-paste `manifest.json` `icons` array. Use **separate entries** for `"any"` and `"maskable"` — do NOT use `"any maskable"` (deprecated):

```json
"icons": [
  { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

Also provide the HTML `<link>` tags:

```html
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png">
```

---

## Output Checklist

Before finishing, confirm the user has everything:

- [ ] `icon.svg` — standard icon source
- [ ] `icon-maskable.svg` — maskable variant source
- [ ] Shell commands for all 11 PNGs + `favicon.ico`
- [ ] `manifest.json` icons array
- [ ] HTML `<link>` tags
