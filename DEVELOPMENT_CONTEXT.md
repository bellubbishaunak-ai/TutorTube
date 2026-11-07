# TutorTube Development Context

Last updated: 2026-11-07

## Project location

`C:\Users\DELL\.gemini\antigravity\scratch\aitube`

The original path was written as `aitub`; the actual project folder is `aitube`.

## Architecture

- `server.js` — Express server; serves `public/` and exposes `/api/videos` and `/api/topics`.
- `data/videos.json` — curated video and topic dataset.
- `public/index.html` — single-page app shell and player/context-panel markup.
- `public/app.js` — client state, filtering, search, sorting, player, local library, summaries, and YouTube playback handling.
- `public/styles.css` — visual system and responsive layout.

Run locally with:

```bash
npm start
```

Open `http://localhost:3000`.

## Completed UI work

- Rebranded the app from AITube to TutorTube.
- Added a familiar YouTube-style HOME, SUBSCRIPTIONS, LIVE, TRENDING, and local library navigation.
- Shifted the visual system to a dark video-first layout with red accents, rounded thumbnails, and familiar search/navigation affordances.
- Added the footer credit: Made by Shaunak Bellubbi.
- Added the responsive `NO-NOISE NOTES` panel beside the player.
- Panel includes summary bullets, key takeaways, topic-aware documentation links, code links, and the original YouTube source.
- Summary generation is local and deterministic from video metadata; no external LLM/API dependency is required.

## Completed video reliability work

- Corrected mismatched/synthetic YouTube IDs across Tesla, RAG, Stanford, MIT, vector databases, MLOps, Pandas, gradient descent, and transformer entries.
- Added additional verified AI/ML entries.
- Audited the catalog against YouTube's public oEmbed endpoint, removed 18 confirmed unavailable records, replaced a stale 3Blue1Brown ID, and added six verified current AI/ML records.
- Dataset currently contains 57 unique video IDs, including two NVIDIA GTC live-event replays surfaced under LIVE.
- Player uses `youtube-nocookie.com` with `playsinline`, `enablejsapi`, and `origin` parameters.
- YouTube player error messages are handled through `postMessage`.
- If an embed is unavailable or restricted, the UI shows an in-player fallback with a direct `Open on YouTube` link.

## Important implementation points

- `playVideo()` in `public/app.js` sets the embed URL and populates the insight panel.
- `renderVideoInsights()`, `buildTakeaways()`, and `buildResources()` control the no-noise context data.
- `handleYouTubeMessage()`, `showPlayerFallback()`, and `hidePlayerFallback()` control playback error handling.
- Video IDs and thumbnails must always be updated together in `data/videos.json`.
- Do not assume every YouTube video can be embedded: creators, regions, age gates, and YouTube policy can still block an iframe. Preserve the direct-source fallback.

## Validation checklist

```powershell
node --check public\app.js
node --check server.js
$data = Get-Content -Raw data\videos.json | ConvertFrom-Json
$data.videos.Count
$data.videos | Group-Object id | Where-Object Count -gt 1
Invoke-WebRequest -UseBasicParsing http://localhost:3000/api/videos?limit=100
```

Last validation: JavaScript syntax passed, JSON parsed successfully, API returned all 57 records, and no duplicate IDs were found.

## Next development opportunities

- Add an admin/data-refresh workflow using the YouTube Data API instead of manually curated IDs.
- Store a `verifiedAt` or `embedStatus` field for each video and periodically recheck availability.
- Add a “report unavailable video” action that records a local or server-side issue.
- Replace the local summary synthesizer with a real transcript/LLM pipeline when a backend provider is selected.
