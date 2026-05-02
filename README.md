# SpendSnap 📸💸

SpendSnap is a modern, premium AI-powered receipt tracker built with React Native (Expo). It uses Google's Gemini AI to automatically extract merchant names, categories, and itemized lists from your physical receipts, storing them securely in an offline SQLite database.

## ✨ Features

- **AI-Powered OCR:** Scan receipts using your camera, and Gemini AI extracts line items automatically.
- **Offline-First:** All receipts and item details are saved locally using Expo SQLite with a robust One-to-Many relational architecture.
- **Premium UI:** Soft pastel indigo aesthetics combined with structured Space Grotesk typography.
- **No Login Required:** Your data stays on your device.

## 🚀 How to Run the App

### Prerequisites

1. Install [Node.js](https://nodejs.org/).
2. Install the **Expo Go** app on your physical iOS or Android device.

### Installation

1. Clone or download this project to your local machine.
2. Open your terminal and navigate to the project folder.
3. Install the dependencies:
   ```bash
   npm install
   Starting the App
   Start the Expo development server (we use the -c flag to clear the cache and ensure a smooth start):
   ```

Bash
npx expo start -c
Open the Expo Go app on your phone.

Scan the QR code displayed in your terminal (or press 'a' to run on an Android emulator / 'i' for iOS simulator).

## 🔑 Configuration (API Key)

To enable the AI scanning feature, you need a free Google Gemini API Key:

1. Go to Google AI Studio and create an API key.

2. Open the SpendSnap app on your device.

3. Navigate to the Settings tab.

4. Paste your Gemini API key and tap Save.

## 🛠️ Tech Stack

- Framework: React Native / Expo Router

- Database: Expo SQLite (with Transactions & Foreign Keys)

- State Management: Zustand

- AI Integration: @google/genai

- Typography: @expo-google-fonts/space-grotesk
