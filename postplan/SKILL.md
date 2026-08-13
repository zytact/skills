---
name: postplan
description: Upload one HTML file to Postplan when the user tells you to. Also use this skill to read a postplan.dev URL.
---

# Postplan

## Upload a file

1. Run this command:

   ```bash
   npx postplan upload <plan.html>
   ```

2. Replace `<plan.html>` with the path of the HTML file.
3. Give the URL that the command supplies to the user.

## Read a file

Use the shell to get the uploaded HTML. Do not use web search. Do not use a browser.

1. Remove the trailing slash from the URL, if present.
2. Add `/raw` unless the URL already ends in `/raw`.
3. Run this command with this URL:

   ```bash
   curl --fail --silent --show-error --location --max-time 30 --output /tmp/postplan.html '<raw-url>'
   ```

4. Read `/tmp/postplan.html`.
5. Continue the task that the user specified with the information in the file.

If `curl` fails, report its status or network error. Do not use search results instead.
