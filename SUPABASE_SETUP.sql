-- Drop existing tables and dependent objects to ensure a clean slate
DROP TABLE IF EXISTS websites CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create the profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  credits INTEGER DEFAULT 10,
  tier TEXT DEFAULT 'free',
  full_name TEXT,
  github_connected BOOLEAN DEFAULT FALSE
);

-- Create the websites table
CREATE TABLE websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  prompt TEXT,
  code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  github_repo_name TEXT
);

-- Enable Row Level Security (RLS) for both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
-- Allow users to see their own profile
CREATE POLICY "Allow individual read access" ON profiles FOR SELECT USING (auth.uid() = id);
-- Allow users to update their own profile
CREATE POLICY "Allow individual update access" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for websites
-- Allow users to see their own websites
CREATE POLICY "Allow individual read access" ON websites FOR SELECT USING (auth.uid() = user_id);
-- Allow users to create websites
CREATE POLICY "Allow individual create access" ON websites FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow users to update their own websites
CREATE POLICY "Allow individual update access" ON websites FOR UPDATE USING (auth.uid() = user_id);
-- Allow users to delete their own websites
CREATE POLICY "Allow individual delete access" ON websites FOR DELETE USING (auth.uid() = user_id);
