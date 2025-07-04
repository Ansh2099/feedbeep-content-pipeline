const { validateConfig } = require('./config');
const ArticleProcessor = require('./application/processArticle');
const logger = require('./shared/logger');

// Initialize configuration
try {
  validateConfig();
  logger.info('Configuration validated successfully');
} catch (error) {
  logger.error('Configuration validation failed', { error: error.message });
  process.exit(1);
}

// Create processor instance
const processor = new ArticleProcessor();

/**
 * Manual trigger function for testing and development
 */
async function manualTrigger(req, res) {
  try {
    logger.info('Manual trigger initiated');
    
    const topics = req.body?.topics || ['technology', 'ai'];
    const language = req.body?.language || 'en';
    
    const result = await processor.processArticles(topics, language);
    
    res.status(200).json({
      success: true,
      message: 'Pipeline completed successfully',
      result,
    });
    
  } catch (error) {
    logger.error('Manual trigger failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Pipeline failed',
      error: error.message,
    });
  }
}

/**
 * Scheduled function for production use
 */
async function scheduledTrigger(event, context) {
  try {
    logger.info('Scheduled trigger initiated');
    
    // Default topics for scheduled runs
    const topics = ['technology', 'ai', 'startup', 'innovation'];
    const language = 'en';
    
    const result = await processor.processArticles(topics, language);
    
    logger.info('Scheduled pipeline completed', result);
    return result;
    
  } catch (error) {
    logger.error('Scheduled trigger failed', { error: error.message });
    throw error;
  }
}

/**
 * Status check endpoint
 */
async function getStatus(req, res) {
  try {
    const status = await processor.getStatus();
    res.status(200).json(status);
  } catch (error) {
    logger.error('Status check failed', { error: error.message });
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Test endpoint for single article processing
 */
async function testSingleArticle(req, res) {
  try {
    const { article } = req.body;
    
    if (!article) {
      return res.status(400).json({
        success: false,
        message: 'Article data is required',
      });
    }
    
    const result = await processor.processSingleArticle(article);
    
    res.status(200).json({
      success: true,
      result,
    });
    
  } catch (error) {
    logger.error('Single article test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

// Export functions for different deployment scenarios
module.exports = {
  // For local development and manual testing
  manualTrigger,
  
  // For Firebase Functions scheduled deployment
  scheduledTrigger,
  
  // Utility endpoints
  getStatus,
  testSingleArticle,
  
  // Direct processor access for advanced usage
  processor,
};

// If running directly (not as Firebase Function)
if (require.main === module) {
  logger.info('Running in development mode');
  
  // Example usage
  async function runExample() {
    try {
      const status = await processor.getStatus();
      logger.info('Pipeline status:', status);
      
      const result = await processor.processArticles(['technology'], 'en');
      logger.info('Pipeline result:', result);
      
    } catch (error) {
      logger.error('Example run failed', { error: error.message });
    }
  }
  
  runExample();
} 