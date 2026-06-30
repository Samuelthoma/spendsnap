# SpendSnap — Design & Architecture Document

**Version:** 1.0.0  
**Status:** Draft

---

## 1. System Architecture

SpendSnap follows a **serverless, offline-first** architecture. No backend servers, no cloud databases, and no user accounts. The app is a self-contained React Native application that runs entirely on-device, with the sole exception of the Gemini AI API call (which requires internet access).

```
┌─────────────────────────────────────────────────────┐
│                    Device                            │
│  ┌──────────────────────────────────────────────┐   │
│  │              Expo / React Native             │   │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Camera   │ │ ML Kit   │ │ Gemini AI    │  │   │
│  │  │(expo-   │→│ (on-     │→│ (@google/    │  │   │
│  │  │ camera) │ │ device   │ │ genai)       │  │   │
│  │  │         │ │ OCR)     │ │              │  │   │
│  │  └─────────┘ └──────────┘ └──────┬───────┘  │   │
│  │                                   │           │   │
│  │  ┌──────────────────────────────┐ │           │   │
│  │  │       Review Screen          │◄┘           │   │
│  │  │  (edit AI data before save)  │             │   │
│  │  └───────────┬──────────────────┘             │   │
│  │              │                                 │   │
│  │  ┌───────────▼──────────────────┐             │   │
│  │  │       SQLite Database        │             │   │
│  │  │  (expo-sqlite, WAL mode)     │             │   │
│  │  └───────────┬──────────────────┘             │   │
│  │              │                                 │   │
│  │  ┌───────────▼──────────────────┐             │   │
│  │  │    Home / Details Screens    │             │   │
│  │  │  (read from SQLite)         │             │   │
│  │  └──────────────────────────────┘             │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  Zustand (persisted via AsyncStorage)        │   │
│  │  ├─ apiKey: string                           │   │
│  │  └─ isDarkMode: boolean                      │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
spendsnap/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root Stack: tabs, scanner, review, details
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (Home, Settings) + FAB
│   │   ├── index.tsx             # Home: overview + receipt FlatList
│   │   └── settings.tsx          # API key, dark mode, preferences
│   ├── scanner.tsx               # Camera + OCR + AI pipeline
│   ├── review.tsx                # Edit AI data, save to DB
│   └── details.tsx               # View/delete single receipt
├── components/                   # Empty — all UI co-located in screens
├── constants/
│   └── categories.ts             # Category definitions + visuals
├── db/
│   ├── index.ts                  # DB init, PRAGMA, exec/query helpers
│   ├── schema/
│   │   └── index.ts              # CREATE TABLE statements
│   ├── migrations/
│   │   └── index.ts              # PRAGMA user_version migration runner
│   └── queries/
│       └── receipts.ts           # CRUD: insert, select, delete receipts+details
├── store/
│   └── useAppStore.ts            # Zustand store (apiKey, isDarkMode)
├── assets/
│   └── images/                   # App icons, splash screen, favicon
├── scripts/
│   └── lmstudio-connect.sh       # Utility script (not app-related)
├── app.json                      # Expo configuration
├── tsconfig.json                 # TypeScript config with @/ alias
└── AGENT.md / AGENTS.md          # AI assistant context files
```

---

## 3. Navigation & Route Design

Uses Expo Router (file-based) with a single root Stack:

```
Root Stack (app/_layout.tsx)
├── (tabs)          → Tab Navigator (headerShown: false)
│   ├── index       → Home (receipt list + total)
│   └── settings    → Preferences
├── scanner         → Modal (presentation: "modal")
├── review          → Modal (presentation: "modal")
└── details         → Modal (presentation: "modal")
```

The floating action button (FAB) is positioned absolutely in the tab layout (`app/(tabs)/_layout.tsx`), rendering outside the Tab navigator so it overlays the tab bar. It navigates to `/scanner`.

Data flows between screens via route params:
- `scanner → review`: `params.extractedData` (JSON-stringified Gemini response)
- `index → details`: `params.id` (receipt UUID)
- `details → index`: `router.back()` after delete

---

## 4. Database Design

### 4.1 Schema

