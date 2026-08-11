---
name: postplan
description: When asked to host a standalone html file in postplan, or when reading a URL with postplan.dev.
---

## Uploading
To use postplan to upload the html file just do:
```bash
npx postplan upload <plan.html>
```
where `plan.html` is the path to the html file. The command will then return the URL, which you should show. 

## Reading
Fetch the uploaded HTML with the shell. Do not use web search or a browser.

1. Remove a trailing slash, then append `/raw` unless the URL already ends in `/raw`
2. Run `curl --fail --silent --show-error --location --max-time 30 --output /tmp/postplan.html '<raw-url>'`.
3. Read `/tmp/postplan.html` and continue the user's request from its contents.

If `curl` fails, report its actual status or network error. Do not substitute search results.
