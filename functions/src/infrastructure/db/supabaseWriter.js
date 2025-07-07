const { createClient } = require('@supabase/supabase-js');
const { config } = require('../../config');
const logger = require('../../shared/logger');
const { 
  generateArticleId, 
  generateContentHash, 
  formatTimestamp 
} = require('../../shared/utils');

class SupabaseWriter {
  constructor() {
    this.supabase = null;
    this.table = 'articles';
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client
   */
  initializeSupabase() {
    try {
      this.supabase = createClient(
        config.supabase.url,
        config.supabase.serviceRoleKey
      );
      logger.info('Supabase client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Supabase client', { error: error.message });
      throw error;
    }
  }

  /**
   * Save a single article to Supabase
   */
  async saveArticle(article) {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
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
        original_url: validatedArticle.originalUrl,
        source: validatedArticle.source,
        topics: validatedArticle.topics || [],
        ai_generated: true,
        image_url: validatedArticle.imageUrl || null,
        image_attribution: validatedArticle.imageAttribution || null,
        created_at: formatTimestamp(),
        content_hash: generateContentHash(validatedArticle.title, validatedArticle.originalUrl),
      };

      // Save to Supabase
      const { data, error } = await this.supabase
        .from(this.table)
        .insert(articleDoc)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Supabase insert error: ${error.message}`);
      }
      
      logger.info('Article saved successfully', {
        docId: data.id,
        title: data.title?.substring(0, 50) + '...',
        source: data.source,
      });

      return {
        id: data.id,
        ...data,
      };

    } catch (error) {
      logger.error('Error saving article to Supabase', {
        error: error.message,
        articleTitle: article.title?.substring(0, 50),
      });
      throw error;
    }
  }

  /**
   * Save multiple articles to Supabase
   */
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
      const { data, error } = await this.supabase
        .from(this.table)
        .select('id')
        .eq('original_url', originalUrl)
        .limit(1);

      if (error) {
        throw new Error(`Supabase query error: ${error.message}`);
      }

      return data && data.length > 0;
    } catch (error) {
      logger.warn('Error checking for duplicates', { error: error.message });
      return false; // Allow save if check fails
    }
  }

  /**
   * Get article count in table
   */
  async getArticleCount() {
    try {
      const { count, error } = await this.supabase
        .from(this.table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw new Error(`Supabase count error: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      logger.error('Error getting article count', { error: error.message });
      return 0;
    }
  }
}

module.exports = SupabaseWriter; 