-- 1. Check what bob_id values exist in clubs table
SELECT id, name, bob_id, internal 
FROM clubs 
ORDER BY bob_id;

-- 2. Check what club_id values are in user_profiles
SELECT DISTINCT club_id 
FROM user_profiles 
WHERE club_id IS NOT NULL
ORDER BY club_id;

-- 3. Find user_profiles with club_id that don't exist in clubs.bob_id
SELECT up.auth_id, up.club_id
FROM user_profiles up
WHERE up.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clubs c WHERE c.bob_id = up.club_id
  );

-- 4. If you need to create missing clubs, use this as a template:
-- INSERT INTO clubs (id, name, bob_id, internal) 
-- VALUES 
--   (gen_random_uuid(), 'Club 2', 2, NULL);

-- 5. Or if you want to update user_profiles to use an existing club:
-- UPDATE user_profiles 
-- SET club_id = [existing_bob_id]
-- WHERE club_id = 2;

-- 6. Or set invalid club_ids to NULL:
-- UPDATE user_profiles 
-- SET club_id = NULL
-- WHERE club_id NOT IN (SELECT bob_id FROM clubs WHERE bob_id IS NOT NULL);