# Publish

Publishes a vault as one HTML page on Postplan, so the user can study from any browser. The vault stays the source of truth: the page is always rebuilt from it, never edited by hand.

## Steps

1. **Build the page.** Run the vault's builder, `node .site/build.mjs` from the vault root. It writes `.site/<vault-name>.html`. If the vault has no builder yet, write one there first (see below). Keep the builder in the vault, because scratch directories get wiped between sessions.
2. **Check it in a browser** at desktop and phone width: open a lesson, unfold a question, and run every exercise through to its graded result.
3. **Upload it.** Load the `postplan` skill and follow it. The first time, run `npx postplan upload .site/<vault-name>.html`, then write the draft id and URL into `NOTES.md`. After that, run `npx postplan upload .site/<vault-name>.html --draft <draft-id>`, so the URL stays the same. If the CLI reports a missing API key, ask the user to run `npx postplan auth login`.

Done when the user has the URL and step 2 passed on the uploaded version.

## The builder

One Node script with `marked` as its only dependency (`.site/package.json`), producing one self-contained page:

- **Contents:** a "start here" path from `INDEX.md`, then every lesson in order, every reference note and every exercise, with a contents menu that folds into a button at phone width.
- **Obsidian syntax:** folded callouts (`[!question]-`) become `<details>`, other callouts become styled blocks, and `[[wiki-links]]` become in-page anchors.
- **Mermaid and LaTeX** render on the page, through `mermaid` and `katex` loaded from a CDN.
- **Exercises** are inlined, each in its own `<iframe srcdoc>`, so their scripts and styles stay isolated.
- **Themes:** light and dark through `prefers-color-scheme`.

When the vault gains a kind of content the builder does not handle, extend the builder rather than patching the built page.
