---
name: compress-videos
description: Shrink phone videos for cloud storage with no visible quality loss, keeping their metadata (dates, GPS, camera model). Use when asked to compress, shrink or reduce the size of videos, or to find duplicate videos.
---

# Compress videos

Re-encodes videos to HEVC on the NVIDIA GPU (`hevc_nvenc`). Each video gets the strongest compression whose sample still scores SSIM ≥ 0.98 against the original. Originals are never touched. Results go to `<dir>/compressed/` under the same names.

The scripts live in `scripts/` next to this file. Run Python with `python3 -I`.

## Steps

1. **Pick the folder.** Default to the Windows Downloads folder, `/mnt/c/Users/<user>/Downloads`. Confirm that `ffmpeg`, `ffprobe`, `exiftool` and `python3` exist. If any are missing, give the user `sudo apt install -y ffmpeg libimage-exiftool-perl` to run and wait.
2. **Check for duplicates.** Run `dupes.py <dir>`. It prints `IDENTICAL` for byte-identical files and `SHARED` for files that share footage. Show the pairs to the user and let them decide what to drop. Deleting anything is their call.
3. **Compress.** Run `compress-dir.sh <dir>` in the background. It handles one video at a time, because WSL has about 2 GB of RAM and running several in parallel fails with decode errors. Each video prints one line:
   - `OK`: written, with size before/after, the CQ it picked, and full-length SSIM (average and worst frame).
   - `SKIP`: under 15% smaller, or no setting kept quality. The original is fine to keep as is.
   - `FAIL`: a check failed, and nothing was written. Report the reason.
   - `EXISTS`: already compressed in an earlier run.
4. **Report.** Show a table of every video with its before/after size, the total saved, and any `SKIP` or `FAIL` lines. Tell the user to watch a few files before deleting originals.

## What compress.sh guarantees

Before it writes the output, it checks:

- The key tags match the original: dates, GPS, make/model, lens, software, Samsung and Android tags, rotation, size.
- Frame timestamps are identical.
- The whole file decodes with full-length SSIM ≥ 0.97.

HDR (HLG/PQ) videos stay 10-bit HDR. These don't survive and can't: iPhone per-frame tracks (face boxes, Live Photo sync, scene brightness), the Dolby Vision layer (the video plays as plain HLG HDR), and two internal Apple maker-note tags. Mention this when iPhone videos are in the batch.

Samsung stores its model name in private `udta` atoms that exiftool can't write. `udta.py` copies them across as raw bytes.
