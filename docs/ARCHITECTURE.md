# ComicLearn AI — Architecture Overview

## 1. Key Idea

ComicLearn AI turns an educational topic into a 4-panel comic strip narrated by a
chosen character (Sherlock Holmes, Albert Einstein, Iron Man, or Batman), using
Gemini to write the script and draw the panel art.

**Important structural fact before anything else:** this repo actually contains
**three loosely-related things wearing one name**:

1. A **web app** (`src/`, `server.ts`) — the real, runnable product. It's a
   React frontend styled as a phone simulator, backed by an Express server that
   calls Gemini.
2. Inside that same web app, a **fake Android code viewer** — a static, hardcoded
   panel of Kotlin source *snippets* (`ANDROID_SOURCE_FILES` in `src/App.tsx`)
   shown next to the phone simulator to sell the "this is what the native app
   looks like" illusion. These snippets are illustrative text baked into the
   frontend bundle — not the real code, not compiled, not kept in sync with
   anything.
3. A **separate, real native Android app** (`android-app/`), which is its own
   Kotlin/Compose project, decoupled from the web app's server, and in several
   ways *not* what the fake code viewer shows (see §3 comparison table below).

Keep that distinction in mind — the Kotlin you see in the browser is marketing
dressing, not the Kotlin that would actually run on a phone.

## 2. Components

### 2.1 Frontend — `src/App.tsx`, `src/main.tsx`, `src/index.css`

A single-file React 19 component (no sub-components extracted) rendering a
neobrutalist/comic-book styled UI (thick borders, hard drop shadows, halftone
textures — utility classes in `src/index.css`), animated with Framer Motion.

- **State** (`useState` in `App()`): `topic`, `selectedChar`, `currentScreen`
  (`"dashboard" | "viewer"`), `loading`/`loadingCaption`, `comicBook`,
  `followUp`, `errorMessage`, `isDemoMode`, `activeFile` (Kotlin tab),
  `copied`, `timeStr` (fake status-bar clock).
- **Key functions**: `handleGenerate()` (POST topic+character),
  `handleSendFollowUp()` (POST topic+character+followUp),
  `handleCopyCode()` / `handleDownloadFile()` (for the fake Kotlin viewer),
  `handleNewChat()` (reset).
- **Layout**: header → left column (animated "phone" with Dashboard/Viewer
  screens + loading overlay) → right column (Kotlin file tabs + a static
  "architecture breakdown" card) → footer.
