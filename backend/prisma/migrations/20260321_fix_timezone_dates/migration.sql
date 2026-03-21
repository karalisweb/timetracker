-- Fix timezone date shift
--
-- Bug: new Date("YYYY-MM-DD").setHours(0,0,0,0) on CET server creates
-- local midnight (UTC-1h), which Prisma serializes as previous day for @db.Date.
-- All DATE fields are shifted by -1 day; DateTime fields (weekStart/weekEnd)
-- are shifted by -1 hour (CET = UTC+1).
--
-- Strategy: temporarily drop unique constraints, update dates, re-add constraints.

-- 1. Fix time_entries.date
-- Drop index, update, recreate
DROP INDEX IF EXISTS "time_entries_user_id_date_idx";
UPDATE time_entries SET date = date + 1;
CREATE INDEX "time_entries_user_id_date_idx" ON "time_entries"("user_id", "date");

-- 2. Fix day_status.date
-- Need to drop the unique constraint first to avoid conflicts
ALTER TABLE "day_status" DROP CONSTRAINT IF EXISTS "day_status_user_id_date_key";
DROP INDEX IF EXISTS "day_status_user_id_date_idx";
UPDATE day_status SET date = date + 1;
ALTER TABLE "day_status" ADD CONSTRAINT "day_status_user_id_date_key" UNIQUE ("user_id", "date");
CREATE INDEX "day_status_user_id_date_idx" ON "day_status"("user_id", "date");

-- 3. Fix weekly_submissions timestamps
-- weekStart was stored as CET midnight (23:00 UTC previous day)
-- Normalize to UTC midnight of the intended day
ALTER TABLE "weekly_submissions" DROP CONSTRAINT IF EXISTS "weekly_submissions_user_id_week_start_key";
UPDATE weekly_submissions
SET week_start = date_trunc('day', week_start + INTERVAL '1 hour'),
    week_end = date_trunc('day', week_end + INTERVAL '2 hours');
ALTER TABLE "weekly_submissions" ADD CONSTRAINT "weekly_submissions_user_id_week_start_key" UNIQUE ("user_id", "week_start");
