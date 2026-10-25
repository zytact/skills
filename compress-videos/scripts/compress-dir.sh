#!/usr/bin/env bash
# Usage: compress-dir.sh <dir>
# Runs compress.sh on every video in <dir>, one at a time, writing to <dir>/compressed.
# Videos already in <dir>/compressed are skipped, so reruns only pick up new downloads.
set -uo pipefail
dir=$(realpath -- "$1")
here=$(dirname -- "$(realpath -- "$0")")
mkdir -p -- "$dir/compressed"
shopt -s nullglob nocaseglob
for f in "$dir"/*.{mp4,mov,m4v}; do
  name=$(basename -- "$f")
  [[ -e $dir/compressed/$name ]] && { echo "EXISTS $name"; continue; }
  "$here/compress.sh" "$f" "$dir/compressed/$name"
done
