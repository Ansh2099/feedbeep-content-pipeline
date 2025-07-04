# 📰 FeedBeep Content Ingestion Pipeline

Automate the fetching, AI rewriting, and storage of news articles for the FeedBeep app. This pipeline fetches articles from NewsData.io, rewrites them using Gemini AI (Google), and stores the results in Firestore for delivery to your app or chatbot.

---

## 🚀 Features
- Fetches news articles from NewsData.io with full content
- Rewrites headlines, summaries, and article bodies using Gemini AI
- Stores rewritten articles in Firestore with rich metadata
- Modular, extensible architecture (easy to add new sources or AI models)
- Logging and duplicate detection
- Ready for local development, manual runs, or scheduled deployment

---

## 🧱 Architecture Overview

```
+---------------------+
| Manual/Scheduled Fn |
+---------------------+
          |
          v
+---------------------+
| newsFetcher.js      |  ---> NewsData.io
+---------------------+
          |
          v
+---------------------+
| rewriteService.js   |  ---> Gemini AI
+---------------------+
          |
          v
+---------------------+
| firestoreWriter.js  |  ---> Firestore
+---------------------+
```

---

## 📦 Project Structure

```
/functions
  /src
    /application
      processArticle.js         # Orchestrates the pipeline
    /infrastructure
      /newsdata
        newsFetcher.js          # Fetches news from NewsData.io
      /ai
        rewriteService.js       # Rewrites content using Gemini AI
      /db
        firestoreWriter.js      # Stores articles in Firestore
    /config
      index.js                  # Loads and validates environment config
    /shared
      logger.js                 # Logging utility
      utils.js                  # Common helpers
    /test
      sampleNews.json           # Sample data for testing
  index.js                      # Main entry point
.env.example                    # Example environment config
package.json                    # Dependencies and scripts
README.md                       # This file
PRD.md                          # Product requirements doc
```

---

## ⚙️ Setup & Configuration

### 1. Clone the Repository
```bash
# Clone and enter the project directory
$ git clone <your-repo-url>
$ cd feedbeep-content-pipeline
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
- Copy `.env.example` to `.env`:
  ```bash
  cp env.example .env
  ```
- Fill in your API keys and Firebase service account details in `.env`:
  - `NEWSDATA_API_KEY` (from [NewsData.io](https://newsdata.io/))
  - `GEMINI_API_KEY` (from [Google AI Studio](https://aistudio.google.com/app/apikey))
  - `FIREBASE_*` (from your Firebase service account JSON)

#### Firebase Setup
- Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
- Create a Firestore database (test mode is fine for dev)
- Generate a service account key (JSON) and copy the values into your `.env`

### 4. (Optional) Test with Sample Data
- Use `functions/src/test/sampleNews.json` for local testing without hitting APIs.

---

## 🏃 Usage

### Manual Run (Local Development)
```bash
node functions/src/index.js
```
- This will fetch, rewrite, and store articles using your config.
- Logs will be printed to the console.

### (Optional) HTTP/Cloud Function
- The code is structured for easy integration with Express or Firebase Functions if you want to trigger via HTTP or schedule.
- See `functions/src/index.js` for exported handlers.

---

## 🧩 Module Responsibilities

- **newsFetcher.js**: Fetches and cleans articles from NewsData.io
- **rewriteService.js**: Uses Gemini AI to rewrite title, summary, and body
- **firestoreWriter.js**: Saves articles to Firestore, checks for duplicates
- **processArticle.js**: Orchestrates the pipeline (fetch → rewrite → store)
- **logger.js**: Structured logging
- **utils.js**: Helpers for cleaning, hashing, etc.

---

## 🗃️ Firestore Schema
Collection: `articles`

| Field              | Type        | Description                           |
| ------------------ | ----------- | ------------------------------------- |
| `id`               | `string`    | Auto-generated / UUID                 |
| `title`            | `string`    | AI-rewritten headline                 |
| `summary`          | `string`    | AI-generated TL;DR                    |
| `body`             | `string`    | Full rewritten article                |
| `originalUrl`      | `string`    | Source URL                            |
| `source`           | `string`    | Publisher domain                      |
| `topics`           | `string[]`  | Tags like `["AI", "Finance"]`         |
| `aiGenerated`      | `boolean`   | Always `true`                         |
| `imageUrl`         | `string`    | (optional) License-free fetched image |
| `imageAttribution` | `string`    | (optional) Attribution if needed      |
| `createdAt`        | `timestamp` | Article ingestion time                |

---

## 🛠️ Troubleshooting & Tips

- **Missing API Keys**: Ensure all required keys are set in `.env`.
- **Firebase Errors**: Double-check your service account values and Firestore setup.
- **Gemini AI Issues**: Make sure your Gemini API key is valid and has quota.
- **No Articles Saved**: Check logs for duplicate detection or missing fields.
- **Switching to OpenAI**: Add your `OPENAI_API_KEY` and set `AI_MODEL=openai` in `.env` (code may need minor extension).

---

## 🧪 Testing
- Use the sample data in `functions/src/test/sampleNews.json` to test the pipeline logic without external API calls.
- You can extend the pipeline to support more sources, fallback scrapers, or additional AI models as needed.

---

## 📄 License
MIT

---

## 👨‍💻 Authors
FeedBeep Team 