- Loading state cycles through rotating funny captions ("Contacting Sherlock
  Holmes...", "Requesting Cloud Gemini 3.5 Flash...") that reinforce a
  local+cloud narrative even though generation is 100% server-side.

### 2.2 Backend — `server.ts`

A single Express + TypeScript file (~40KB) that does double duty: it's both the
API server and the Vite dev/static host for the frontend, listening on
**port 3000** (hardcoded, not env-configurable).

- **One real route**: `POST /api/generate` — `{ topic, character, followUp? }`
  → `{ comic: ComicBook, isDemo: boolean, error? }`.
- **Two-stage generation pipeline** per request:
  - **Stage A (script)** — one call to `gemini-3.5-flash` with a strict
    `responseSchema` (JSON schema constrained decoding) that forces a
    `topic`/`character`/`comic_book_asset[4]` shape, each panel tagged with a
    narrative stage (Hook → Mechanism → Result → Synopsis).
  - **Stage B (art)** — 4 **parallel** calls to `gemini-3.1-flash-lite-image`
    (one per panel, `aspectRatio: "4:3"`), each prompt built from that panel's
    `panel_visual_description_concept` plus dialogue-as-speech-bubble
    instructions — effectively using Stage A's output to write Stage B's
    prompts.
- **Graceful degradation everywhere**: no/placeholder `GEMINI_API_KEY` →
  immediate "demo mode" using a hand-coded local SVG generator
  (`generateComicPanelSvg`/`generateDemoComic`); a single panel's image call
  failing → that panel falls back to SVG; the whole text-generation call
  throwing → the whole request falls back to a demo comic. **The server
  essentially never returns a 5xx for generation failures** — it always
  responds 200, flagging degraded output via `isDemo: true`.
- **Fully stateless**: no DB, no session store, no caching, no rate limiting.
  A "follow-up" is just a differently-worded single-shot prompt reusing the
  same topic/character — no server-side conversation history.
- **Images** are embedded directly as base64 data URIs (`data:image/png;...`
  or `data:image/svg+xml;...` on fallback) inside the JSON response — nothing
  is written to disk.

### 2.3 Native Android app — `android-app/`

A small, separate MVVM Jetpack Compose project (`com.comiclearn.ai`), with no
DI framework and no persistence layer (nothing survives process death).

- **UI** (`ui/DashboardScreen.kt`, `ui/ComicViewerScreen.kt`): navigated via
  Navigation-Compose (`MainActivity.kt`), sharing one Activity-scoped
  `ComicLearnViewModel`.
- **ViewModel** (`ui/ComicLearnViewModel.kt`): single `MutableStateFlow<UiState>`
  (`Idle | Loading | Success(ComicBook) | Error`), plus `currentTopic`/
  `currentCharacter` for follow-up continuity. Follow-ups **overwrite** the
  current comic rather than appending to a history.
- **Data layer**:
  - `data/LocalLlmManager.kt` — despite its doc-comment claiming on-device
    inference via "LiteRT-LM," it **never loads or runs a model**. It only
    formats a prompt string (`formatBlueprintPrompt`). The
    `litertlm-android` Gradle dependency is declared but unused.
  - `data/CloudGeminiClient.kt` — the real network call, straight from the
    client to Gemini (`gemini-3.1-flash-lite` via
    `com.google.ai.client.generativeai`), with a **hardcoded placeholder API
    key** (`"YOUR API KEY"`) and manual JSON repair/parsing via
    `org.json.JSONObject` (bypassing the `@Serializable` models even though
    `kotlinx-serialization` is a declared dependency).
  - `data/Models.kt` — plain `ComicBook`/`ComicPanel` data classes; notably
    `panel_image` here is expected to be a **raw inline `<svg>` string**,
    rendered via Coil's SVG decoder — not a base64 PNG like the web app.
- **Permissions**: `INTERNET` only.

## 3. Flows

### 3.1 Web app comic-generation flow

```
User enters topic + picks character (Dashboard screen)
  → handleGenerate() → POST /api/generate
      → server: validate → (no key? return demo) 
          → Stage A: gemini-3.5-flash + responseSchema → 4-panel script
          → Stage B: 4x parallel gemini-3.1-flash-lite-image calls
          → assemble ComicBook JSON (base64 images inline)
  → client receives { comic, isDemo }
  → animated transition to Viewer screen, renders 4 panels
  → optional: user asks a follow-up → handleSendFollowUp() → same endpoint,
    same pipeline, replaces the panel list
  → "New Chat" resets state back to Dashboard
```

### 3.2 Backend request lifecycle (`/api/generate`)

```
missing topic/character → 400
no/placeholder GEMINI_API_KEY → 200, isDemo: true (local SVG demo comic)
else:
  text generation (Stage A) throws → caught by outer try/catch → 200, isDemo: true, error: <message>
  text generation succeeds → 4x image generation (Stage B) in parallel
    each panel's image call throws / returns no image → that panel gets an SVG fallback (isolated, doesn't fail the request)
  → 200, isDemo: false, full comic with real images
```

### 3.3 Android app flow

```
Dashboard: user enters topic, picks character
  → onNavigateToComic() fires viewModel.generateComic(topic, character)
    AND navigates to the comic_viewer route at the same time (not awaited)
  → LocalLlmManager.generateLocalBlueprint() builds a prompt string (no model inference)
  → CloudGeminiClient.generateComic(prompt) calls Gemini directly from the device
  → manual JSON cleanup (strip markdown fences, repair truncated JSON) → parse
  → UiState.Success(ComicBook) → ComicViewerScreen renders LazyColumn of panels
    (each panel_image is inline SVG, decoded via Coil)
  → follow-up question → askFollowUp() → same pipeline, overwrites current UiState
  → Back / "New Chat" → resetSession() → Idle, pop back stack
```

### 3.4 Web vs. Android — what's actually different

| | Web app (`server.ts` + `src/`) | Native Android app (`android-app/`) |
|---|---|---|
| Where Gemini is called from | Server (Express), key never reaches the client | Directly from the device |
| API key handling | `GEMINI_API_KEY` env var, server-side, with a working demo-mode fallback | Hardcoded placeholder string in `CloudGeminiClient.kt` — non-functional as-is |
| Panel image format | Base64 PNG (`gemini-3.1-flash-lite-image`), or SVG data URI on fallback | Raw inline SVG string, rendered by Coil's SVG decoder |
| "Local" generation | None — the loading captions *talk about* on-device Gemma, but everything happens server-side | `LocalLlmManager` exists but only formats a prompt string; no model ever runs on-device |
| Follow-up behavior | New panels via same endpoint, appended into the viewed comic | Overwrites the previous `ComicBook` entirely |
| Failure behavior | Always 200, degrades to demo/SVG content | Surfaces `UiState.Error`, shown as red text |

## 4. Notes / gotchas for a newcomer

- `server.ts`'s port is **hardcoded to 3000** — not read from an env var.
- `.env.example`'s `APP_URL` is declared (documented as injected by AI Studio's
  Cloud Run hosting) but is **not referenced anywhere in the code**.
- The Android app will not generate real comics until someone replaces the
  placeholder API key in `CloudGeminiClient.kt` and decides whether to
  implement or remove the stubbed local-LLM path (`LocalLlmManager` /
  `litertlm-android` dependency).
- No tests, no CI config, no database anywhere in the repo — both the server
  and the Android app are stateless/in-memory per request.
- The Kotlin shown in the web app's "code inspector" panel (`ANDROID_SOURCE_FILES`
  in `src/App.tsx`) is illustrative text for the demo UI, not a mirror of
  `android-app/`'s real source — don't use it as a reference when editing the
  actual Android app.
