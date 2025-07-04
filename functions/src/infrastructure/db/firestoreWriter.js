const admin = require('firebase-admin');
const { config } = require('../../config');
const logger = require('../../shared/logger');
const { 
  generateArticleId, 
  generateContentHash, 
  formatTimestamp 
} = require('../../shared/utils');

class FirestoreWriter {
  constructor() {
    this.db = null;
    this.collection = 'articles';
    this.initializeFirebase();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  initializeFirebase() {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            privateKeyId: config.firebase.privateKeyId,
            privateKey: config.firebase.privateKey,
            clientEmail: config.firebase.clientEmail,
            clientId: config.firebase.clientId,
            authUri: config.firebase.authUri,
            tokenUri: config.firebase.tokenUri,
            authProviderX509CertUrl: config.firebase.authProviderX509CertUrl,
            clientX509CertUrl: config.firebase.clientX509CertUrl,
          }),
        });
      }
      
      this.db = admin.firestore();
      logger.info('Firebase Admin SDK initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase Admin SDK', { error: error.message });
      throw error;
    }
  }

  /**
   * Save a single article to Firestore
   */
  async saveArticle(article) {
    try {
      if (!this.db) {
        throw new Error('Firestore not initialized');
      }

      // Validate article data
      const validatedArticle = this.validateArticle(article);
      
      // Check for duplicates
      const isDuplicate = await this.checkDuplicate(validatedArticle.originalUrl);
      if (isDuplicate) {
        logger.warn('Duplicate article found, skipping', { 
          url: validatedArticle.originalUrl 
        });
        return null;
      }

      // Prepare article document
      const articleDoc = {
        id: generateArticleId(),
        title: validatedArticle.title,
        summary: validatedArticle.summary,
        body: validatedArticle.body,
        originalUrl: validatedArticle.originalUrl,
        source: validatedArticle.source,
        topics: validatedArticle.topics || [],
        aiGenerated: true,
        imageUrl: validatedArticle.imageUrl || null,
        imageAttribution: validatedArticle.imageAttribution || null,
        createdAt: formatTimestamp(),
        contentHash: generateContentHash(validatedArticle.title, validatedArticle.originalUrl),
      };

      // Save to Firestore
      const docRef = await this.db.collection(this.collection).add(articleDoc);
      // above code should reference to the document id first then add or set the document
      
      logger.info('Article saved successfully', {
        docId: docRef.id,
        title: articleDoc.title?.substring(0, 50) + '...',
        source: articleDoc.source,
      });

      return {
        id: docRef.id,
        ...articleDoc,
      };

    } catch (error) {
      logger.error('Error saving article to Firestore', {
        error: error.message,
        articleTitle: article.title?.substring(0, 50),
      });
      throw error;
    }
  }

  /**
   * Save multiple articles to Firestore
   */

  //firestore should save the articles, it just pushes to a result array
  async saveArticles(articles) {
    const results = [];
    const errors = [];

    for (const article of articles) {
      try {
        const result = await this.saveArticle(article);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        errors.push({
          article: article.title?.substring(0, 50),
          error: error.message,
        });
      }
    }

    logger.info('Batch article save completed', {
      total: articles.length,
      saved: results.length,
      errors: errors.length,
    });

    if (errors.length > 0) {
      logger.warn('Some articles failed to save', { errors });
    }

    return { results, errors };
  }

  /**
   * Validate article data before saving
   */
  validateArticle(article) {
    const required = ['title', 'summary', 'body', 'originalUrl'];
    const missing = required.filter(field => !article[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return {
      title: article.title.trim(),
      summary: article.summary.trim(),
      body: article.body.trim(),
      originalUrl: article.originalUrl,
      source: article.source || 'unknown',
      topics: Array.isArray(article.topics) ? article.topics : [],
      imageUrl: article.imageUrl || null,
      imageAttribution: article.imageAttribution || null,
    };
  }

  /**
   * Check if article already exists (duplicate detection)
   */
  async checkDuplicate(originalUrl) {
    try {
      const snapshot = await this.db
        .collection(this.collection)
        .where('originalUrl', '==', originalUrl)
        .limit(1)
        .get();

      return !snapshot.empty;
    } catch (error) {
      logger.warn('Error checking for duplicates', { error: error.message });
      return false; // Allow save if check fails
    }
  }

  /**
   * Get article count in collection
   */
  async getArticleCount() {
    try {
      const snapshot = await this.db.collection(this.collection).get();
      return snapshot.size;
    } catch (error) {
      logger.error('Error getting article count', { error: error.message });
      return 0;
    }
  }
}

module.exports = FirestoreWriter; 