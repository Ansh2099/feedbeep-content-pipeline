const NewsDataFetcher = require('../infrastructure/newsdata/newsFetcher');
const RewriteService = require('../infrastructure/ai/rewriteService');
const SupabaseWriter = require('../infrastructure/db/supabaseWriter');
const ScraperFallbackHandler = require('../infrastructure/scraper/scraperFallbackHandler');
const logger = require('../shared/logger');

class ArticleProcessor {
  constructor() {
    this.newsFetcher = new NewsDataFetcher();
    this.rewriteService = new RewriteService();
    this.supabaseWriter = new SupabaseWriter();
    this.scraperFallback = new ScraperFallbackHandler();
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

      // Step 2: Process articles with insufficient content through fallback scraper
      const articlesWithContent = [];
      const articlesNeedingScraping = [];

      for (const article of rawArticles) {
        if (this.newsFetcher.hasSufficientContent(article)) {
          articlesWithContent.push(article);
        } else {
          articlesNeedingScraping.push(article);
        }
      }

      // Step 2.5: Try to scrape content for articles without full content
      if (articlesNeedingScraping.length > 0 && this.scraperFallback.isAvailable()) {
        logger.info('Attempting to scrape content for articles without full content', {
          count: articlesNeedingScraping.length
        });

        for (const article of articlesNeedingScraping) {
          try {
            const scrapedArticle = await this.scraperFallback.scrapeArticleContent(article);
            if (scrapedArticle && scrapedArticle.hasFullContent) {
              articlesWithContent.push(scrapedArticle);
              logger.info('Successfully scraped article content', {
                title: article.title?.substring(0, 50) + '...'
              });
            }
          } catch (error) {
            logger.warn('Failed to scrape article', {
              title: article.title?.substring(0, 50) + '...',
              error: error.message
            });
          }
        }
      }

      logger.info('Articles ready for processing', {
        total: rawArticles.length,
        withContent: articlesWithContent.length,
        scraped: articlesWithContent.length - rawArticles.filter(a => this.newsFetcher.hasSufficientContent(a)).length,
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

      // Step 4: Save to Supabase
      const saveResults = await this.supabaseWriter.saveArticles(processedArticles);
      
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
      const savedArticle = await this.supabaseWriter.saveArticle(rewrittenArticle);

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
      const articleCount = await this.supabaseWriter.getArticleCount();
      const aiAvailable = this.rewriteService.isAvailable();

      return {
        supabaseConnected: !!this.supabaseWriter.supabase,
        aiServiceAvailable: aiAvailable,
        totalArticles: articleCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting pipeline status', { error: error.message });
      return {
        supabaseConnected: false,
        aiServiceAvailable: false,
        totalArticles: 0,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = ArticleProcessor; 