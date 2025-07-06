-- Create articles table for FeedBeep Content Pipeline
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    original_url TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL DEFAULT 'unknown',
    topics TEXT[] DEFAULT '{}',
    ai_generated BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    image_attribution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_hash TEXT NOT NULL,
    
    -- Add indexes for better query performance
    CONSTRAINT articles_original_url_unique UNIQUE (original_url)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_topics ON articles USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON articles(content_hash);

-- Enable Row Level Security (RLS) - optional but recommended
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- You can modify this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON articles
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a policy that allows read access for anonymous users (if needed)
CREATE POLICY "Allow read access for anonymous users" ON articles
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT ALL ON articles TO authenticated;
GRANT SELECT ON articles TO anon; 