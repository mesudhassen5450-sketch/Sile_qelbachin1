# Apply durable reminders (migration 006)

Admin **Da’wah → Reminders** used to save only on the Render server disk. Redeploys wipe that disk, so your 11+ reminders disappeared.

## One-time fix

1. Supabase → project **lsyyezhsqhzcskjbqmco** → **SQL Editor**
2. Run `admincn-1.0.0/supabase/migrations/006_cms_reminders.sql`
3. Wait for Admin redeploy (this git push)
4. Re-add reminders once — they will persist in Supabase + R2 backup

Also run `005_youth_content.sql` if you have not yet (for Youth Q&A).