```sql
CREATE TABLE IF NOT EXISTS receipts (
  id          TEXT PRIMARY KEY,            -- UUID (expo-crypto)
  merchant    TEXT NOT NULL,
  category    TEXT NOT NULL,
  total_amount REAL NOT NULL,
  scan_date   TEXT NOT NULL                -- ISO 8601
);

CREATE TABLE IF NOT EXISTS receipt_details (
  id          TEXT PRIMARY KEY,            -- UUID (expo-crypto)
  receipt_id  TEXT NOT NULL,
  item_name   TEXT NOT NULL,
  price       REAL NOT NULL,
  quantity    INTEGER NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);
```

### 4.2 Migrations

Managed via `PRAGMA user_version`. Currently at v1 (single migration). Future migrations add new `IF NOT EXISTS` checks and increment the version.

### 4.3 Connection Settings

- `PRAGMA foreign_keys = ON` — enables CASCADE deletes
- `PRAGMA journal_mode = WAL` — better concurrent read performance
- Single `SQLiteDatabase` instance (singleton) shared across the app

### 4.4 Query Patterns

- `getAllAsync` for list queries (receipt history, receipt details)
- `getFirstAsync` for single receipt by ID
- `withTransactionAsync` for atomic receipt + details insert
- `runAsync` for raw mutations

---

## 5. State Management

### 5.1 Global State (Zustand + AsyncStorage)

```typescript
interface AppState {
  apiKey: string;        // Gemini API key
  isDarkMode: boolean;   // Dark mode toggle
  setApiKey: (key: string) => void;
  toggleDarkMode: () => void;
  clearData: () => void;
}
```

Persisted under AsyncStorage key `spendsnap-storage` via `zustand/middleware/persist`.

### 5.2 Local / Transactional State

Each screen manages its own local state via `useState`:
- **scanner.tsx:** `isProcessing`, camera ref
- **review.tsx:** `receipt`, `items`, `showCategoryPicker`, `isSaving`
- **details.tsx:** `receipt`, `isLoading`
- **index.tsx:** `receipts`, `isLoading`
- **settings.tsx:** directly reads/writes Zustand store

No prop drilling — each screen either reads from the store or loads its own data from SQLite.

---

## 6. Data Flow: Scan Pipeline

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Camera   │   │ ML Kit   │   │ Gemini   │   │ Review   │   │ SQLite   │
│ Capture  │──▶│ OCR      │──▶│ AI Parse │──▶│ Screen   │──▶│ Insert   │
│          │   │          │   │ (JSON)   │   │ (edit)   │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
     │              │              │               │              │
     │ photo.uri    │ rawText      │ parsed JSON   │ validated    │ receiptId
     │              │              │ via route     │ Receipt-     │ returned
     │              │              │ params        │ Payload      │
     ▼              ▼              ▼               ▼              ▼
  expo-        @react-native-  @google/genai   react-native   expo-sqlite
  camera       ml-kit-text-    (HTTP to        (local state)  (local DB)
               recognition      Google API)
```

### Key Design Decisions

1. **Why ML Kit + Gemini instead of a single AI vision call?** ML Kit runs locally (free, instant, no network). Gemini receives structured text rather than images, reducing token usage and cost.

2. **Why `responseMimeType: "application/json"` instead of parsing markdown?** Forces Gemini to return valid JSON directly, avoiding brittle regex/string parsing and improving reliability.

3. **Why `expo-crypto` `randomUUID()` instead of SQLite auto-increment?** UUIDs prevent ID collision in offline scenarios and enable future sync without re-mapping.

4. **Why transactions for inserts?** Ensures atomicity: if one detail insert fails, the entire receipt insert rolls back, preventing orphaned receipts without details.

---

## 7. UI / Theming

### 7.1 Typography

| Weight | Font | Usage |
|--------|------|-------|
| 700 Bold | Space Grotesk | Headings, totals, merchant names, button text |
| 600 SemiBold | Space Grotesk | Labels, input text, category names |
| 500 Medium | Space Grotesk | Body text, dates, secondary info |
| 600 SemiBold | Inter | Tab bar labels |
| 500 Medium | Inter | General UI (limited use) |

Fonts loaded per-screen via `useFonts` hooks. This means each screen re-downloads/hydrates fonts independently.

### 7.2 Visual Style

The app has **two conflicting visual styles**:

**Brutalist style (Home screen):**
- Thick black borders (3-4px) on cards, icons, empty state
- Solid black shadows with no blur (`shadowRadius: 0`)
- `#FDFDFA` background
- Black text throughout
- Sharp edges, high contrast

