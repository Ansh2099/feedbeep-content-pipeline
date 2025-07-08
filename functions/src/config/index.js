require('dotenv').config();

const config = {
  newsdata: {
    apiKey: process.env.NEWSDATA_API_KEY,
    baseUrl: process.env.NEWSDATA_BASE_URL || 'https://newsdata.io/api/1/news',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    model: process.env.AI_MODEL || 'geminipro',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  app: {
    logLevel: process.env.LOG_LEVEL || 'info',
    maxArticlesPerFetch: parseInt(process.env.MAX_ARTICLES_PER_FETCH) || 10,
  },
  gnews: {
    apiKey: process.env.GNEWS_API_KEY,
    baseUrl: process.env.GNEWS_BASE_URL || 'https://gnews.io/api/v4/search',
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'NEWSDATA_API_KEY',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Check for at least one AI service
  if (!config.ai.geminiApiKey && !config.ai.openaiApiKey) {
    throw new Error('At least one AI service API key (GEMINI_API_KEY or OPENAI_API_KEY) is required');
  }
};

module.exports = { config, validateConfig }; 