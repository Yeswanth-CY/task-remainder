-- Alter events table to track multiple reminder statuses
ALTER TABLE events 
DROP COLUMN IF EXISTS reminder_sent;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS reminder_day_before_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_hour_before_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_five_min_before_sent BOOLEAN DEFAULT FALSE;
