-- Drop any existing incorrect constraint
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_club_id_fkey;

-- Add the correct foreign key constraint
-- user_profiles.club_id references clubs.bob_id
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_club_id_fkey 
FOREIGN KEY (club_id) 
REFERENCES clubs(bob_id)
ON DELETE SET NULL;

-- Verify the constraint was created
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='user_profiles';