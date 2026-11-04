-- ====================================================================
-- Flyway Migration V3: PostgreSQL Row-Level Security (RLS) Policies
-- ====================================================================

-- 1. Enable RLS on core tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Posts RLS Policies
-- Anyone can view posts
DROP POLICY IF EXISTS posts_select_policy ON posts;
CREATE POLICY posts_select_policy ON posts
    FOR SELECT USING (true);

-- Authors can insert their own posts
DROP POLICY IF EXISTS posts_insert_policy ON posts;
CREATE POLICY posts_insert_policy ON posts
    FOR INSERT WITH CHECK (
        current_setting('app.current_user_id', true) IS NULL OR
        user_id = current_setting('app.current_user_id', true)::uuid
    );

-- Authors can update only their own posts
DROP POLICY IF EXISTS posts_update_policy ON posts;
CREATE POLICY posts_update_policy ON posts
    FOR UPDATE USING (
        current_setting('app.current_user_id', true) IS NULL OR
        user_id = current_setting('app.current_user_id', true)::uuid
    );

-- Authors can delete only their own posts
DROP POLICY IF EXISTS posts_delete_policy ON posts;
CREATE POLICY posts_delete_policy ON posts
    FOR DELETE USING (
        current_setting('app.current_user_id', true) IS NULL OR
        user_id = current_setting('app.current_user_id', true)::uuid
    );

-- 3. Comments RLS Policies
DROP POLICY IF EXISTS comments_select_policy ON comments;
CREATE POLICY comments_select_policy ON comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS comments_modify_policy ON comments;
CREATE POLICY comments_modify_policy ON comments
    FOR ALL USING (
        current_setting('app.current_user_id', true) IS NULL OR
        user_id = current_setting('app.current_user_id', true)::uuid
    );

-- 4. Stories RLS Policies
DROP POLICY IF EXISTS stories_select_policy ON stories;
CREATE POLICY stories_select_policy ON stories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS stories_modify_policy ON stories;
CREATE POLICY stories_modify_policy ON stories
    FOR ALL USING (
        current_setting('app.current_user_id', true) IS NULL OR
        user_id = current_setting('app.current_user_id', true)::uuid
    );

-- 5. Refresh Tokens RLS Policies (strictly owned by user)
DROP POLICY IF EXISTS refresh_tokens_policy ON refresh_tokens;
CREATE POLICY refresh_tokens_policy ON refresh_tokens
    FOR ALL USING (
        current_setting('app.current_user_id', true) IS NULL OR
        user_id = current_setting('app.current_user_id', true)::uuid
    );

