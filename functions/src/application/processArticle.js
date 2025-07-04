const NewsDataFetcher = require('../infrastructure/newsdata/newsFetcher');
const RewriteService = require('../infrastructure/ai/rewriteService');
const FirestoreWriter = require('../infrastructure/db/firestoreWriter');
const logger = require('../shared/logger');

class ArticleProcessor {
  constructor() {
    this.newsFetcher = new NewsDataFetcher();
    this.rewriteService = new RewriteService();
    this.firestoreWriter = new FirestoreWriter();
  }

  /**
   * Main pipeline: Fetch -> Rewrite -> Store
   */
  async processArticles(topics = ['technology', 'ai'], language = 'en') {
    const startTime = Date.now();
    
    try {
      logger.info('Starting article processing pipeline', { topics, language });

      // Step 1: Fetch articles
      const rawArticles = await this.newsFetcher.fetchArticles(topics, language);
      
      if (rawArticles.length === 0) {
        logger.warn('No articles fetched, ending pipeline');
        return { processed: 0, errors: [] };
      }

      // Step 2: Filter articles with sufficient content
      const articlesWithContent = rawArticles.filter(article => 
        this.newsFetcher.hasSufficientContent(article)
      );

      logger.info('Articles with sufficient content', {
        total: rawArticles.length,
        withContent: articlesWithContent.length,
        skipped: rawArticles.length - articlesWithContent.length,
      });

      // Step 3: Process each article through AI rewrite
      const processedArticles = [];
      const errors = [];

      for (const article of articlesWithContent) {
        try {
          const rewrittenArticle = await this.rewriteService.rewriteArticle(article);
          processedArticles.push(rewrittenArticle);
        } catch (error) {
          errors.push({
            article: article.title?.substring(0, 50),
            error: error.message,
            step: 'rewrite',
          });
        }
      }

      // Step 4: Save to Firestore
      const saveResults = await this.firestoreWriter.saveArticles(processedArticles);
      
      // Combine errors
      const allErrors = [...errors, ...saveResults.errors];

      const endTime = Date.now();
      const duration = endTime - startTime;

      logger.info('Article processing pipeline completed', {
        duration: `${duration}ms`,
        totalFetched: rawArticles.length,
        processed: processedArticles.length,
        saved: saveResults.results.length,
        errors: allErrors.length,
      });

      return {
        processed: saveResults.results.length,
        errors: allErrors,
        duration,
        stats: {
          totalFetched: rawArticles.length,
          withContent: articlesWithContent.length,
          processed: processedArticles.length,
          saved: saveResults.results.length,
        },
      };

    } catch (error) {
      logger.error('Pipeline failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Process a single article (for testing/debugging)
   */
  async processSingleArticle(article) {
    try {
      logger.info('Processing single article', { 
        title: article.title?.substring(0, 50) + '...' 
      });

      const rewrittenArticle = await this.rewriteService.rewriteArticle(article);
      const savedArticle = await this.firestoreWriter.saveArticle(rewrittenArticle);

      return savedArticle;

    } catch (error) {
      logger.error('Single article processing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get pipeline status and statistics
   */
  async getStatus() {
    try {
      const articleCount = await this.firestoreWriter.getArticleCount();
      const aiAvailable = this.rewriteService.isAvailable();

      return {
        firestoreConnected: !!this.firestoreWriter.db,
        aiServiceAvailable: aiAvailable,
        totalArticles: articleCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting pipeline status', { error: error.message });
      return {
        firestoreConnected: false,
        aiServiceAvailable: false,
        totalArticles: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = ArticleProcessor; 