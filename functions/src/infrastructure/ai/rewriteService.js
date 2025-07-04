const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config } = require('../../config');
const logger = require('../../shared/logger');
const { cleanContent } = require('../../shared/utils');

class RewriteService {
  constructor() {
    this.model = config.ai.model;
    
    if (config.ai.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);
      this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    }
  }

  /**
   * Rewrite article using AI
   */
  async rewriteArticle(article) {
    try {
      logger.info('Starting AI rewrite for article', { 
        title: article.title?.substring(0, 50) + '...',
        contentLength: article.content?.length 
      });

      const [rewrittenTitle, summary, rewrittenBody] = await Promise.all([
        this.rewriteTitle(article.title),
        this.generateSummary(article.content),
        this.rewriteBody(article.content),
      ]);

      const rewrittenArticle = {
        ...article,
        title: rewrittenTitle,
        summary,
        body: rewrittenBody,
        aiGenerated: true,
      };

      logger.info('AI rewrite completed successfully', {
        originalTitleLength: article.title?.length,
        newTitleLength: rewrittenTitle?.length,
        summaryLength: summary?.length,
        bodyLength: rewrittenBody?.length,
      });

      return rewrittenArticle;

    } catch (error) {
      logger.error('Error during AI rewrite', {
        error: error.message,
        articleTitle: article.title?.substring(0, 50),
      });
      throw error;
    }
  }

  /**
   * Rewrite article title to be more engaging
   */
  async rewriteTitle(originalTitle) {
    if (!originalTitle) return '';

    const prompt = `
      Rewrite this news headline to be more engaging and clear. 
      Keep it concise (under 100 characters) and maintain the core meaning.
      
      Original title: "${originalTitle}"
      
      Rewritten title:`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim().replace(/"/g, '');
    } catch (error) {
      logger.warn('Failed to rewrite title, using original', { error: error.message });
      return originalTitle;
    }
  }

  /**
   * Generate a concise summary of the article
   */
  async generateSummary(content) {
    if (!content) return '';

    const prompt = `
      Create a concise summary (2-3 sentences) of this article content.
      Focus on the key points and main takeaways.
      
      Article content: "${content.substring(0, 2000)}..."
      
      Summary:`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      logger.warn('Failed to generate summary', { error: error.message });
      return content.substring(0, 200) + '...';
    }
  }

  /**
   * Rewrite article body to improve readability and remove noise
   */
  async rewriteBody(content) {
    if (!content) return '';

    const prompt = `
      Rewrite this article content to improve readability and flow.
      Remove any redundant information, fix grammar issues, and make it more engaging.
      Keep the same length or slightly shorter.
      Maintain all factual information and quotes.
      
      Article content: "${content}"
      
      Rewritten content:`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      return cleanContent(response.text().trim());
    } catch (error) {
      logger.warn('Failed to rewrite body, using cleaned original', { error: error.message });
      return cleanContent(content);
    }
  }

  /**
   * Check if AI service is available
   */
  isAvailable() {
    return !!(this.geminiModel || config.ai.openaiApiKey);
  }
}

module.exports = RewriteService; 