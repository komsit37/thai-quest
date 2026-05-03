# Learning/product refactor notes

This file captures the next product refactor for Thai Quest based on user feedback:

> More lesson/content ratio. Now all chapters story with only 1 vocab. Voice over is great. Let user play voice for all words too. After user learn words integrate more into story. Use proven techniques to help learning and remembering. Can we have voice over for the whole story too?

## Product goals

1. Increase learning density without losing the adventure-story feel.
2. Teach 3-5 new Thai words or phrases per chapter, not just 1.
3. Reuse learned words in later scenes and chapters.
4. Add audio controls for every Thai word or phrase.
5. Add a full-story voice-over button.
6. Use evidence-backed learning patterns: retrieval practice, spaced repetition, interleaving, dual coding, immediate feedback, and contextual reuse.

## Recommended chapter structure

Each generated chapter should contain:

- 2-3 short story scenes
- 3-5 target Thai items
- 2-3 micro-lessons/checks
- 1 review moment for previously learned words
- 1 final recall challenge
- Audio for each Thai item
- Audio for the full chapter/story text

Target ratio:

- 60% story/content
- 40% lesson/review interaction

This should feel like a game chapter with frequent active recall, not a long story followed by one quiz.

## Prompt optimization

Use a stricter, smaller JSON schema so the model produces more useful learning content with fewer tokens.

### Current issue

The model is likely spending too many tokens on story prose and too few on learning design. It should be told exactly how many scenes, words, recalls, and reuse moments to produce.

### Suggested prompt contract

Ask the model to return JSON only:

```json
{
  "title": "string",
  "summary": "1 sentence",
  "targetVocab": [
    {
      "thai": "string",
      "romanization": "string",
      "meaning": "string",
      "type": "word | phrase",
      "audioHint": "short pronunciation note",
      "example": "short kid-friendly example sentence"
    }
  ],
  "reviewVocab": ["thai word from prior chapters"],
  "scenes": [
    {
      "emoji": "string",
      "narration": "short paragraph with learned Thai naturally reused",
      "dialogue": [
        { "speaker": "string", "line": "short line" }
      ],
      "thaiUsed": ["thai words appearing in this scene"]
    }
  ],
  "lessons": [
    {
      "kind": "meaning | listening | recall | choose_sentence | review",
      "prompt": "string",
      "answer": "string",
      "options": ["string"],
      "feedbackCorrect": "string",
      "feedbackWrong": "string"
    }
  ],
  "chapterNarration": "plain text version suitable for voice over"
}
```

## Prompt content rules

Tell the model:

- Introduce exactly 3-5 target Thai items per chapter.
- Reuse each new item at least 2 times in the story.
- Include 1-3 previously learned items, if available.
- Keep scenes short: 60-90 words each.
- Put Thai words inline, followed by context clues, not constant translations.
- Use active recall before revealing answers when possible.
- Alternate question types: meaning, listening, sentence choice, and free recall.
- Avoid long explanations.
- Output JSON only. No markdown.

## Learning techniques to implement

### Retrieval practice

Ask the child to remember a word before showing the answer. Example:

- "The monkey points to น้ำ. What does น้ำ mean?"
- Or: "Which Thai word means water?"

### Spaced repetition

Maintain a lightweight vocab memory with review counters:

```js
{
  thai: "น้ำ",
  meaning: "water",
  romanization: "nam",
  seenCount: 3,
  correctCount: 2,
  lastSeenChapter: 4,
  nextReviewChapter: 6
}
```

Review words after roughly:

- same chapter
- next chapter
- 2 chapters later
- 4 chapters later

### Interleaving

Mix old and new words in choices so the child practices discrimination.

### Dual coding

Use emoji/scene context with the Thai word. Example: `น้ำ 💧` and jungle river scene.

### Immediate feedback

After each choice:

- Correct: celebrate and repeat the target word in a new sentence.
- Wrong: explain briefly, replay audio, and ask again later.

### Contextual reuse

After a word is learned, use it in story narration and dialogue without always translating it.

Example progression:

1. Teach: "น้ำ means water."
2. Guided use: "The river is full of น้ำ."
3. Natural use: "Mali fills the bottle with น้ำ."
4. Recall: "What did Mali put in the bottle?"

## Audio refactor

### Word-level audio

Every rendered Thai word/phrase should be clickable and include a small speaker button.

Implementation target:

```js
function renderThaiToken(item) {
  return `<button class="thai-token" data-speak="${escapeAttr(item.thai)}" title="Play ${escapeAttr(item.meaning)}">🔊 ${escapeHtml(item.thai)}</button>`;
}
```

Attach one delegated click handler:

```js
document.addEventListener('click', (event) => {
  const token = event.target.closest('[data-speak]');
  if (!token) return;
  speakThai(token.dataset.speak);
});
```

This is more token-efficient and less brittle than adding inline `onclick` handlers everywhere.

### Whole-story voice over

Add a button near each scene/chapter:

```html
<button class="btn-secondary" id="playStoryAudio">🔊 Read this chapter</button>
```

Implementation target:

```js
function speakStory(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
```

For mixed Thai + English, use either:

1. Browser speech synthesis in one pass for simplicity, or
2. Segment by Thai vs English and call `speakThai` for Thai spans if better pronunciation is needed.

Phase 1 should use the simple whole-text read-aloud first.

## UI changes

Add a compact vocabulary tray to each chapter:

- Thai word
- meaning
- speaker button
- learned/checkmark state

Example:

```html
<div class="vocab-tray">
  <button data-speak="น้ำ">🔊 น้ำ</button><span>water</span>
  <button data-speak="ช้าง">🔊 ช้าง</button><span>elephant</span>
</div>
```

Add full chapter voice-over controls:

- `🔊 Read chapter`
- `⏹ Stop audio`

## Data/state changes

Replace `vocabLearned: Set<string>` over time with structured vocab records.

Minimum migration-safe shape:

```js
vocabLearned: new Map()
```

Stored as JSON array in `localStorage`:

```js
[
  {
    "thai": "น้ำ",
    "meaning": "water",
    "romanization": "nam",
    "seenCount": 2,
    "correctCount": 1,
    "lastSeenChapter": 3,
    "nextReviewChapter": 4
  }
]
```

## Suggested implementation order

1. Update prompt/schema to request 3-5 target words, review words, lessons, and chapter narration.
2. Render a vocab tray for `targetVocab` and `reviewVocab`.
3. Add delegated `[data-speak]` word audio handler.
4. Add `Read chapter` and `Stop audio` buttons.
5. Track vocab as structured records with review scheduling.
6. Update future chapter prompts to include due review words.
7. Later: split `index.html` into modules.

## Token/cost optimization

- Keep `storySoFar` as a compact rolling summary, not full chapter text.
- Send only due review vocab, not every learned word.
- Send only last 1-2 chapter summaries.
- Use fixed JSON schema and short field names only if cost becomes a problem.
- Validate JSON and retry with a repair prompt instead of regenerating the whole chapter.

## Example system/developer prompt snippet

```text
You are generating one Thai Quest chapter for a child learning Thai.
Prioritize learning density: 3-5 Thai target items, 2-3 micro-lessons, and natural story reuse.
Use retrieval practice, spaced review, interleaving, immediate feedback, and context clues.
Keep prose short and playful.
Reuse every new Thai item at least twice in story scenes.
Include due review words naturally if provided.
Return valid JSON only matching the requested schema.
```
