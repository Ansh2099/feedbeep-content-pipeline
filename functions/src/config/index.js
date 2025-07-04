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
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    clientId: process.env.FIREBASE_CLIENT_ID,
    authUri: process.env.FIREBASE_AUTH_URI,
    tokenUri: process.env.FIREBASE_TOKEN_URI,
    authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  },
  app: {
    logLevel: process.env.LOG_LEVEL || 'info',
    maxArticlesPerFetch: parseInt(process.env.MAX_ARTICLES_PER_FETCH) || 10,
  },
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'NEWSDATA_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
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