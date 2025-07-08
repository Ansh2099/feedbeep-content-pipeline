# 📰 FeedBeep Content Ingestion Pipeline

Automate the fetching, AI rewriting, and storage of news articles for the FeedBeep app. This pipeline fetches articles from NewsData.io (and optionally GNews), rewrites them using Gemini AI (Google) or OpenAI, and stores the results in Supabase for delivery to your app or chatbot.

---

## 🚀 Features
- Fetches news articles from NewsData.io (and optionally GNews) with full content
- Rewrites headlines, summaries, and article bodies using Gemini AI or OpenAI
- Stores rewritten articles in Supabase with rich metadata
- Modular, extensible architecture (easy to add new sources or AI models)
- Logging, duplicate detection, and content quality analysis
- Rate limiting and monitoring built-in
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
| newsFetcher.js      |  ---> NewsData.io / GNews
+---------------------+
          |
          v
+---------------------+
| rewriteService.js   |  ---> Gemini AI / OpenAI
+---------------------+
          |
          v
+---------------------+
| supabaseWriter.js   |  ---> Supabase
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
        newsFetcher.js          # Fetches news from NewsData.io (and GNews)
      /ai
        rewriteService.js       # Rewrites content using Gemini AI or OpenAI
      /db
        supabaseWriter.js       # Stores articles in Supabase
      /scraper
        scraperFallbackHandler.js # Fallback content scraper
    /config
      index.js                  # Loads and validates environment config
    /shared
      logger.js                 # Logging utility
      utils.js                  # Common helpers
      rateLimiter.js            # API rate limiting
      contentQualityAnalyzer.js # Content quality scoring
      monitoring.js             # Performance monitoring
    /test
      sampleNews.json           # Sample data for testing
      pipeline.test.js          # Unit tests
  index.js                      # Main entry point
  server.js                     # HTTP API server (if present)
firebase.json                   # Firebase Functions config
.env.example                    # Example environment config
package.json                    # Dependencies and scripts
README.md                       # This file
PRD.md                          # Product requirements doc
API.md                          # API documentation
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
  - `OPENAI_API_KEY` (from [OpenAI](https://platform.openai.com/))
  - `GNEWS_API_KEY` (optional, from [GNews](https://gnews.io/))
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (from your Supabase project settings)

#### Supabase Setup
- Create a Supabase project at [Supabase Console](https://supabase.com/dashboard)
- Run the SQL migration in `supabase-migration.sql` in your Supabase SQL Editor to create the articles table
- Copy your project URL and service role key into your `.env`

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
- See `functions/src/index.js` for exported handlers (manualTrigger, scheduledTrigger, getStatus, testSingleArticle).

---

## 🧩 Module Responsibilities

- **newsFetcher.js**: Fetches and cleans articles from NewsData.io (and GNews)
- **rewriteService.js**: Uses Gemini AI or OpenAI to rewrite title, summary, and body
- **supabaseWriter.js**: Saves articles to Supabase, checks for duplicates
- **processArticle.js**: Orchestrates the pipeline (fetch → rewrite → store)
- **scraperFallbackHandler.js**: Scrapes content if full content is missing
- **logger.js**: Structured logging
- **utils.js**: Helpers for cleaning, hashing, etc.
- **rateLimiter.js**: API rate limiting
- **contentQualityAnalyzer.js**: Scores and analyzes article quality
- **monitoring.js**: Tracks pipeline runs, errors, and metrics

---

## 🗃️ Supabase Schema
Table: `articles`

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
| `created_at`       | `timestamp` | Article ingestion time                |

---

## 🛠️ Troubleshooting & Tips

- **Missing API Keys**: Ensure all required keys are set in `.env`.
- **Supabase Errors**: Double-check your project URL and service role key.
- **Gemini/OpenAI Issues**: Make sure your API keys are valid and have quota.
- **No Articles Saved**: Check logs for duplicate detection or missing fields.
- **Switching AI Models**: Set `AI_MODEL` in `.env` to `geminipro` or `gpt-4` as needed.

---

## 🧪 Testing
- Use the sample data in `functions/src/test/sampleNews.json` to test the pipeline logic without external API calls.
- You can extend the pipeline to support more sources, fallback scrapers, or additional AI models as needed.

---

## 📄 License
MIT (see LICENSE for commercial use restrictions)

---

## 👨‍💻 Authors
FeedBeep Team 