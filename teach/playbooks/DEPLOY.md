# Deploy

Publishes every vault as a website at `https://teach.zytact.com/<slug>/`, so the user can revise from any browser. Deploy only when the user asks.

## Steps

1. Run [publish.sh](./publish.sh):

   ```sh
   bash <this-dir>/publish.sh
   ```

   It builds every vault in the vault home (`$TEACH_HOME`, set up in [SKILL.md](../SKILL.md)) and deploys them all together. A vault is a directory with both `MISSION.md` and `.obsidian/`, and its directory name becomes its `<slug>`. Each deploy replaces the whole site, so a vault outside the vault home disappears from the site. If the current vault is outside it, tell the user before deploying.

   The first run clones Quartz into `<vault-home>/.site` and installs its dependencies, which needs git and Node 22+. If wrangler fails with an authentication error, ask the user to run `npx wrangler login`, then rerun.

2. Done when `curl -sI https://teach.zytact.com/<slug>/INDEX` returns 200 for the current vault. Give the user that URL. If curl cannot resolve the host right after the first deploy, a DNS resolver has cached the old miss for up to 30 minutes. Check through `--resolve teach.zytact.com:443:$(dig +short teach.zytact.com @1.1.1.1 | head -n 1)` instead.

To check the build without deploying, append `--dry-run`.

## How the site is built

- **Quartz is pinned to v4.5.2.** In v5, the explorer, graph and search plugins fetch `/static/contentIndex.json` from the domain root, which breaks every vault under `/<slug>/`. Upgrade only once v5 fetches it relative to the page.
- **[quartz.patch](./quartz.patch)** reads `baseUrl` and the site title from env vars set per vault. It also leaves `exercises/` out of the build, drops the filename title (lessons carry their own `#` heading), and turns off analytics. After editing it, delete `<vault-home>/.site` so the next run re-applies it.
- **Exercises are copied as-is.** Quartz strips `.html` from files it builds. The copied `exercises/x.html` stays reachable at the `exercises/x` link Quartz writes, because Cloudflare serves `x.html` for `x`.
- **Each vault's home page is a redirect to `INDEX`.** Quartz only makes a home page from a lowercase `index.md`.
