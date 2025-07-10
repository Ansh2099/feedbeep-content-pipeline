class ContentQualityAnalyzer {
  constructor() {
    this.minWordCount = 100;
    this.maxWordCount = 5000;
    this.minReadabilityScore = 30; // Flesch Reading Ease
  }

  /**
   * Analyze and score article content quality
   */
  analyzeContent(article) {
    const analysis = {
      wordCount: this.getWordCount(article.body),
      readabilityScore: this.calculateReadability(article.body),
      hasQuotes: this.hasQuotes(article.body),
      hasNumbers: this.hasNumbers(article.body),
      hasLinks: this.hasLinks(article.body),
      titleQuality: this.analyzeTitle(article.title),
      summaryQuality: this.analyzeSummary(article.summary),
      overallScore: 0,
      qualityLevel: 'low',
      issues: []
    };

    // Calculate overall score (0-100)
    analysis.overallScore = this.calculateOverallScore(analysis);
    analysis.qualityLevel = this.getQualityLevel(analysis.overallScore);
    analysis.issues = this.identifyIssues(analysis);

    return analysis;
  }

  /**
   * Get word count
   */
  getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  }

  /**
   * Calculate Flesch Reading Ease score
   */
  calculateReadability(text) {
    if (!text) return 0;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    // Flesch Reading Ease formula
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Count syllables in text (approximate)
   */
  countSyllables(text) {
    if (!text) return 0;
    
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    words.forEach(word => {
      word = word.replace(/[^a-z]/g, '');
      if (word.length <= 3) {
        syllableCount += 1;
      } else {
        syllableCount += word.replace(/[^aeiouy]+/g, '').length;
      }
    });

    return syllableCount;
  }

  /**
   * Check if content has quotes
   */
  hasQuotes(text) {
    if (!text) return false;
    return /["'].*["']/.test(text);
  }

  /**
   * Check if content has numbers
   */
  hasNumbers(text) {
    if (!text) return false;
    return /\d+/.test(text);
  }

  /**
   * Check if content has links
   */
  hasLinks(text) {
    if (!text) return false;
    return /https?:\/\/[^\s]+/.test(text);
  }

  /**
   * Analyze title quality
   */
  analyzeTitle(title) {
    if (!title) return { score: 0, issues: ['Missing title'] };

    const issues = [];
    let score = 100;

    if (title.length < 10) {
      issues.push('Title too short');
      score -= 30;
    }

    if (title.length > 100) {
      issues.push('Title too long');
      score -= 20;
    }

    if (!/[A-Z]/.test(title)) {
      issues.push('Title lacks proper capitalization');
      score -= 15;
    }

    if (title.includes('clickbait') || title.includes('shocking') || title.includes('amazing')) {
      issues.push('Title may be clickbait');
      score -= 25;
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Analyze summary quality
   */
  analyzeSummary(summary) {
    if (!summary) return { score: 0, issues: ['Missing summary'] };

    const issues = [];
    let score = 100;

    if (summary.length < 50) {
      issues.push('Summary too short');
      score -= 30;
    }

    if (summary.length > 300) {
      issues.push('Summary too long');
      score -= 20;
    }

    if (summary.split('.').length < 2) {
      issues.push('Summary should have multiple sentences');
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallScore(analysis) {
    let score = 0;

    // Word count (20 points)
    if (analysis.wordCount >= this.minWordCount && analysis.wordCount <= this.maxWordCount) {
      score += 20;
    } else if (analysis.wordCount > this.minWordCount) {
      score += 10;
    }

    // Readability (25 points)
    if (analysis.readabilityScore >= this.minReadabilityScore) {
      score += 25;
    } else if (analysis.readabilityScore >= 20) {
      score += 15;
    }

    // Content features (15 points)
    if (analysis.hasQuotes) score += 5;
    if (analysis.hasNumbers) score += 5;
    if (analysis.hasLinks) score += 5;

    // Title quality (20 points)
    score += (analysis.titleQuality.score / 100) * 20;

    // Summary quality (20 points)
    score += (analysis.summaryQuality.score / 100) * 20;

    return Math.round(score);
  }

  /**
   * Get quality level based on score
   */
  getQualityLevel(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Identify content issues
   */
  identifyIssues(analysis) {
    const issues = [];

    if (analysis.wordCount < this.minWordCount) {
      issues.push(`Content too short (${analysis.wordCount} words, minimum ${this.minWordCount})`);
    }

    if (analysis.wordCount > this.maxWordCount) {
      issues.push(`Content too long (${analysis.wordCount} words, maximum ${this.maxWordCount})`);
    }

    if (analysis.readabilityScore < this.minReadabilityScore) {
      issues.push(`Low readability score (${analysis.readabilityScore}, minimum ${this.minReadabilityScore})`);
    }

    if (!analysis.hasQuotes) {
      issues.push('No quotes found in content');
    }

    if (!analysis.hasNumbers) {
      issues.push('No specific numbers or data found');
    }

    issues.push(...analysis.titleQuality.issues);
    issues.push(...analysis.summaryQuality.issues);

    return issues;
  }

  /**
   * Check if content meets minimum quality standards
   */
  meetsQualityStandards(analysis) {
    return analysis.overallScore >= 50 && analysis.wordCount >= this.minWordCount;
  }
}

module.exports = ContentQualityAnalyzer; 