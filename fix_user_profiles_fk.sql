-- 1. First, check for user_profiles with invalid club_id
SELECT up.*, c.name as club_name
FROM user_profiles up
LEFT JOIN clubs c ON up.club_id = c.id
WHERE c.id IS NULL AND up.club_id IS NOT NULL;

-- 2. Check all existing clubs
SELECT id, name, bob_id, internal 
FROM clubs 
ORDER BY id;

-- 3. Option A: Set invalid club_id to NULL (if club_id can be nullable)
UPDATE user_profiles
SET club_id = NULL
WHERE club_id NOT IN (SELECT id FROM clubs)
  AND club_id IS NOT NULL;

-- 3. Option B: Create a default club for orphaned users
-- INSERT INTO clubs (name, bob_id, internal) 
-- VALUES ('Default Club', NULL, NULL)
-- RETURNING id;

-- Then update orphaned users to use the default club:
-- UPDATE user_profiles
-- SET club_id = [default_club_id]
-- WHERE club_id NOT IN (SELECT id FROM clubs)
--   AND club_id IS NOT NULL;

-- 4. Option C: If you know the correct club_id mapping
-- UPDATE user_profiles
-- SET club_id = [correct_club_id]
-- WHERE club_id = [invalid_club_id];

-- 5. After fixing the data, you can safely add the foreign key constraint
-- ALTER TABLE user_profiles
-- ADD CONSTRAINT user_profiles_club_id_fkey 
-- FOREIGN KEY (club_id) 
-- REFERENCES clubs(id);