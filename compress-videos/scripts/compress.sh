#!/usr/bin/env bash
# Usage: compress.sh <input> <output>
# Encodes one video to HEVC on the GPU at the highest CQ whose 20s sample keeps SSIM >= MIN_SSIM,
# restores the original's metadata, then checks the result. Writes <output> only if every check passes.
# Exit codes: 0 written, 3 skipped (not worth it), 1 failed a check.
set -euo pipefail
in=$(realpath -- "$1"); out=$2
name=$(basename -- "$in")
trap 'echo "FAIL $name: unexpected error on line $LINENO"' ERR
here=$(dirname -- "$(realpath -- "$0")")
min_ssim=${MIN_SSIM:-0.98}
tmp=$(mktemp -d); trap 'rm -rf -- "$tmp"' EXIT
ext=${in##*.}

probe() { ffprobe -v error -select_streams v:0 -show_entries "stream=$1" -of default=nw=1:nk=1 -- "$in"; }
trc=$(probe color_transfer)
timescale=$(probe time_base | cut -d/ -f2)
if [[ $trc == arib-std-b67 || $trc == smpte2084 ]]; then
  color=(-profile:v main10 -pix_fmt p010le -color_primaries bt2020 -color_trc "$trc" -colorspace bt2020nc)
else
  color=(-profile:v main -pix_fmt yuv420p)
fi

enc() { # enc <cq> <src> <dst> [extra ffmpeg args...]
  local cq=$1 src=$2 dst=$3; shift 3
  ffmpeg -nostdin -hide_banner -v error -y -noautorotate -i "$src" -map 0:v:0 "$@" \
    -c:v hevc_nvenc -preset p7 -tune hq -rc vbr -cq "$cq" -b:v 0 \
    -spatial_aq 1 -temporal_aq 1 -rc-lookahead 32 -bf 3 -multipass qres \
    "${color[@]}" -tag:v hvc1 -fps_mode passthrough -enc_time_base:v demux -video_track_timescale "$timescale" \
    -map_metadata -1 -- "$dst"
}

# Frame-by-frame SSIM matched by frame index. Prints "<avg> <worst>", or "ERR <message>" on a decode error.
ssim() {
  local log=$tmp/ssim.log stats=$tmp/ssim.txt err
  ffmpeg -nostdin -hide_banner -v error -threads 2 -noautorotate -i "$1" -threads 2 -noautorotate -i "$2" -lavfi \
    "[0:v]setpts=N,settb=1,format=yuv420p10le[a];[1:v]setpts=N,settb=1,format=yuv420p10le[b];[a][b]ssim=shortest=1:stats_file=$stats" \
    -an -fps_mode passthrough -f null - 2>"$log" || true
  err=$(grep -vE 'non monotonically|Last message repeated' "$log" | head -1 || true)
  [[ -z $err ]] || { echo "ERR $err"; return; }
  awk '{for (i = 1; i <= NF; i++) if ($i ~ /^All:/) { split($i, a, ":"); s += a[2]; n++; if (m == "" || a[2] < m) m = a[2] }}
       END { if (n) printf "%.4f %.4f\n", s / n, m; else print "ERR no frames compared" }' "$stats"
}

dur=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 -- "$in")
ss=$(awk -v d="$dur" 'BEGIN { s = d / 2 - 10; print (s < 0 ? 0 : s) }')
ffmpeg -nostdin -v error -y -ss "$ss" -noautorotate -i "$in" -t 20 -map 0:v:0 -c copy -- "$tmp/sample.$ext"

cq=
for c in 34 32 30 28 26 24 22; do
  enc "$c" "$tmp/sample.$ext" "$tmp/s.$ext"
  read -r avg _ < <(ssim "$tmp/s.$ext" "$tmp/sample.$ext")
  if awk -v s="$avg" -v m="$min_ssim" 'BEGIN { exit !(s + 0 >= m) }'; then cq=$c; break; fi
done
[[ -n $cq ]] || { echo "SKIP $name: no CQ keeps SSIM $min_ssim"; exit 3; }

res=$tmp/out.$ext
enc "$cq" "$in" "$res" -map 0:a? -c:a copy
insize=$(stat -c%s -- "$in"); outsize=$(stat -c%s -- "$res")
if (( outsize * 100 > insize * 85 )); then
  echo "SKIP $name: only $(( 100 - outsize * 100 / insize ))% smaller at cq=$cq"; exit 3
fi

python3 -I "$here/udta.py" "$in" "$res" >/dev/null
exiftool -q -m -overwrite_original -TagsFromFile "$in" -All:All --Rotation -- "$res"
touch -r "$in" -- "$res"

fail=()
tags=(-CreateDate -ModifyDate -TrackCreateDate -MediaCreateDate -CreationDate -Make -Model -SamsungModel -Author
      -Software -GPSCoordinates -AndroidVersion -AndroidTimeZone -Rotation -LensModel -ImageSize)
while IFS=$'\t' read -r tag a b; do
  [[ $a == "$b" ]] || fail+=("$tag [$a] vs [$b]")
done < <(paste <(printf '%s\n' "${tags[@]}") <(exiftool -s3 -f "${tags[@]}" -- "$in") <(exiftool -s3 -f "${tags[@]}" -- "$res"))
pts() { ffprobe -v error -select_streams v:0 -show_entries packet=pts_time -of default=nw=1:nk=1 -- "$1" | sort -n | md5sum; }
[[ $(pts "$in") == $(pts "$res") ]] || fail+=("frame timestamps differ")
read -r avg worst < <(ssim "$res" "$in")
if [[ $avg == ERR ]]; then fail+=("decode: $worst")
elif awk -v s="$avg" 'BEGIN { exit !(s < 0.97) }'; then fail+=("full-length SSIM $avg")
fi
if (( ${#fail[@]} )); then printf 'FAIL %s: %s\n' "$name" "${fail[@]}"; exit 1; fi

mv -- "$res" "$out"
echo "OK $name $(( insize / 1000000 ))MB -> $(( outsize / 1000000 ))MB cq=$cq ssim avg=$avg worst=$worst"
