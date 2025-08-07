-- Temporarily remove the foreign key constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_club_id_fkey;

-- Now you can update the data without FK violations
-- For example, set all invalid club_ids to NULL:
UPDATE user_profiles
SET club_id = NULL
WHERE club_id NOT IN (SELECT id FROM clubs);

-- After fixing the data, re-add the constraint
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_club_id_fkey 
FOREIGN KEY (club_id) 
REFERENCES clubs(id)
ON DELETE SET NULL;  -- This will set club_id to NULL if the club is deleted