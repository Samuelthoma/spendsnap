# SpendSnap — Code Review & Technical Assessment

**Review Date:** 2026-06-30  
**Scope:** Full codebase audit — architecture, correctness, performance, style, edge cases

---

## 1. Architecture & Design Strengths

### 1.1 Clean Separation of Concerns
The DB layer is well-modularized: `schema/` defines tables, `migrations/` handles versioning, `queries/` contains CRUD, and `index.ts` manages the connection. This makes schema changes straightforward.

### 1.2 Sensible Data Flow
The scan pipeline (Camera → OCR → AI → Review → SQLite) is linear, easy to trace, and each step has clear error handling. Using route params for passing AI output avoids global state pollution.

### 1.3 Good Use of TypeScript Interfaces
`ReceiptPayload` and `ReceiptItem` in `db/queries/receipts.ts` and `CategoryVisual` in `constants/categories.ts` provide clear contracts for data shapes.

### 1.4 Atomic DB Transactions
Receipt + details insert uses `withTransactionAsync`, preventing partial saves. CASCADE delete on foreign keys ensures referential integrity.

---

## 2. Critical Issues & Bugs

### 2.1 Potential Crash on Review Screen if No Data

**Location:** `app/review.tsx:53-56`

```typescript
const dataToLoad = JSON.parse(params.extractedData as string);
```

If `params.extractedData` is `undefined` (navigating directly to `/review` without going through the scanner), `JSON.parse(undefined)` throws. The `try/catch` catches it, but then `dataToLoad` remains `undefined`, causing a crash at `dataToLoad.merchant`.

**Fix:** Add a guard at the top of the `useEffect`:
```typescript
if (!params.extractedData) {
  router.back();
  return;
}
```

### 2.2 Gemini Model Name May Be Invalid

**Location:** `app/scanner.tsx:147`

```typescript
model: "gemini-3-flash-preview",
```

As of 2026, Google's Gemini models are `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`, etc. There is no `gemini-3-flash-preview`. This will cause a 404 error from the API.

**Fix:** Verify the correct model name in the Gemini API docs and update accordingly.

### 2.3 `replace` and `dismissAll` Route Behavior

**Location:** `app/scanner.tsx:64`

```typescript
router.replace({ pathname: '/review', params: ... });
```

`router.replace` replaces the current screen in history. When the user saves and calls `router.dismissAll()` in review, it dismisses all modals and returns to the tab home. However, if the user navigates back from review (via `router.back()`), they'll go to the scanner (which was replaced), potentially showing a stale screen.

**Review:** This is acceptable for the current flow but `router.replace` combined with `dismissAll` could be surprising during development. Consider using `router.push` and handling dismissal more carefully.

### 2.4 Race Condition in Font Loading

Each screen independently calls `useFonts()` to load the same fonts. This means:
- Fonts are loaded multiple times (once per screen visit)
- Screens render `null` until fonts are loaded, causing a flash of blank content

**Fix:** Load fonts once in the root `_layout.tsx` and share them via context or rely on Expo's font caching (which it does, but the `useFonts` hook still reports `fontsLoaded = false` on mount).

### 2.5 `parseInt` vs `parseFloat` for Prices

**Location:** `app/review.tsx:72, 118`

```typescript
sum + (parseInt(item.price) || 0) * (parseInt(item.qty) || 1),
```

Prices can be non-integer (e.g., `12.99`). `parseInt("12.99")` returns `12`, silently truncating cents.

**Fix:** Use `parseFloat(item.price)` for price fields. Keep `parseInt(item.qty)` for quantities.

### 2.6 Receipt Count Uses All Receipts, Not Current Month

**Location:** `app/(tabs)/index.tsx:106-109`

The home screen shows "Total Pengeluaran" calculated from all loaded receipts (last 20), but the label implies a monthly total. There's no date filtering.

