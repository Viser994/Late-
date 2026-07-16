# AGENTS.md

## Cursor Cloud specific instructions

### What this repo is
Two independent, self-contained static websites (HTML + inline CSS, no JS, no build step):
- `School.html` — "Brampton Smart Transit & Traffic" landing page (root).
- `shawarma-queen-demo/index.html` — "Shawarma Queen" restaurant demo.

There is no package manager, backend, database, test suite, or lint config. Nothing needs to be installed; `python3` (and `node`) are already available.

### Running the sites
Serve over HTTP from the repo root (recommended over `file://` so the map iframe and relative paths behave realistically):

```
python3 -m http.server 8080
```

- Transit page: `http://localhost:8080/School.html`
- Shawarma Queen: `http://localhost:8080/shawarma-queen-demo/`

Edits are picked up on browser refresh (no watcher/hot reload; the server just serves files from disk).

### Testing / lint / build
None are configured. "Testing" means loading each page in a browser and verifying it renders. The Shawarma Queen page pulls Google Fonts, Unsplash images, and a Google Maps iframe from the network — these degrade gracefully offline but need internet to display fully. The transit signup form posts to `action="#"` and has no backend.
