const axios = require('axios');

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE_URL = process.env.GNEWS_BASE_URL || 'https://gnews.io/api/v4/search';

/**
 * Fetch articles from GNews API
 * @param {Object} options
 * @param {string[]} options.topics - Array of topics/keywords
 * @param {string} options.language - Language code (e.g., 'en')
 * @param {number} options.max - Max articles to fetch
 * @returns {Promise<Array>} Array of normalized article objects
 */
async function fetchGNewsArticles({ topics = [], language = 'en', max = 10 }) {
  if (!GNEWS_API_KEY) throw new Error('Missing GNEWS_API_KEY in environment');
  const query = topics.join(' OR ') || 'news';
  const url = `${GNEWS_BASE_URL}?q=${encodeURIComponent(query)}&lang=${language}&max=${max}&token=${GNEWS_API_KEY}`;

  const response = await axios.get(url);
  if (!response.data || !response.data.articles) {
    throw new Error('Invalid GNews API response');
  }
  // Normalize articles
  return response.data.articles.map(article => ({
    title: article.title,
    url: article.url,
    source: article.source?.name || '',
    publishedAt: article.publishedAt,
    description: article.description,
    content: article.content || article.description || '',
    imageUrl: article.image,
  }));
}

module.exports = { fetchGNewsArticles }; 