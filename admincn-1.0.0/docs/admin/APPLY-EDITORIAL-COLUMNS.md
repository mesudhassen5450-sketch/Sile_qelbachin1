# Apply editorial columns (required once)

Supabase is missing `featured` / `priority` / `scheduled_at` on content tables.
That caused: `Could not find the 'featured' column of 'video_items'`.

## Fix (1 minute)

1. Open Supabase → project **lsyyezhsqhzcskjbqmco** → **SQL Editor**
2. Paste and run the file:
   `admincn-1.0.0/supabase/migrations/004_editorial_columns.sql`
3. Confirm success, then hard-refresh Admin and save again.

Until this runs, Admin still saves **locally** (featured/priority work on the site via local store), but remote sync of those columns is incomplete.

## Home picks after columns exist

| Home slot | Admin action |
|-----------|----------------|
| 3 kitabs | Library → Kitabs → Edit → **Featured** (top 3 by priority) |
| 3 popular audio | Da’wah / Audio → Edit → **Featured** (top 3 by priority) |
| 4 guidance questions | Youth & Heart → Q & A → Edit → **Featured on home** (top 4 by priority) |