**Fix:** Filter `receipts` to only those from the current month, or change the label to "Total Pengeluaran (Terbaru)".

---

## 3. Code Quality Observations

### 3.1 Inline Styles in StyleSheet (Good)
All screens use `StyleSheet.create()` at the bottom of the file, keeping styles centralized and performant.

### 3.2 Heavy Component Files
`app/review.tsx` (641 lines) and `app/details.tsx` (446 lines) contain styles, state, rendering, and business logic in a single component. Consider extracting:
- Category picker modal → `components/CategoryPicker.tsx`
- Item card → `components/ReceiptItemCard.tsx`
- Style definitions → separate style files

### 3.3 `any` Types
Several places use `any`:
- `app/review.tsx:33` — `items: any[]`
- `app/details.tsx:33` — `receipt: any`
- `app/(tabs)/index.tsx:26` — `item: any`
- `app/scanner.tsx:19` — `cameraRef: useRef<any>(null)`

These should use proper TypeScript interfaces derived from the DB schema.

### 3.4 Inconsistent Import Style
Some files use `@/` path aliases (e.g., `@/db/queries/receipts`, `@/constants/categories`), while others use relative paths (e.g., `../../store/useAppStore`, `../constants/categories`, `../db/queries/receipts`). This should be consistent.

### 3.5 Unused Dependencies
- `expo-haptics` — imported in `app.json` as a plugin? No, it's in `package.json` but not imported in any screen. The scan screen doesn't use haptic feedback.
- `expo-web-browser` — listed as a plugin in `app.json`, never imported.
- `react-native-reanimated` — in `package.json`, never imported.

### 3.6 AGENT.md vs AGENTS.md
Two files with similar purposes exist:
- `AGENT.md` (76 lines) — user-authored, contains older architecture notes (single table schema, different prompt strategy)
- `AGENTS.md` (system instructions) — more up-to-date

`AGENT.md` describes a different schema (`receipt_items` single table) than what's actually implemented (`receipts` + `receipt_details` with FK). This is stale documentation.

---

## 4. Performance Considerations

### 4.1 FlatList Correctly Used
Home screen uses `FlatList` (not `ScrollView`), which is correct for potentially large receipt lists. However, it lacks `getItemLayout` for fixed-height optimization.

### 4.2 Font Loading on Every Screen
As noted above, `useFonts()` is called in every screen independently. While Expo caches fonts after first load, each screen still renders `null` until the font cache check completes, causing unnecessary blank frames.

### 4.3 `useFocusEffect` with Empty Deps
`app/(tabs)/index.tsx:80-104` uses `useFocusEffect` with `[]` deps. This is correct — the callback itself captures no external dependencies and the cleanup returns `isActive = false`. However, the `fetchReceipts` function is recreated on every render (not wrapped in `useCallback`). This is acceptable because `useFocusEffect` manages the callback lifecycle.

### 4.4 No Image Caching
Scanned receipt images are not stored or cached. The camera captures an image, OCR processes it, and the image is discarded. This is intentional (privacy + storage) but means users can't re-view the original scan.

---

## 5. UI / UX Issues

### 5.1 Dual Visual Identity
The app has two conflicting design systems:
- **Brutalist** (Home screen): thick black borders, hard shadows, `#FDFDFA` background
- **Soft Indigo** (Review, Details, Settings): rounded corners, soft shadows, `#F8FAFC` background

This creates a disjointed user experience. Recommend choosing one direction and applying it consistently.

### 5.2 Dark Mode Not Implemented
`isDarkMode` is stored in Zustand but never read by any screen's styling. This is half-baked functionality that should either be wired up or removed.

### 5.3 Notification Toggle is Placeholder
The settings screen shows a "Notifikasi" row with value "Aktif" but tapping it does nothing. No notification infrastructure exists.

### 5.4 No Loading States on Settings Save
Tapping "Simpan Key" in settings shows an alert but no loading indicator. Since AsyncStorage writes are fast (<10ms), this is acceptable but inconsistent with the saving patterns in review.tsx.

