-- ====================================================================
-- DevGram PostgreSQL Database Schema
-- Run this script in pgAdmin 4 Query Tool or psql command line.
-- ====================================================================

-- 1. Enable pgcrypto / uuid extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if re-running script (Order matters due to Foreign Keys)
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- --------------------------------------------------------------------
-- Table: users
-- Stores developer account profile and authentication details
-- --------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT DEFAULT '',
    profile_pic_url TEXT DEFAULT '',
    account_type VARCHAR(30) DEFAULT 'personal', -- 'personal', 'creator', 'professional'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- Table: follows
-- Represents follower/following social relationships
-- Composite Primary Key: (follower_id, following_id)
-- --------------------------------------------------------------------
CREATE TABLE follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id)
);

-- --------------------------------------------------------------------
-- Table: stories
-- 24-hour expiring developer story posts
-- --------------------------------------------------------------------
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image', -- 'image', 'video', 'code_canvas'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- --------------------------------------------------------------------
-- Table: story_views
-- Tracks which user has viewed a specific story
-- Composite Primary Key: (story_id, viewer_id)
-- --------------------------------------------------------------------
CREATE TABLE story_views (
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (story_id, viewer_id)
);

-- --------------------------------------------------------------------
-- Table: posts
-- Developer timeline build posts and code reels
-- --------------------------------------------------------------------
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption TEXT DEFAULT '',
    media_url TEXT DEFAULT '',
    media_type VARCHAR(20) DEFAULT 'image', -- 'image', 'video', 'code_snippet'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- Table: likes
-- Polymorphic likes for either a post OR a story
-- Constraint: Exactly one of post_id / story_id must be non-null
-- --------------------------------------------------------------------
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_likes_target CHECK (
        (post_id IS NOT NULL AND story_id IS NULL) OR 
        (post_id IS NULL AND story_id IS NOT NULL)
    ),
    CONSTRAINT unq_user_post_like UNIQUE (user_id, post_id),
    CONSTRAINT unq_user_story_like UNIQUE (user_id, story_id)
);

-- --------------------------------------------------------------------
-- Table: comments
-- Post comments supporting nested/threaded replies via parent_comment_id
-- --------------------------------------------------------------------
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_stories_user_active ON stories(user_id, expires_at);
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_posts_user ON posts(user_id, created_at DESC);
CREATE INDEX idx_likes_post ON likes(post_id);
CREATE INDEX idx_likes_story ON likes(story_id);
CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
