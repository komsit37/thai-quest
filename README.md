# Thai Quest

A browser-based prototype for a personalized Thai-learning adventure game for kids.

## What this is

- Single-file app (`index.html`)
- Runs entirely in the browser
- Uses OpenRouter to generate story + lessons
- Stores progress in `localStorage`

## Quick start

1. Open `index.html` in a browser
2. Enter an OpenRouter API key (https://openrouter.ai/keys)
3. Enter a name + pick interests
4. Start the adventure

Or run a simple static server:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Structure

- `index.html` — UI + logic + styles (prototype phase)
- `AGENTS.md` — instructions for coding agents

## For contributors / agents

Read `AGENTS.md` before making changes. It contains:

- Where logic lives
- How to make minimal edits
- Refactoring roadmap
- Verification steps

## Notes

- No build step
- No backend
- API key is stored locally in browser

This repo is intentionally minimal — optimize for clarity and small diffs.
