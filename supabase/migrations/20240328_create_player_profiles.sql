-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create player_profiles table
CREATE TABLE IF NOT EXISTS player_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    rating INTEGER DEFAULT 1000 NOT NULL,
    games_played INTEGER DEFAULT 0 NOT NULL,
    games_won INTEGER DEFAULT 0 NOT NULL,
    games_lost INTEGER DEFAULT 0 NOT NULL,
    win_rate FLOAT DEFAULT 0 NOT NULL
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_profiles_username ON player_profiles(username);

-- Create index on rating for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_player_profiles_rating ON player_profiles(rating);

-- Add RLS (Row Level Security) policies
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read all profiles
CREATE POLICY "Allow public read access" ON player_profiles
    FOR SELECT
    USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON player_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON player_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create function to update last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_seen
CREATE TRIGGER update_player_profiles_last_seen
    BEFORE UPDATE ON player_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen(); 