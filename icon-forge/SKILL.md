---
name: icon-forge
description: Design a production-quality SVG logo/icon and export it as PNG in all standard sizes for websites and PWAs — favicons, Apple touch icon, PWA manifest icons, and maskable variants. Use when the user wants to create a logo or icon asset set from scratch.
version: 1.1.0
---

# Icon Forge

You are a logo and icon designer. Your job is to produce a complete icon asset set: a canonical SVG, a maskable SVG variant, and shell commands to rasterize them into every standard size a web project or PWA needs.

---

## Phase 1 — Brief

**Project detection (do this first, before asking questions):**

Silently inspect the working directory for framework signals and determine the project type:

| Signal | Project type | Icon destination |
|---|---|---|
| `next.config.*` or `"next"` in `package.json` deps, AND `app/` dir exists | Next.js App Router | `favicon.ico` → `app/favicon.ico`; all others → `public/icons/` |
| `next.config.*` or `"next"` in `package.json` deps, no `app/` dir | Next.js Pages Router | All → `public/icons/`, `favicon.ico` → `public/favicon.ico` |
| `vite.config.*` present | Vite | All → `public/icons/`, `favicon.ico` → `public/favicon.ico` |
| `react-scripts` in `package.json` deps | Create React App | All → `public/icons/`, `favicon.ico` → `public/favicon.ico` |
| `package.json` present but no framework match | Generic Node/web | All → `public/icons/`, `favicon.ico` → `public/favicon.ico` |
| No `package.json` | Standalone / unknown | Current directory (no subdirectory) |

Confirm the detected type in one line before the brief questions, e.g.: *"Detected: Next.js App Router — icons will go in `public/icons/`, favicon in `app/`."* If detection is ambiguous, add it as a question below.

---

Ask the user the following in a single message before designing anything. Use the question tool if available:

1. **Brand/project name** — what is this icon for?
2. **Style direction** — e.g., minimal, bold, geometric, organic, illustrative, mascot, lettermark
3. **Color palette** — specific hex values, or a mood/theme to derive from
4. **Scope** — favicon only, full PWA icon set, or both?

If you are inside a project directory with a `manifest.json` or visible brand colors, infer what you can and confirm rather than asking blind.

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

**Set destination directories first** — adjust these to match the detected project type (shown at the top):

```bash
# Next.js App Router
ICONS_DIR=public/icons
FAVICON_DIR=app
mkdir -p $ICONS_DIR $FAVICON_DIR
```

```bash
# Next.js Pages Router / Vite / CRA / Generic Node
ICONS_DIR=public/icons
FAVICON_DIR=public
mkdir -p $ICONS_DIR $FAVICON_DIR
```

```bash
# Standalone (no package.json)
ICONS_DIR=.
FAVICON_DIR=.
```

Present only the block that matches the detected project type. The user can override `ICONS_DIR` / `FAVICON_DIR` at the top of the script.

**Files to generate:**

| Output file | Size | Source |
|---|---|---|
| `$ICONS_DIR/favicon-16.png` | 16×16 | `icon.svg` |
| `$ICONS_DIR/favicon-32.png` | 32×32 | `icon.svg` |
| `$ICONS_DIR/favicon-48.png` | 48×48 | `icon.svg` |
| `$ICONS_DIR/apple-touch-icon.png` | 180×180 | `icon.svg` |
| `$ICONS_DIR/icon-64.png` | 64×64 | `icon.svg` |
| `$ICONS_DIR/icon-128.png` | 128×128 | `icon.svg` |
| `$ICONS_DIR/icon-192.png` | 192×192 | `icon.svg` |
| `$ICONS_DIR/icon-256.png` | 256×256 | `icon.svg` |
| `$ICONS_DIR/icon-512.png` | 512×512 | `icon.svg` |
| `$ICONS_DIR/icon-192-maskable.png` | 192×192 | `icon-maskable.svg` |
| `$ICONS_DIR/icon-512-maskable.png` | 512×512 | `icon-maskable.svg` |
| `$FAVICON_DIR/favicon.ico` | 16+32+48 combined | generated PNGs |

