-- Migration: add admin_audit table
-- Generated: 2025-11-26

CREATE TABLE IF NOT EXISTS public.admin_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user TEXT,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit (action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit (created_at);

-- Down: drop table (commented out; run manually if needed)
-- DROP TABLE IF EXISTS public.admin_audit;