**Soft Indigo/Premium style (Review, Details, Settings):**
- Rounded corners (12-24px), soft shadows with indigo tint
- `#F8FAFC` background, white cards
- Indigo accents (`#6366F1`, `#1E1B4B`)
- `#E2E8F0` borders, `#E2E8F0` dividers

### 7.3 Categories

12 categories defined in `constants/categories.ts`, each with:
- Indonesian label (`Makanan & Minuman`, `Belanja`, etc.)
- English `value` for DB storage (`Dining`, `Shopping`, etc.)
- Ionicons icon name, color, background color
- Fallback: "Lainnya" (last entry)

### 7.4 Dark Mode

Zustand `isDarkMode` toggle exists but **is not wired to any theme system**. The `Switch` component on Settings toggles the boolean but no screen reads it to change colors. The splash screen config has a `dark.backgroundColor`.

---

## 8. Gemini AI Integration

### 8.1 Model & Configuration

- **Model:** `gemini-3-flash-preview`
- **SDK:** `@google/genai` (`^1.50.1`)
- **Response format:** JSON via `config.responseMimeType: "application/json"`
- **API key:** User-provided, stored in Zustand/AsyncStorage

### 8.2 Prompt Design

The prompt is structured as a single string embedded in `app/scanner.tsx:115-141`. It instructs Gemini to:
1. Extract structured data from the provided OCR text
2. Return ONLY valid JSON (no markdown, no explanations)
3. Follow a specific JSON schema
4. Constrain `category` to one of 6 predefined values (or `Lainnya`)
5. Use ISO 8601 for dates
6. Interpret `price` as per-unit and `qty` as quantity

### 8.3 Error Handling

- Missing API key → alert + navigate back
- Empty OCR text → error message "Tidak ada teks yang terdeteksi"
- Gemini failure (network, invalid JSON, empty response) → generic error alert
- All errors allow user to retry by re-opening the scanner

---

## 9. Security Posture

| Concern | Approach |
|---------|----------|
| API Key Storage | AsyncStorage via Zustand persist middleware (no encryption) |
| Network | HTTPS to `generativelanguage.googleapis.com` (Gemini) |
| Data Privacy | All financial data stored locally in SQLite; no cloud backup |
| Auth | None — single-user, no accounts |
| Risk Profile | Low — personal use only; encrypted storage deemed unnecessary per AGENT.md |

---

## 10. Dependencies Summary

| Package | Purpose |
|---------|---------|
| expo-router | File-based routing |
| expo-camera | Camera capture |
| expo-sqlite | Local SQLite database |
| expo-crypto | UUID generation |
| @react-native-ml-kit/text-recognition | On-device OCR |
| @google/genai | Gemini AI SDK |
| zustand | Global state management |
| @react-native-async-storage/async-storage | Persistence for Zustand |
| react-native-keyboard-aware-scroll-view | Keyboard-aware forms |
| @expo-google-fonts/space-grotesk | Primary font family |
| @expo-google-fonts/inter | Secondary font family |
| @expo/vector-icons (Ionicons) | Icon set |
| expo-haptics | Installed but unused |
| expo-image | Image component (for splash/icon) |
| expo-splash-screen | Splash screen |
| expo-web-browser | Web browser (unused in current flow) |
| expo-status-bar | Status bar component |
| expo-linking | Deep linking |
| expo-symbols | SF Symbols (iOS) |
| expo-system-ui | System UI utilities |

---

## 11. Build & Deploy

- **Dev:** `npx expo start -c`
- **Android native:** `npx expo run:android`
- **iOS native:** `npx expo run:ios`
- **Lint:** `npm run lint` (ESLint via expo lint)
- **EAS Build:** Configured in `eas.json`, project ID in `app.json`
- **No tests, no CI, no pre-commit hooks** configured
