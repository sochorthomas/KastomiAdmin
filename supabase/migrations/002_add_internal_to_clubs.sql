-- Add internal column to clubs table
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS internal VARCHAR(100);

-- Update existing clubs with internal values (example data)
UPDATE public.clubs SET internal = 'club123' WHERE bob_id = 2;

-- Create index for internal column
CREATE INDEX IF NOT EXISTS idx_clubs_internal ON public.clubs(internal);