# AGENTS.md

## Project overview

Thai Quest is a single-page browser prototype for a personalized Thai-learning adventure game for kids. The app currently lives in `index.html` and combines markup, CSS, and JavaScript in one file.

The product flow is:

1. Child enters a name, interests, and an OpenRouter API key.
2. A short placement test estimates Thai familiarity.
3. The app generates story chapters with embedded Thai vocabulary and lesson moments.
4. Progress is stored in `localStorage`.

## Repository map

- `index.html` - entire runnable app: UI, styles, state, placement test, story generation, OpenRouter calls, and browser speech playback.
- `README.md` - human-facing project summary and local usage notes.
- `AGENTS.md` - coding-agent guidance.

## How to run locally

No build step is required.

Recommended options:

- Open `index.html` directly in a browser for quick UI checks.
- Or serve the folder with a static server, for example:
  - `python3 -m http.server 8000`
  - then open `http://localhost:8000`

The app requires an OpenRouter API key entered in the setup form. The key is stored only in the browser's `localStorage`.

## Current architecture constraints

This is intentionally a small prototype. Keep changes lightweight unless the task explicitly asks for a larger migration.

When editing `index.html`:

- Preserve the no-build, static-file deployment model.
- Keep secrets client-side only as the current prototype does; do not add a hardcoded API key.
- Prefer small, named functions over large inline logic.
- Group code by concern using clear section comments.
- Avoid broad rewrites that mix styling, state, prompt, and network changes in one patch.
- Keep UI text kid-friendly and clear.

## Token-efficient agent workflow

Before changing code:

1. Read this file and `README.md` first.
2. Skim the section comments in `index.html` instead of reading the whole file from top to bottom.
3. Identify the smallest section that owns the requested behavior.
4. Patch only that section when possible.
5. Summarize the changed section and verification steps in the final response.

Useful search terms in `index.html`:

- `STATE` - global app state and persisted fields.
- `PLACEMENT_SETS` - placement-test question data.
- `startAdventure` - setup form entry point.
- `enterStory` - transition from placement/setup into story mode.
- `generateChapter` - chapter generation flow.
- `callOpenRouter` - network call to the LLM provider.
- `speakThai` or `speechSynthesis` - browser audio playback.
- `localStorage` - persistence.

## Refactoring direction

If asked to continue refactoring, prefer this order:

1. Extract data constants from `index.html` into `src/data.js`.
2. Extract state and persistence helpers into `src/state.js`.
3. Extract OpenRouter integration into `src/openrouter.js`.
4. Extract placement-test rendering and scoring into `src/placement.js`.
5. Extract story rendering/generation into `src/story.js`.
6. Move CSS to `styles.css` only after JavaScript responsibilities are clearer.

Use ES modules only if you also update the local run instructions and preserve simple static hosting.

## Verification

After edits, at minimum:

- Load the app in a browser or static server.
- Confirm the setup screen renders.
- Confirm interest chips can be selected.
- Confirm the app blocks start without an API key.
- For JavaScript edits, check the browser console for syntax/runtime errors.

There is currently no automated test suite.

## Commit style

Use concise, imperative commit messages, for example:

- `Add agent guidance`
- `Extract placement data`
- `Clarify local setup`
