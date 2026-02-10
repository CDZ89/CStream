-- Add display_code column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_code BIGINT;

-- Create a sequence for generating codes (starting from 10000 to ensure 5 digits)
CREATE SEQUENCE IF NOT EXISTS friend_code_seq START 10000;

-- Function to generate code for new users
CREATE OR REPLACE FUNCTION generate_friend_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.display_code := nextval('friend_code_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-assign code on insert
DROP TRIGGER IF EXISTS tr_generate_friend_code ON profiles;
CREATE TRIGGER tr_generate_friend_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_friend_code();

-- Backfill existing users who don't have a code
UPDATE profiles 
SET display_code = nextval('friend_code_seq') 
WHERE display_code IS NULL;

-- Make it unique to avoid duplicates
ALTER TABLE profiles 
ADD CONSTRAINT profiles_display_code_key UNIQUE (display_code);

-- Create index for fast search
CREATE INDEX IF NOT EXISTS idx_profiles_display_code ON profiles(display_code);
