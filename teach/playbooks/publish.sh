#!/usr/bin/env bash
# Builds every Obsidian vault under $TEACH_HOME and deploys them together to https://teach.zytact.com/<slug>/.
# Usage: [TEACH_HOME=<dir>] publish.sh [extra wrangler deploy args, e.g. --dry-run]
set -euo pipefail

DOMAIN=teach.zytact.com
QUARTZ_TAG=v4.5.2

here=$(cd "$(dirname "$0")" && pwd)
home=$(cd "${TEACH_HOME:-$HOME/Documents/learning}" && pwd)
site=$home/.site

if [[ ! -d $site ]]; then
  git clone --quiet --depth 1 --branch "$QUARTZ_TAG" https://github.com/jackyzha0/quartz.git "$site"
  git -C "$site" apply "$here/quartz.patch"
  (cd "$site" && npm ci --silent)
fi

rm -rf "$site/dist"
links=""
while IFS= read -r -d '' mission; do
  vault=$(dirname "$mission")
  [[ -d $vault/.obsidian ]] || continue
  slug=$(basename "$vault")
  title=$(sed -n 's/^# //p' "$vault/INDEX.md" | head -n 1)
  title=${title:-$slug}
  out=$site/dist/$slug
  [[ ! -e $out ]] || { echo "two vaults are named $slug, rename one" >&2; exit 1; }

  (cd "$site" && QUARTZ_BASE_URL="$DOMAIN/$slug" QUARTZ_PAGE_TITLE="$title" npx quartz build -d "$vault" -o "$out" < /dev/null)
  if [[ -d $vault/exercises ]]; then cp -r "$vault/exercises" "$out/"; fi
  echo '<!doctype html><meta http-equiv="refresh" content="0; url=./INDEX">' > "$out/index.html"
  links+="<li><a href=\"/$slug/\">$title</a></li>"
done < <(find "$home" -mindepth 2 -maxdepth 4 -path "$site" -prune -o -name MISSION.md -print0 | sort -z)

[[ -n $links ]] || { echo "no Obsidian vaults found in $home" >&2; exit 1; }

cat > "$site/dist/index.html" <<EOF
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>teach</title>
<style>body{font:18px/1.6 system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem}</style>
<h1>teach</h1>
<ul>$links</ul>
EOF

cat > "$site/wrangler.jsonc" <<EOF
{
  "name": "teach",
  "compatibility_date": "2026-09-01",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" },
  "routes": [{ "pattern": "$DOMAIN", "custom_domain": true }]
}
EOF

(cd "$site" && npx --yes wrangler@4 deploy "$@")
