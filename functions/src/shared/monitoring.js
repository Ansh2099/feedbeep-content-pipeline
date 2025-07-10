const logger = require('./logger');

class MonitoringService {
  constructor() {
    this.metrics = {
      pipelineRuns: 0,
      totalArticlesProcessed: 0,
      totalArticlesSaved: 0,
      totalErrors: 0,
      averageProcessingTime: 0,
      qualityScores: [],
      lastRunTime: null,
      successRate: 0,
    };
    
    this.currentRun = {
      startTime: null,
      endTime: null,
      articlesProcessed: 0,
      articlesSaved: 0,
      errors: [],
      qualityScores: [],
    };
  }

  /**
   * Start monitoring a pipeline run
   */
  startRun() {
    this.currentRun = {
      startTime: Date.now(),
      endTime: null,
      articlesProcessed: 0,
      articlesSaved: 0,
      errors: [],
      qualityScores: [],
    };
    
    logger.info('Pipeline run started', { timestamp: new Date().toISOString() });
  }

  /**
   * End monitoring a pipeline run
   */
  endRun() {
    this.currentRun.endTime = Date.now();
    const duration = this.currentRun.endTime - this.currentRun.startTime;
    
    // Update metrics
    this.metrics.pipelineRuns++;
    this.metrics.totalArticlesProcessed += this.currentRun.articlesProcessed;
    this.metrics.totalArticlesSaved += this.currentRun.articlesSaved;
    this.metrics.totalErrors += this.currentRun.errors.length;
    this.metrics.lastRunTime = new Date().toISOString();
    
    // Calculate success rate
    if (this.metrics.totalArticlesProcessed > 0) {
      this.metrics.successRate = Math.round(
        (this.metrics.totalArticlesSaved / this.metrics.totalArticlesProcessed) * 100
      );
    }
    
    // Update average processing time
    if (this.metrics.pipelineRuns > 0) {
      this.metrics.averageProcessingTime = Math.round(
        (this.metrics.averageProcessingTime * (this.metrics.pipelineRuns - 1) + duration) / this.metrics.pipelineRuns
      );
    }
    
    // Add quality scores
    this.metrics.qualityScores.push(...this.currentRun.qualityScores);
    
    logger.info('Pipeline run completed', {
      duration: `${duration}ms`,
      articlesProcessed: this.currentRun.articlesProcessed,
      articlesSaved: this.currentRun.articlesSaved,
      errors: this.currentRun.errors.length,
      successRate: `${this.metrics.successRate}%`,
    });
    
    if (this.currentRun.errors.length > 0) {
      logger.warn('Pipeline run had errors', { errors: this.currentRun.errors });
    }
  }

  /**
   * Record article processing
   */
  recordArticleProcessed(article, qualityScore = null) {
    this.currentRun.articlesProcessed++;
    
    if (qualityScore !== null) {
      this.currentRun.qualityScores.push(qualityScore);
    }
    
    logger.debug('Article processed', {
      title: article.title?.substring(0, 50) + '...',
      qualityScore,
    });
  }

  /**
   * Record article saved
   */
  recordArticleSaved(article) {
    this.currentRun.articlesSaved++;
    
    logger.debug('Article saved', {
      title: article.title?.substring(0, 50) + '...',
      id: article.id,
    });
  }

  /**
   * Record error
   */
  recordError(error, context = {}) {
    this.currentRun.errors.push({
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
    });
    
    logger.error('Pipeline error recorded', { error: error.message, context });
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      currentRun: this.currentRun,
      averageQualityScore: this.calculateAverageQualityScore(),
      qualityDistribution: this.getQualityDistribution(),
    };
  }

  /**
   * Calculate average quality score
   */
  calculateAverageQualityScore() {
    if (this.metrics.qualityScores.length === 0) return 0;
    
    const sum = this.metrics.qualityScores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / this.metrics.qualityScores.length);
  }

  /**
   * Get quality score distribution
   */
  getQualityDistribution() {
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
    };
    
    this.metrics.qualityScores.forEach(score => {
      if (score >= 80) distribution.excellent++;
      else if (score >= 60) distribution.good++;
      else if (score >= 40) distribution.fair++;
      else distribution.poor++;
    });
    
    return distribution;
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights() {
    const insights = [];
    
    if (this.metrics.successRate < 80) {
      insights.push(`Low success rate: ${this.metrics.successRate}%. Consider investigating errors.`);
    }
    
    if (this.metrics.averageProcessingTime > 30000) {
      insights.push(`Slow processing time: ${this.metrics.averageProcessingTime}ms. Consider optimization.`);
    }
    
    const avgQuality = this.calculateAverageQualityScore();
    if (avgQuality < 60) {
      insights.push(`Low average quality score: ${avgQuality}. Consider improving content processing.`);
    }
    
    if (this.metrics.totalErrors > this.metrics.pipelineRuns * 2) {
      insights.push(`High error rate: ${this.metrics.totalErrors} errors in ${this.metrics.pipelineRuns} runs.`);
    }
    
    return insights;
  }

  /**
   * Reset metrics (for testing or maintenance)
   */
  resetMetrics() {
    this.metrics = {
      pipelineRuns: 0,
      totalArticlesProcessed: 0,
      totalArticlesSaved: 0,
      totalErrors: 0,
      averageProcessingTime: 0,
      qualityScores: [],
      lastRunTime: null,
      successRate: 0,
    };
    
    logger.info('Monitoring metrics reset');
  }
}

module.exports = MonitoringService; 