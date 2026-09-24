-- Auth + RBAC for Sile Qelbachin Admin
-- Apply after 001_cms_schema.sql

DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM (
    'super_admin',
    'content_admin',
    'media_admin',
    'analytics_admin',
    'moderator',
    'read_only'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE staff_status AS ENUM (
    'active',
    'pending',
    'disabled',
    'suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT NOT NULL,
  role staff_role NOT NULL DEFAULT 'read_only',
  status staff_status NOT NULL DEFAULT 'pending',
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_role ON staff_profiles (role);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_status ON staff_profiles (status);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_email ON staff_profiles (email);

CREATE TABLE IF NOT EXISTS login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  email TEXT,
  event_type TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events (user_id, created_at DESC);

-- Ensure audit_logs has user_id if missing from older schema
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS result TEXT;

CREATE OR REPLACE FUNCTION public.current_staff_role()
RETURNS staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM staff_profiles
  WHERE user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_staff_is_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff_profiles
    WHERE user_id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.staff_has_role(allowed staff_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_staff_role() = ANY (allowed), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_staff_role() = 'super_admin', FALSE);
$$;

CREATE OR REPLACE FUNCTION public.touch_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_profiles_updated ON staff_profiles;
CREATE TRIGGER trg_staff_profiles_updated
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_staff_updated_at();

-- Prevent non-super-admins from escalating their own role/status
CREATE OR REPLACE FUNCTION public.prevent_staff_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Role changes require super_admin';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Cannot change own status';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot reassign user_id';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_staff_self_escalation ON staff_profiles;
CREATE TRIGGER trg_prevent_staff_self_escalation
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_staff_self_escalation();

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- staff_profiles policies
DROP POLICY IF EXISTS staff_select_own_or_admin ON staff_profiles;
CREATE POLICY staff_select_own_or_admin ON staff_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR public.staff_has_role(ARRAY['content_admin','media_admin','analytics_admin','moderator','read_only']::staff_role[])
      AND public.is_super_admin() -- only super can list all; tighten:
  );

-- Simpler: own row OR super_admin
DROP POLICY IF EXISTS staff_select_own_or_admin ON staff_profiles;
CREATE POLICY staff_select_own_or_admin ON staff_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS staff_update_own_limited ON staff_profiles;
CREATE POLICY staff_update_own_limited ON staff_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin());

DROP POLICY IF EXISTS staff_insert_super ON staff_profiles;
CREATE POLICY staff_insert_super ON staff_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS staff_delete_super ON staff_profiles;
CREATE POLICY staff_delete_super ON staff_profiles
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

-- login_events: users insert own; super read all; own read
DROP POLICY IF EXISTS login_events_insert ON login_events;
CREATE POLICY login_events_insert ON login_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS login_events_select ON login_events;
CREATE POLICY login_events_select ON login_events
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin());

-- Published content readable by anon (website/mobile)
DROP POLICY IF EXISTS kitabs_public_read ON kitabs;
CREATE POLICY kitabs_public_read ON kitabs
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS ders_public_read ON ders;
CREATE POLICY ders_public_read ON ders
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS audio_public_read ON audio_items;
CREATE POLICY audio_public_read ON audio_items
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS video_public_read ON video_items;
CREATE POLICY video_public_read ON video_items
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS pdf_public_read ON pdf_items;
CREATE POLICY pdf_public_read ON pdf_items
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS media_public_read ON media_assets;
CREATE POLICY media_public_read ON media_assets
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Staff write policies (active staff)
DROP POLICY IF EXISTS kitabs_staff_all ON kitabs;
CREATE POLICY kitabs_staff_all ON kitabs
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS ders_staff_all ON ders;
CREATE POLICY ders_staff_all ON ders
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS audio_staff_all ON audio_items;
CREATE POLICY audio_staff_all ON audio_items
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS video_staff_all ON video_items;
CREATE POLICY video_staff_all ON video_items
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS pdf_staff_all ON pdf_items;
CREATE POLICY pdf_staff_all ON pdf_items
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS media_staff_all ON media_assets;
CREATE POLICY media_staff_all ON media_assets
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS categories_staff_all ON categories;
CREATE POLICY categories_staff_all ON categories
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS speakers_staff_all ON speakers;
CREATE POLICY speakers_staff_all ON speakers
  FOR ALL TO authenticated
  USING (public.current_staff_is_active())
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS scan_runs_staff_read ON scan_runs;
CREATE POLICY scan_runs_staff_read ON scan_runs
  FOR SELECT TO authenticated
  USING (public.current_staff_is_active());

DROP POLICY IF EXISTS scan_runs_staff_write ON scan_runs;
CREATE POLICY scan_runs_staff_write ON scan_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS audit_staff_read ON audit_logs;
CREATE POLICY audit_staff_read ON audit_logs
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR public.staff_has_role(ARRAY['read_only']::staff_role[])
    OR public.current_staff_is_active()
  );

DROP POLICY IF EXISTS audit_staff_insert ON audit_logs;
CREATE POLICY audit_staff_insert ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.current_staff_is_active());

DROP POLICY IF EXISTS admin_roles_read ON admin_roles;
CREATE POLICY admin_roles_read ON admin_roles
  FOR SELECT TO authenticated
  USING (public.current_staff_is_active());

-- Seed bootstrap profile placeholder is done via server script (needs auth.users row)
COMMENT ON TABLE staff_profiles IS 'Admin/staff profiles linked to auth.users; roles enforced via RLS + Next.js API.';
