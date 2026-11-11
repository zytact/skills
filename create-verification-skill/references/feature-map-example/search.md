# Search

Full-text search over the signed-in user's notes. Results update as the user types.

## Sub-features

- Match highlighting in titles and bodies.
- `tag:<name>` filters to one tag.
- An empty result shows "No notes match" and a "Clear search" button.

## How to get to it (user POV)

- Click the search box in the header, labelled "Search notes".
- Press `/` anywhere outside a text field.
- Open `/search?q=<query>` directly.

## Driving it with drive.mjs

```bash
node scripts/drive.mjs open http://localhost:5173/
node scripts/drive.mjs fill '[aria-label="Search notes"]' 'groceries'
node scripts/drive.mjs wait '[data-testid="search-result"]'
node scripts/drive.mjs shot evidence/search-results.png
```

Proof: the URL becomes `/search?q=groceries`, every `[data-testid="search-result"]` contains "groceries", and the seeded note "Groceries for Sunday" is among them.

## Gotchas

- Results come from an index that lags a write by up to 2 seconds. After creating a note, wait for it to appear before asserting.
- `/` does nothing while a note body has focus. Click the page background first.