### 5.5 Currency Formatting is Manual
The `formatIDR` function in both `index.tsx` and `details.tsx` uses a regex to insert `.` thousand separators:
```typescript
value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
```
This duplicates native APIs. `Number.toLocaleString("id-ID")` already formats as IDR (without the "Rp" prefix). The review.tsx uses the native approach for `calculatedTotal` but not for individual items.

### 5.6 Empty State on Home is Not Centered
The `ListEmptyComponent` uses `paddingVertical: 60` rather than flex-centering, so the empty state appears shifted upward on larger screens.

---

## 6. Error Handling & Edge Cases

### 6.1 Missing API Key
Handled: Alert "API Key Hilang" and navigate back. Good.

### 6.2 No Camera Permission
Handled: Permission screen with request button and cancel option. Good.

### 6.3 Empty OCR Text
Handled: Throws descriptive error. Good.

### 6.4 AI Returns Invalid JSON
The `JSON.parse(rawContent)` call is not wrapped in a try/catch within `processWithGemini`. If Gemini returns malformed JSON (despite `responseMimeType`), the error propagates to `handleCapture`'s catch, which shows a generic "Pemindaian Gagal" message. Consider catching the parse error separately for a more specific message.

### 6.5 Duplicate Receipts
No deduplication mechanism. If the user scans the same receipt twice, both entries are saved. This is acceptable for v1 but could be improved with receipt hash comparison.

### 6.6 Very Large Receipts
No limit on item count per receipt. A receipt with 100+ items could make the review screen slow. Consider capping or pagination for future versions.

### 6.7 No Data Export / Backup
All data lives in SQLite on-device. If the app is deleted or storage is cleared, all data is lost. Consider an export feature or SQLite backup mechanism.

---

## 7. Recommendations Summary

### Fix Now (Bugs)

| Priority | Issue | File | Suggested Fix |
|----------|-------|------|---------------|
| **High** | `gemini-3-flash-preview` doesn't exist | `scanner.tsx:147` | Update to correct model name |
| **High** | Crash if `extractedData` is undefined | `review.tsx:53-56` | Guard with early return |
| **Medium** | `parseInt` truncates decimals in prices | `review.tsx:72, 118` | Use `parseFloat` for prices |
| **Medium** | Price/qty stored as REAL/INTEGER inconsistency | `schema/index.ts:15` | Review if `price` should be INTEGER cents |

### Improve (Code Quality)

| Issue | Suggestion |
|-------|-----------|
| `any` types | Replace with interfaces from DB schema |
| Inconsistent imports | Standardize on `@/` alias throughout |
| Font loading duplication | Load fonts once in root layout, expose via context |
| Component size | Extract `CategoryPicker`, `ReceiptItemCard` to `components/` |
| Stale AGENT.md | Delete or update to reflect current schema |
| Unused deps | Audit and remove `expo-haptics`, `expo-web-browser`, `react-native-reanimated` if not used |

### Consider (Architecture)

| Issue | Consideration |
|-------|--------------|
| Dark mode | Wire `isDarkMode` to a theme context for v1.1 |
| Visual consistency | Unify design language (brutalist vs soft indigo) |
| Test coverage | Add Jest + React Native Testing Library for critical flows |
| CI pipeline | Add GitHub Actions for lint + typecheck |
| Receipt dedup | Hash merchant + date + total to prevent duplicates |
| SQLite backup | Expose DB file export via `expo-file-system` or `expo-sharing` |

---

## 8. Lint & Type Check Status

No linter or typecheck scripts were run as part of this review (none provided in the project config beyond `npm run lint` via ESLint). The project has no pre-commit hooks, no CI, and no tests.

**Recommendation:** Add `npm run typecheck` (via `tsc --noEmit`) to `package.json` scripts and integrate with a basic GitHub Actions workflow.
