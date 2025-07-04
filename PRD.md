# 🧾 PRD – FeedBeep Content Ingestion Pipeline

## 📌 Overview

This service is responsible for fetching news articles from public APIs (like NewsData.io), rewriting them using AI (Gemini/OpenAI), and storing the rewritten articles in Firestore for delivery through the FeedBeep app and chatbot interface.

---

## 🎯 Goal

* Automate the fetching, rewriting, and storage of article content.
* Minimize user redirection by providing full content inline.
* Build a scalable, modular, fallback-ready backend pipeline.

---

## 🧱 Architecture Overview

```
+---------------------+
| Scheduled Function  |
+---------------------+
           |
           v
+---------------------+     (NewsData API)
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
| firestoreWriter.js  |-----> Firestore (articles collection)
+---------------------+
```

If `full_content` is missing:

* Fallback: Bibek’s scraper plugs in for selected articles.

---

## 📥 Input

| Source      | Notes                          |
| ----------- | ------------------------------ |
| NewsData.io | API call with `full_content=1` |
| Topics      | Based on user/app preferences  |
| Language    | English (for now)              |

---

## 📤 Output (Firestore Schema)

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

## 🧩 Modules and Responsibilities

### ✅ `newsFetcher.js`

* Scheduled Cloud Function
* Calls NewsData.io with relevant params (`full_content=1`)
* Returns articles (filtered/cleaned)

### ✅ `rewriteService.js`

* Accepts full content
* Uses Gemini/OpenAI to:

  * Rephrase title
  * Generate summary
  * Clean the article body
* Returns structured object

### ✅ `firestoreWriter.js`

* Writes formatted articles to Firestore
* Adds timestamp and metadata

### ✅ (Optional) `scraperFallbackHandler.js`

* Called when article is missing `full_content`
* Uses Bibek’s scraper (when available) to fetch full HTML
* Passes cleaned HTML through same AI rewrite flow

---

## 🧪 Edge Cases

| Case                      | Handling                             |
| ------------------------- | ------------------------------------ |
| `full_content` is missing | Skip or queue for scraper fallback   |
| AI model error            | Log + skip, retry later (TBD)        |
| Duplicates (same URL)     | Check with `originalUrl`/hash        |
| Paywalled content         | Currently skipped (Matias confirmed) |

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
        - firestoreWriter.js
      /scraper
        - scraperFallbackHandler.js (optional)
    /config
      - index.js (API keys, settings)
    /shared
      - logger.js
      - utils.js
    /test
      - sampleNews.json
  firebase.json
  .env.example
  README.md or PRD.md
```

---

## 🚀 MVP Success Criteria

* [ ] At least 5–10 articles fetched from NewsData.io
* [ ] AI rewrite returns headline, summary, and clean body
* [ ] Articles saved in Firestore (mock or real)
* [ ] Logs in place for errors and full\_content gaps
* [ ] Fallback scraper can be plugged in smoothly

---

## 🤖 AI Agent Hints (for Cursor)

* `"Write a Node.js function to fetch from NewsData.io with full_content=1"`
* `"Stub a Gemini AI API call for rewriting article content"`
* `"Generate a Firestore insert function for rewritten article objects"`
* `"Log and skip if full_content field is missing"`
* `"Design a modular architecture for a scheduled content pipeline"`

---