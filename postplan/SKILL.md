---
name: postplan
description: Host a self-contained html file on the web with just a command
---

To use postplan to upload the html file just do:
```bash
vpx postplan upload <plan.html>
```
where `plan.html` is the path to the html file. The command will then return the URL, which you should show. Make sure to run it in the directory as the repo, or else it won't be able to pick up the Git information.
