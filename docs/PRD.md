# SpendSnap — Product Requirements Document (PRD)

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-06-30

---

## 1. Product Overview

SpendSnap is a serverless, personal-use mobile application that lets users track their expenses by scanning physical receipts. It uses on-device OCR (ML Kit) to extract raw text from receipt images, then sends that text to Google Gemini AI for structured parsing. The structured data (merchant, category, itemized list) is presented to the user for review and correction before being saved to a local SQLite database.

### 1.1 Problem Statement

People who want to track their spending often:
- Forget to manually log expenses
- Lose paper receipts before they can record them
- Find receipt-tracking apps too complex or requiring cloud accounts
- Want item-level breakdowns, not just total amounts

SpendSnap solves these by making receipt capture nearly instantaneous: take a photo, let AI parse it, optionally correct, and save — all offline, all on-device.

### 1.2 Target Users

- **Primary:** Individuals who want simple, no-account expense tracking using their phone camera
- **Secondary:** Budget-conscious users who need category-level spending visibility
- **Non-target:** Businesses requiring multi-user, cloud-sync, or receipt export/accounting features

---

## 2. User Stories

### Must-Have (v1)

| ID | Story | Acceptance Criteria |
|----|-------|-------------------|
| US-01 | As a user, I can scan a receipt with my camera and have its data extracted automatically. | Camera captures image → ML Kit OCR extracts text → Gemini parses JSON → user lands on review screen with pre-filled fields |
| US-02 | As a user, I can review and edit AI-extracted receipt data before saving. | Review screen shows merchant, category, items table (name/price/qty) — all fields editable |
| US-03 | As a user, I can save a receipt to local storage and view it in my history. | Save writes to SQLite → home screen list updates on focus → detail screen shows full breakdown |
| US-04 | As a user, I can categorize receipts. | Category picker modal with 12 options; default to "Lainnya"; visual icon/color per category |
| US-05 | As a user, I can view total spending across all receipts. | Home screen shows sum of all `total_amount` values |
| US-06 | As a user, I can view individual receipt details, including item rows. | Detail screen shows merchant, total, category badge, item table, date, transaction ID |
| US-07 | As a user, I can delete a receipt. | Trash icon on detail screen triggers confirmation alert → deletes receipt + cascade deletes details |
| US-08 | As a user, I can configure my Gemini API key in settings. | Settings screen has secure text input for API key; persisted via Zustand + AsyncStorage |

### Nice-to-Have (Post-v1)

| ID | Story |
|----|-------|
| US-09 | As a user, I can filter/sort receipts by category or date. |
| US-10 | As a user, I can export my data as CSV/JSON. |
| US-11 | As a user, I can set monthly budgets per category. |
| US-12 | As a user, I can search receipts by merchant name. |

---

## 3. Functional Requirements

### FR-01: Camera Capture
- Request camera permission on first launch (expo-camera)
- Display live camera preview with dashed guide box overlay
- Capture button triggers `takePictureAsync` at quality 0.7
- Show loading overlay during processing
- Fallback gracefully if permission denied

### FR-02: OCR Processing
- Use `@react-native-ml-kit/text-recognition` on-device
- If no text detected, show error alert "Tidak ada teks yang terdeteksi pada gambar"

### FR-03: AI Parsing
- Send OCR text to Google Gemini AI via `@google/genai` SDK
- Model: `gemini-3-flash-preview`
- Response forced to JSON via `responseMimeType: "application/json"`
- Prompt extracts: merchant, category, totalAmount, date, items[ {name, price, qty} ]
- Category must be one of: Groceries, Transport, Dining, Shopping, Health, Entertainment, Lainnya
- If AI fails, show error alert and allow retry

### FR-04: Review & Edit
- Pre-populate merchant, category, items from AI response
- Editable TextInput for all fields
- Category picker: bottom-sheet Modal with FlatList grid of 12 category options
- Computed total displayed (read-only), derived from item prices × quantities
- Add item manually, remove individual items
- Items persist their IDs for stable React keys

### FR-05: Save to Database
- Validate: at least one item, merchant not empty
- Insert receipt + all details in a single SQLite transaction
- Use `expo-crypto` `randomUUID()` for primary keys
- Dismiss all modal screens on success, return to home

### FR-06: Home / History
- Load last 20 receipts sorted by `scan_date DESC`
- Show total expenditure sum
- Receipt list items: icon, merchant, category label, total, date
- Pull-to-refresh via `useFocusEffect` (re-fetches on screen focus)
- Empty state with scan icon and prompt

### FR-07: Receipt Details
- Load receipt by ID + all its details
- Display merchant, total (formatted with `.` thousand separators), category badge, formatted date (id-ID locale), item rows with quantity × unit price → line total
- Show transaction ID (truncated UUID) and source label ("AI Scanner")
- Delete button with confirmation dialog

### FR-08: Settings
- API key input (secureTextEntry, persisted via Zustand)
- Dark mode toggle (stored but not fully wired to theme)
- Save confirmation, clear all preferences
- Version label

---

## 4. Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | **Offline-first** | All data stored locally in SQLite; no internet required except for Gemini API call during scan |
| NFR-02 | **Privacy** | No user accounts, no cloud sync, no telemetry; API key stored only on-device via AsyncStorage |
| NFR-03 | **Performance** | Receipt list renders in FlatList; DB queries complete within 50ms; camera → review in <10s typical |
| NFR-04 | **Localization** | UI language: Indonesian (id-ID); date formatting: id-ID; currency: IDR (Rp) |
| NFR-05 | **Typography** | Space Grotesk (700/600/500) for headings/body; Inter (600/500) for UI elements |
| NFR-06 | **Reliability** | SQLite transactions for atomic inserts; error alerts for all failure modes; graceful handling of missing API key |
| NFR-07 | **Maintainability** | TypeScript throughout; path alias `@/*`; modular DB layer (schema/migrations/queries); Zustand for global state |

---

## 5. Data Model

```
receipts
├── id              TEXT (UUID, PK)
├── merchant        TEXT NOT NULL
├── category        TEXT NOT NULL
├── total_amount    REAL NOT NULL
└── scan_date       TEXT NOT NULL (ISO 8601)

receipt_details
├── id              TEXT (UUID, PK)
├── receipt_id      TEXT NOT NULL (FK → receipts.id, ON DELETE CASCADE)
├── item_name       TEXT NOT NULL
├── price           REAL NOT NULL
└── quantity        INTEGER NOT NULL
```

---

## 6. UI Flow / Navigation

```
App Launch
  └── Root Layout (Stack)
        ├── (tabs)
        │     ├── index.tsx   → Home (history + total)
        │     └── settings.tsx → API key, dark mode, preferences
        ├── scanner.tsx       → Camera → OCR → AI → review (modal)
        ├── review.tsx        → Edit & save receipt (modal)
        └── details.tsx       → View/delete single receipt (modal)
```

Floating scan button on tab layout navigates to `/scanner`.

---

## 7. Constraints & Assumptions

- **Model availability:** `gemini-3-flash-preview` is a preview model; may change or be deprecated. The `@google/genai` SDK version `^1.50.1` may need updating.
- **Network:** Gemini API requires internet; no offline fallback for AI parsing.
- **OCR accuracy:** ML Kit works best on printed, well-lit, flat receipts. Handwritten or damaged receipts may fail.
- **Single-user:** No auth, no multi-device sync.
- **Android-only oriented:** Camera and ML Kit are cross-platform but receipt scanning UX is optimized for phone form factors.
- **React Compiler experiment enabled** in app.json (`"reactCompiler": true`); may cause unexpected behavior with certain patterns.