**Option A — rsvg-convert (recommended)**

```bash
for size in 16 32 48 64 128 180 192 256 512; do
  out="$ICONS_DIR/icon-${size}.png"
  [[ $size == 180 ]] && out="$ICONS_DIR/apple-touch-icon.png"
  [[ $size == 16 || $size == 32 || $size == 48 ]] && out="$ICONS_DIR/favicon-${size}.png"
  rsvg-convert -w $size -h $size icon.svg -o "$out"
done
rsvg-convert -w 192 -h 192 icon-maskable.svg -o $ICONS_DIR/icon-192-maskable.png
rsvg-convert -w 512 -h 512 icon-maskable.svg -o $ICONS_DIR/icon-512-maskable.png
convert $ICONS_DIR/favicon-16.png $ICONS_DIR/favicon-32.png $ICONS_DIR/favicon-48.png $FAVICON_DIR/favicon.ico
```

**Option B — Inkscape**

```bash
for size in 16 32 48 64 128 180 192 256 512; do
  out="$ICONS_DIR/icon-${size}.png"
  [[ $size == 180 ]] && out="$ICONS_DIR/apple-touch-icon.png"
  [[ $size == 16 || $size == 32 || $size == 48 ]] && out="$ICONS_DIR/favicon-${size}.png"
  inkscape --export-filename="$out" -w $size -h $size icon.svg
done
inkscape --export-filename=$ICONS_DIR/icon-192-maskable.png -w 192 -h 192 icon-maskable.svg
inkscape --export-filename=$ICONS_DIR/icon-512-maskable.png -w 512 -h 512 icon-maskable.svg
convert $ICONS_DIR/favicon-16.png $ICONS_DIR/favicon-32.png $ICONS_DIR/favicon-48.png $FAVICON_DIR/favicon.ico
```

**Option C — ImageMagick only**

```bash
for size in 16 32 48 64 128 180 192 256 512; do
  out="$ICONS_DIR/icon-${size}.png"
  [[ $size == 180 ]] && out="$ICONS_DIR/apple-touch-icon.png"
  [[ $size == 16 || $size == 32 || $size == 48 ]] && out="$ICONS_DIR/favicon-${size}.png"
  convert -background none -resize ${size}x${size} icon.svg "$out"
done
convert -background none -resize 192x192 icon-maskable.svg $ICONS_DIR/icon-192-maskable.png
convert -background none -resize 512x512 icon-maskable.svg $ICONS_DIR/icon-512-maskable.png
convert $ICONS_DIR/favicon-16.png $ICONS_DIR/favicon-32.png $ICONS_DIR/favicon-48.png $FAVICON_DIR/favicon.ico
```

Note: ImageMagick's SVG renderer is less accurate than rsvg-convert or Inkscape. Prefer Option A or B when available.

**Next.js App Router bonus (optional):** Next.js auto-registers `app/icon.png` and `app/apple-icon.png` as metadata icons without any code. To use this:

```bash
cp $ICONS_DIR/icon-512.png app/icon.png
cp $ICONS_DIR/apple-touch-icon.png app/apple-icon.png
```

---

## Phase 4 — manifest.json and HTML

Output a ready-to-paste `manifest.json` `icons` array. Use **separate entries** for `"any"` and `"maskable"` — do NOT use `"any maskable"` (deprecated).

The `/icons/` web path is correct for all frameworks since `public/` maps to the web root:

```json
"icons": [
  { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
  { "src": "/icons/icon-192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
  { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
]
```

**For Next.js App Router** — use the `metadata` API in `app/layout.tsx` instead of raw `<link>` tags:

```ts
// app/layout.tsx
export const metadata: Metadata = {
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
}
```

If you copied `app/icon.png` and `app/apple-icon.png` (optional step above), you can omit the `icons` key entirely — Next.js discovers them automatically.

**For all other frameworks** — provide the HTML `<link>` tags:

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
- [ ] Shell commands for all 11 PNGs + `favicon.ico` (with correct paths for detected framework)
- [ ] `manifest.json` icons array
- [ ] Framework-appropriate icon registration (Next.js `metadata` API or HTML `<link>` tags)
