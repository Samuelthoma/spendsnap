# SpendSnap — AGENTS.md

## Quick start

```bash
npx expo start -c    # dev server (clear cache, recommended after install)
npm run lint          # ESLint via expo lint (no typecheck or test scripts)
```

- Entrypoint: `expo-router/entry`, file-based routing in `app/`
- Path alias: `@/*` maps to project root (tsconfig)
- No tests, no CI, no pre-commit hooks, no formatter config

## Architecture

```
app/(tabs)/index.tsx    → home / receipt history list
app/(tabs)/settings.tsx → API key, dark mode, preferences
app/scanner.tsx          → camera + OCR + Gemini → review
app/review.tsx          → edit/save receipt to DB
app/details.tsx          → view/delete single receipt
```

**Database** (SQLite, init on app launch via `initDb()` in `_layout.tsx`):
- `receipts` (id, merchant, category, total_amount, scan_date)
- `receipt_details` (id, receipt_id FK→receipts ON DELETE CASCADE, item_name, price, quantity)
- Migrations via PRAGMA `user_version` (currently v1 only)
- WAL mode + foreign keys enabled at startup

**State** (Zustand + AsyncStorage persist):
- `apiKey` (Gemini), `isDarkMode` – persisted under key `spendsnap-storage`

**Scan flow**: Camera capture → ML Kit OCR → Gemini AI (`gemini-3-flash-preview` with `responseMimeType: "application/json"`) → review screen → SQLite insert

## Key details

- Gemini model: `gemini-3-flash-preview`, response forced to JSON via `responseMimeType`
- ID generation: `expo-crypto` `randomUUID()`
- UI language: Indonesian (`id-ID` locale for dates, Rp currency)
- Fonts: Space Grotesk (700/600/500 weights), Inter (600/500) — loaded per-screen
- Dark mode toggle exists in store but is not fully wired to theme system
- `app.json` has `"reactCompiler": true` — React compiler experiment enabled
- Existing `AGENT.md` (user-authored) contains additional architecture notes
- When you need to search docs for a library's API, use `context7` tools
