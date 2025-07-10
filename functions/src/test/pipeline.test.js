const ArticleProcessor = require('../application/processArticle');
const ContentQualityAnalyzer = require('../shared/contentQualityAnalyzer');
const { generateArticleId, cleanContent } = require('../shared/utils');

// Mock dependencies for testing
jest.mock('../infrastructure/newsdata/newsFetcher');
jest.mock('../infrastructure/ai/rewriteService');
jest.mock('../infrastructure/db/supabaseWriter');
jest.mock('../infrastructure/scraper/scraperFallbackHandler');

describe('FeedBeep Content Pipeline', () => {
  let processor;
  let qualityAnalyzer;

  beforeEach(() => {
    processor = new ArticleProcessor();
    qualityAnalyzer = new ContentQualityAnalyzer();
  });

  describe('Content Quality Analysis', () => {
    test('should analyze article quality correctly', () => {
      const testArticle = {
        title: 'Test Article Title',
        summary: 'This is a test summary with multiple sentences. It provides a good overview.',
        body: 'This is a test article body with sufficient content. It contains some numbers like 42 and quotes like "test quote". It also has a link to https://example.com. The content is well-structured and readable.',
      };

      const analysis = qualityAnalyzer.analyzeContent(testArticle);

      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.readabilityScore).toBeGreaterThan(0);
      expect(analysis.hasQuotes).toBe(true);
      expect(analysis.hasNumbers).toBe(true);
      expect(analysis.hasLinks).toBe(true);
      expect(analysis.overallScore).toBeGreaterThan(0);
      expect(analysis.qualityLevel).toBeDefined();
    });

    test('should identify quality issues', () => {
      const poorArticle = {
        title: 'short',
        summary: 'too short',
        body: 'This is a very short article.',
      };

      const analysis = qualityAnalyzer.analyzeContent(poorArticle);

      expect(analysis.issues.length).toBeGreaterThan(0);
      expect(analysis.overallScore).toBeLessThan(50);
      expect(analysis.qualityLevel).toBe('poor');
    });
  });

  describe('Utility Functions', () => {
    test('should generate unique article IDs', () => {
      const id1 = generateArticleId();
      const id2 = generateArticleId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    test('should clean content properly', () => {
      const dirtyContent = '  This is   dirty   content  with  extra  spaces  ';
      const cleaned = cleanContent(dirtyContent);

      expect(cleaned).toBe('This is dirty content with extra spaces');
    });
  });

  describe('Article Processing', () => {
    test('should handle empty article list', async () => {
      // Mock the news fetcher to return empty array
      processor.newsFetcher.fetchArticles = jest.fn().mockResolvedValue([]);

      const result = await processor.processArticles(['technology']);

      expect(result.processed).toBe(0);
      expect(result.errors).toEqual([]);
    });

    test('should handle processing errors gracefully', async () => {
      // Mock the news fetcher to return one article
      processor.newsFetcher.fetchArticles = jest.fn().mockResolvedValue([
        { title: 'Test Article', content: 'Test content', originalUrl: 'https://example.com' }
      ]);

      // Mock the rewrite service to throw an error
      processor.rewriteService.rewriteArticle = jest.fn().mockRejectedValue(new Error('AI service error'));

      const result = await processor.processArticles(['technology']);

      expect(result.processed).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
}); 