# 🧾 PRD – FeedBeep Content Ingestion Pipeline

## 📌 Overview

This service fetches news articles from public APIs (like NewsData.io and optionally GNews), rewrites them using AI (Gemini/OpenAI), and stores the rewritten articles in Supabase for delivery through the FeedBeep app and chatbot interface.

---

## 🎯 Goal

* Automate the fetching, rewriting, and storage of article content.
* Minimize user redirection by providing full content inline.
* Build a scalable, modular, fallback-ready backend pipeline.

---

## 🧱 Architecture Overview

```
+---------------------+
| Scheduled/Manual Fn |
+---------------------+
           |
           v
+---------------------+     (NewsData API / GNews)
| newsFetcher.js      |-----------------------> Fetch Articles
+---------------------+
           |
           v
+---------------------+
| rewriteService.js   |-----> Gemini/OpenAI
+---------------------+
           |
           v
+---------------------+
| supabaseWriter.js   |-----> Supabase (articles table)
+---------------------+
```

If `full_content` is missing:

* Fallback: Scraper module plugs in for selected articles.

---

## 📥 Input

| Source      | Notes                          |
| ----------- | ------------------------------ |
| NewsData.io | API call with `full_content=1` |
| GNews       | Optional, for additional coverage |
| Topics      | Based on user/app preferences  |
| Language    | English (for now)              |

---

## 📤 Output (Supabase Schema)

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

## 🧩 Modules and Responsibilities

### ✅ `newsFetcher.js`

* Scheduled/Manual Function
* Calls NewsData.io (and optionally GNews) with relevant params (`full_content=1`)
* Returns articles (filtered/cleaned)

### ✅ `rewriteService.js`

* Accepts full content
* Uses Gemini/OpenAI to:
  * Rephrase title
  * Generate summary
  * Clean the article body
* Returns structured object

### ✅ `supabaseWriter.js`

* Writes formatted articles to Supabase
* Adds timestamp and metadata

### ✅ (Optional) `scraperFallbackHandler.js`

* Called when article is missing `full_content`
* Uses scraper to fetch full HTML
* Passes cleaned HTML through same AI rewrite flow

### ✅ Shared Modules

* `rateLimiter.js`: API rate limiting
* `contentQualityAnalyzer.js`: Scores and analyzes article quality
* `monitoring.js`: Tracks pipeline runs, errors, and metrics
* `logger.js`: Structured logging
* `utils.js`: Helpers for cleaning, hashing, etc.

---

## 🧪 Edge Cases

| Case                      | Handling                             |
| ------------------------- | ------------------------------------ |
| `full_content` is missing | Use scraper fallback if enabled      |
| AI model error            | Log + skip, retry later (TBD)        |
| Duplicates (same URL)     | Check with `originalUrl`/hash        |
| Paywalled content         | Currently skipped                    |
| API rate limits           | Enforced via rateLimiter module      |
| Low content quality       | Scored and optionally filtered       |

---

## 📁 Suggested File Structure

```
/functions
  /src
    /application
      - processArticle.js
    /infrastructure
      /newsdata
        - newsFetcher.js
      /ai
        - rewriteService.js
      /db
        - supabaseWriter.js
      /scraper
        - scraperFallbackHandler.js (optional)
    /config
      - index.js (API keys, settings)
    /shared
      - logger.js
      - utils.js
      - rateLimiter.js
      - contentQualityAnalyzer.js
      - monitoring.js
    /test
      - sampleNews.json
      - pipeline.test.js
  firebase.json
  .env.example
  README.md or PRD.md
```

---

## 🚀 MVP Success Criteria

* [ ] At least 5–10 articles fetched from NewsData.io (and/or GNews)
* [ ] AI rewrite returns headline, summary, and clean body
* [ ] Articles saved in Supabase (mock or real)
* [ ] Logs in place for errors and full_content gaps
* [ ] Fallback scraper can be plugged in smoothly
* [ ] Content quality is scored and monitored

---

## 🤖 AI Agent Hints (for Cursor)

* "Write a Node.js function to fetch from NewsData.io with full_content=1"
* "Stub a Gemini AI or OpenAI API call for rewriting article content"
* "Generate a Supabase insert function for rewritten article objects"
* "Log and skip if full_content field is missing"
* "Design a modular architecture for a scheduled content pipeline"