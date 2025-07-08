const axios = require('axios');
const logger = require('../../shared/logger');
const { cleanContent } = require('../../shared/utils');

class ScraperFallbackHandler {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Attempt to scrape full content from article URL
   */
  async scrapeArticleContent(article) {
    try {
      if (!article.originalUrl) {
        throw new Error('No URL provided for scraping');
      }

      logger.info('Attempting to scrape article content', { 
        url: article.originalUrl,
        title: article.title?.substring(0, 50) + '...'
      });

      const response = await axios.get(article.originalUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000, // 10 second timeout
      });

      const html = response.data;
      const extractedContent = this.extractContentFromHTML(html);

      if (!extractedContent || extractedContent.length < 100) {
        throw new Error('Insufficient content extracted from HTML');
      }

      logger.info('Successfully scraped article content', {
        originalLength: article.content?.length || 0,
        scrapedLength: extractedContent.length,
        url: article.originalUrl
      });

      return {
        ...article,
        content: extractedContent,
        hasFullContent: true,
        contentSource: 'scraper'
      };

    } catch (error) {
      logger.warn('Failed to scrape article content', {
        error: error.message,
        url: article.originalUrl,
        title: article.title?.substring(0, 50)
      });
      return null;
    }
  }

  /**
   * Extract main content from HTML using common selectors
   */
  extractContentFromHTML(html) {
    try {
      // Simple regex-based extraction (can be enhanced with cheerio for better parsing)
      const contentSelectors = [
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*class="[^"]*entry[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<main[^>]*>([\s\S]*?)<\/main>/gi,
      ];

      let extractedContent = '';

      for (const selector of contentSelectors) {
        const matches = html.match(selector);
        if (matches && matches.length > 0) {
          extractedContent = matches[0];
          break;
        }
      }

      // If no specific content area found, try to extract from body
      if (!extractedContent) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          extractedContent = bodyMatch[1];
        }
      }

      // Clean the extracted content
      return this.cleanExtractedContent(extractedContent);

    } catch (error) {
      logger.error('Error extracting content from HTML', { error: error.message });
      return '';
    }
  }

  /**
   * Clean extracted HTML content
   */
  cleanExtractedContent(html) {
    if (!html) return '';

    return html
      // Remove script and style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove navigation and header elements
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      // Remove common ad and sidebar classes
      .replace(/<div[^>]*class="[^"]*(ad|sidebar|widget|social|share)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
      // Convert HTML to text
      .replace(/<[^>]+>/g, ' ')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if scraping is available/enabled
   */
  isAvailable() {
    return true; // Can be made configurable
  }
}

module.exports = ScraperFallbackHandler; 