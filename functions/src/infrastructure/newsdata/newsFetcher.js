const axios = require('axios');
const { config } = require('../../config');
const logger = require('../../shared/logger');
const { cleanUrl, extractDomain, cleanContent, isValidArticle } = require('../../shared/utils');
const { fetchGNewsArticles } = require('./gnewsFetcher');

class NewsDataFetcher {
  constructor() {
    this.apiKey = config.newsdata.apiKey;
    this.baseUrl = config.newsdata.baseUrl;
    this.maxArticles = config.app.maxArticlesPerFetch;
  }

  /**
   * Fetch articles from NewsData.io API
   */
  async fetchArticles(topics = ['technology', 'ai'], language = 'en') {
    try {
      logger.info('Fetching articles from NewsData.io', { topics, language });

      const params = {
        apikey: this.apiKey,
        q: topics.join(' OR '),
        language,
        full_content: 1, // Request full content
        size: this.maxArticles,
      };

      const response = await axios.get(this.baseUrl, { params });
      
      if (response.data.status !== 'success') {
        throw new Error(`NewsData API error: ${response.data.message || 'Unknown error'}`);
      }

      const articles = response.data.results || [];
      logger.info(`Fetched ${articles.length} articles from NewsData.io`);

      // Filter and clean articles
      const validArticles = articles
        .filter(isValidArticle)
        .map(article => this.cleanArticle(article));

      logger.info(`Processed ${validArticles.length} valid articles`);

      return validArticles;

    } catch (error) {
      logger.error('Error fetching articles from NewsData.io', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      // Fallback to GNews
      logger.info('Falling back to GNews API for articles', { topics, language });
      try {
        const gnewsArticles = await fetchGNewsArticles({ topics, language, max: this.maxArticles });
        logger.info(`Fetched ${gnewsArticles.length} articles from GNews`);
        // Normalize GNews articles to match expected structure
        return gnewsArticles.map(article => ({
          title: article.title?.trim(),
          content: article.content || article.description || '',
          originalUrl: cleanUrl(article.url),
          source: extractDomain(article.url),
          imageUrl: article.imageUrl || null,
          publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
          topics: topics,
          hasFullContent: false, // GNews does not provide full content
        }));
      } catch (gnewsError) {
        logger.error('GNews fallback also failed', { error: gnewsError.message });
        throw error; // Throw original NewsData error
      }
    }
  }

  /**
   * Clean and format article data
   */
  cleanArticle(article) {
    return {
      title: article.title?.trim(),
      content: cleanContent(article.content),
      originalUrl: cleanUrl(article.link),
      source: extractDomain(article.link),
      imageUrl: article.image_url || null,
      publishedAt: article.pubDate ? new Date(article.pubDate) : null,
      topics: this.extractTopics(article),
      hasFullContent: !!(article.content && article.content.length > 200),
    };
  }

  /**
   * Extract topics from article data
   */
  extractTopics(article) {
    const topics = new Set();
    
    // Add category if available
    if (article.category && Array.isArray(article.category)) {
      article.category.forEach(cat => topics.add(cat.toLowerCase()));
    }
    
    // Add keywords if available
    if (article.keywords && Array.isArray(article.keywords)) {
      article.keywords.forEach(keyword => topics.add(keyword.toLowerCase()));
    }

    return Array.from(topics);
  }

  /**
   * Check if article has sufficient content for processing
   */
  hasSufficientContent(article) {
    return article.hasFullContent;
  }
}

module.exports = NewsDataFetcher; 