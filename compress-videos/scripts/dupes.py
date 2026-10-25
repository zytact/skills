"""Usage: python3 -I dupes.py <dir>

Reports videos in <dir> that are byte-identical, or that share footage (one is a trim or re-export of another).
Shared footage is found by fingerprinting one frame per second at 32x32 grayscale.
"""
import hashlib
import itertools
import subprocess
import sys
from pathlib import Path

EXTS = {".mp4", ".mov", ".m4v"}
FRAME = 32 * 32
MAX_DIFF = 6  # mean absolute pixel difference that still counts as the same frame
MIN_SHARED = 3  # matching frames needed to report a pair


def md5(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        while chunk := f.read(1 << 20):
            h.update(chunk)
    return h.hexdigest()


def fingerprint(path: Path) -> list[bytes]:
    raw = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(path), "-an",
         "-vf", "fps=1,scale=32:32,format=gray", "-f", "rawvideo", "-"],
        capture_output=True, check=True,
    ).stdout
    return [raw[i:i + FRAME] for i in range(0, len(raw) - FRAME + 1, FRAME)]


def shared(a: list[bytes], b: list[bytes]) -> int:
    def close(x: bytes, y: bytes) -> bool:
        return sum(abs(p - q) for p, q in zip(x, y)) / FRAME < MAX_DIFF
    return sum(any(close(fa, fb) for fb in b) for fa in a)


videos = sorted(p for p in Path(sys.argv[1]).iterdir() if p.suffix.lower() in EXTS)

hashes = {v.name: md5(v) for v in videos}
by_hash: dict[str, list[str]] = {}
for name, digest in hashes.items():
    by_hash.setdefault(digest, []).append(name)
for names in by_hash.values():
    if len(names) > 1:
        print("IDENTICAL", " | ".join(names))

prints = {v.name: fingerprint(v) for v in videos}
for (a, fa), (b, fb) in itertools.combinations(prints.items(), 2):
    if hashes[a] != hashes[b] and (n := shared(fa, fb)) >= MIN_SHARED:
        print(f"SHARED {n}/{len(fa)}s of {a} appear in {b} ({len(fb)}s)")
