# SpendSnap - AI Context & Architecture Map

## Overview

SpendSnap is a serverless, personal-use mobile application built with React Native (Expo) designed to track financial outcomes. It extracts data from physical receipts using on-device OCR and structures that data using Google AI Studio.

## Tech Stack

- Framework: React Native (Expo ecosystem)

- OCR: @react-native-ml-kit/text-recognition (On-device, local execution)

- LLM Parsing: Google AI Studio (Gemini API)

- Local Database: SQLite

- State Management: Zustand (for transient/app-level state)

1. AI Parsing Strategy & Minimal Prompt
   To maximize token efficiency while ensuring a strict JSON response from Google AI Studio, the prompt is kept minimal. The AI is instructed to return an array of objects, processing the OCR text line-by-line.

System Prompt:

Plaintext
Extract line items from the provided OCR receipt text. Return ONLY a JSON array of objects. No markdown formatting, no explanations.
Format: [{"merchant": "string", "category": "string", "value": number}]
Data Schema Expectation:

merchant: The name of the store or vendor.

category: A general expense category (e.g., Groceries, Transport, Dining).

value: The numeric cost of the specific line item.

2. Database Architecture (SQLite)
   The database is intentionally flat and optimized for fast list rendering. Complex relational mapping is avoided.

Table: `receipt_items`

`id` (INTEGER PRIMARY KEY AUTOINCREMENT)

`merchant` (TEXT)

`category` (TEXT)

`value` (REAL)

`scan_date` (TEXT - ISO 8601 string, useful for chronological list rendering)

Query Pattern: Standard `SELECT * FROM receipt_items ORDER BY scan_date DESC` for rendering directly into a FlatList.

3. State & Component Architecture
   State is split cleanly between persistent application configuration and local transactional data.

API Key Management: Zustand is used strictly to hold the Google AI Studio API key. To prevent the need to re-enter the key on every launch, the Zustand store should be wrapped with middleware to persist the key to local storage.

Component Logic: To keep the component tree clean and prevent unnecessary prop-drilling, submission actions and processing logic (like saving the parsed AI response to SQLite) should be co-located directly within the child components handling the specific UI interactions, rather than controlled by high-level parent components.

## Data Flow:

- Camera captures image.

- ML Kit extracts raw text block.

- Co-located component retrieves API key from Zustand.

- Text + Key sent to Google AI Studio.

- JSON response parsed and inserted into SQLite.

- UI re-renders local list from SQLite.

4. Security Posture
   Risk Profile: Low. The application is strictly for personal use.

Implementation: No backend infrastructure or remote database is used. The API key is inputted at runtime by the user and persisted locally via Zustand. Standard local storage is deemed sufficient; encrypted secure enclaves are not required for this scope.
