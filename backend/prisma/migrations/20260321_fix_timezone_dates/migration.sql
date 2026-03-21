-- Fix timezone date shift
--
-- Bug: new Date("YYYY-MM-DD").setHours(0,0,0,0) on CET server creates
-- local midnight (UTC-1h), which Prisma serializes as previous day for @db.Date.
-- All DATE fields are shifted by -1 day; DateTime fields (weekStart/weekEnd)
-- are shifted by -1 hour (CET = UTC+1).
--
-- This migration corrects all existing data.

-- Fix time_entries.date: shift +1 day
UPDATE time_entries SET date = date + 1;

-- Fix day_status.date: shift +1 day
UPDATE day_status SET date = date + 1;

-- Fix weekly_submissions: shift timestamps to UTC midnight
-- weekStart was stored as local midnight CET (23:00 UTC previous day)
-- weekEnd was stored as local 23:59:59 CET (22:59:59 UTC same day)
-- We normalize weekStart to UTC midnight of the intended Monday
-- and weekEnd to UTC midnight of the intended Sunday
UPDATE weekly_submissions
SET week_start = date_trunc('day', week_start + INTERVAL '1 hour'),
    week_end = date_trunc('day', week_end + INTERVAL '2 hours');
