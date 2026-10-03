# Apply Youth Q&A durable storage (migration 005)

Admin **Youth & Heart → Q & A** used to save only on the Render server disk. That disk is wiped on every redeploy, so your published questions disappeared from Admin and from `https://sileqelbachin1.com/questions`.

## Fix (one-time)

1. Open Supabase → project **lsyyezhsqhzcskjbqmco** → **SQL Editor**.
2. Paste and run the full contents of:
   `admincn-1.0.0/supabase/migrations/005_youth_content.sql`
3. Confirm the table `youth_content` exists (Table Editor).
4. Redeploy Admin (or wait for the git push deploy).
5. Re-add your public Q&A items in Admin → Youth & Heart → **Q & A** (click **+ Add**).
6. Check:
   - Admin list shows the items
   - `https://sileqelbachin1.com/questions` shows them
   - Featured items appear in the home “Have a Question?” block

## Where things go

| Admin place | Website place |
|---|---|
| Youth & Heart → **Q & A** | Public `/questions` (+ home if Featured) |
| Community → **Question Submissions** | Private Ask-an-Ustaz inbox only (not the public feed unless you publish) |
