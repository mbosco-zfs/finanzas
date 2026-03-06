# AGENTS.md

## Cursor Cloud specific instructions

This is a zero-dependency vanilla JavaScript PWA (personal finance tracker in Spanish). There is no build step, no package manager, no backend, and no automated test suite.

### Running the app

Serve static files from the repo root with any HTTP server (service workers require HTTP, not `file://`):

```
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in a browser.

### Architecture notes

- The entire app lives in `index.html` (~1345 lines of HTML + CSS + JS).
- `sw.js` is the service worker (cache-first for static assets, network-first for Anthropic API).
- `manifest.json` configures PWA install and share-target behavior.
- All data is stored in browser `localStorage` — no external database.
- The optional receipt-scanning feature calls the Anthropic Claude API directly from the browser (requires user-provided API key via Settings screen).

### Lint / Test / Build

- **Lint**: No linter is configured. You can use a general-purpose HTML/JS linter if needed.
- **Tests**: No automated tests exist.
- **Build**: No build step — files are served as-is.
