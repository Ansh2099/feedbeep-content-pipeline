const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique ID for articles
 */
const generateArticleId = () => uuidv4();

/**
 * Clean and validate URL
 */
const cleanUrl = (url) => {
  if (!url) return null;
  
  try {
    const cleaned = url.trim();
    const urlObj = new URL(cleaned);
    return urlObj.toString();
  } catch (error) {
    return null;
  }
};

/**
 * Extract domain from URL for source field
 */
const extractDomain = (url) => {
  if (!url) return null;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return null;
  }
};

/**
 * Clean article content by removing extra whitespace and HTML tags
 */
const cleanContent = (content) => {
  if (!content) return '';
  
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Generate a simple hash for duplicate detection
 */
const generateContentHash = (title, url) => {
  const content = `${title}${url}`.toLowerCase();
  let hash = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Check if article content is valid for processing
 */
const isValidArticle = (article) => {
  return (
    article &&
    article.title &&
    article.link &&
    article.content &&
    article.content.length > 100 // Minimum content length
  );
};

/**
 * Format timestamp for Firestore
 */
const formatTimestamp = () => {
  return new Date();
};

module.exports = {
  generateArticleId,
  cleanUrl,
  extractDomain,
  cleanContent,
  generateContentHash,
  isValidArticle,
  formatTimestamp,
}; 