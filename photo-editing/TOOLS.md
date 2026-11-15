# Tools

Both CLIs are headless and take one photo per call. On Windows they are not on PATH:

- `C:\Program Files\LightCraft\lightcraft-cli.exe`
- `C:\Program Files\ArtCraft\PhotoCraft\photocraft-cli.exe`

Both gain features with each release. `lightcraft-cli controls` lists every slider with its range, and `photocraft-cli commands --json --filter <text>` gives each command's parameters. Check them before saying an effect is impossible.

Write previews to a temp folder, at a 1400 px long edge. View every render before describing it.

## LightCraft

```
lightcraft-cli render <in> -o <out> --size 1400 --set light.exposure=-0.15 --set mixer.green.hue=-50
```

- It reads HEIC, JPEG and raw. The image viewer cannot read HEIC, so render a preview with no `--set` to see the original.
- Output format follows the extension. Render `.png` when PhotoCraft runs next, so the photo is JPEG-compressed once.
- Leave out `--size` for full size.
- `wb.temp` is absolute Kelvin. 6500 is neutral for a phone photo, higher is warmer.
- A profile is set through a JSON file: `--settings f.json` with `{"profile":{"id":"lc.mono","amount":100}}`. `lightcraft-cli run --demo profiles.list` lists the ids.
- Control groups: `light`, `wb`, `color`, `mixer.<colour>.hue|sat|lum`, `grading.shadows|midtones|highlights.hue|sat`, `curve`, `effects`, `grain`, `vignette`, `bw`, `calibration`, `lensBlur`.

Settings that moved a grade the most:

- `mixer.green.hue` far negative turns foliage olive. `mixer.green.lum` negative deepens it.
- `mixer.blue.sat` near -90 with `mixer.blue.lum` up turns a blue sky cream.
- `mixer.orange.sat` and `mixer.red.sat` control skin. A warm grade needs them lowered by 10 to 30.
- `grading.highlights` carries the warmth. `grading.shadows` sets whether shadows go warm or teal.
- `effects.texture` and `effects.clarity` negative remove the sharp phone-camera look.

## PhotoCraft

```
photocraft-cli run <in> --cmd <id> --params '<json>' --cmd <id> --params '<json>' --out <out> --quality 92
```

- Commands run in order. Each `--params` belongs to the `--cmd` before it.
- One `--out` per call. Saving `.pcraft` keeps the layers, and `photocraft-cli info <file>` prints the layer tree.
- `layer.duplicate` leaves the copy selected, so the commands after it change the copy.
- Blend modes are camelCase: `screen`, `softLight`.
- To debug an effect layer, run the chain without the blend step and view the layer alone.

### Glow

```
--cmd layer.duplicate --params '{"name":"glow"}'
--cmd filter.blur.gaussianBlur --params '{"radius":16}'
--cmd layer.setProps --params '{"blend":"softLight","opacity":0.4}'
--cmd layer.flattenImage
```

Opacity 0.3 to 0.45. Soft light raises saturation and contrast. `screen` in its place washes out the blacks and pales skin.

### Halation

```
--cmd layer.duplicate --params '{"name":"halation"}'
--cmd image.adjustments.levels --params '{"inBlack":225,"inWhite":255}'
--cmd filter.blur.gaussianBlur --params '{"radius":18}'
--cmd image.adjustments.levels --params '{"inBlack":0,"inWhite":28,"gamma":1.2,"red":{"outWhite":255},"green":{"outWhite":95},"blue":{"outWhite":45}}'
--cmd layer.setProps --params '{"blend":"screen","opacity":0.8}'
--cmd layer.flattenImage
```

The four steps isolate the brightest pixels, spread them, boost and tint them red-orange, then add them back.

- The first `inBlack` is the cutoff, set per photo. View the layer alone to confirm it holds the light sources and leaves out the sky.
- The second levels step is required. Blurring spreads the light thin, and without the boost the effect is invisible.
- The per-channel `outWhite` values tint the layer and keep its brightness. Hue/Saturation with `colorize` dims it.

## Image size

Blur radii above are for a 1400 px long edge. For the full-size export, multiply each radius by `long edge / 1400`. A 4032 px photo takes a glow radius of 46 and a halation radius of 52. Opacities and levels stay the same.
