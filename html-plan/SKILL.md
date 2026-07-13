---
name: html-plan
description: Create a plan relevant to implementation in HTML making it easier for humans to find more aesthetically pleasing to read and visualize.
---

In a `.plans` directory (create if not already there) in the root of the codebase, create a thorough, well-researched plan, that contains your "taste" of how things should be architected and coding style for an implementation that is aesthetically pleasing to a human and has visualization for humans to understand if necessary. The design should mimic the project. If the project doesn't have a design (e.g., if a CLI or TUI project), use [Raycast](https://www.raycast.com) like design. The plan should have a timestamp of when it was created. The html should automatically detect light and dark theme from the browser and support both.

Once done use postplan to host the html plan:
```bash
vpx postplan upload <plan.html>
```
where `plan.html` is the path to the html file. The command will then return the URL, which you should show.
