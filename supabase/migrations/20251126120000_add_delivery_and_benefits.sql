-- Migration: add delivery_drivers, delivery_charges, and product benefits
-- Timestamp: 2025-11-26 12:00:00

-- Ensure pgcrypto (gen_random_uuid) is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create delivery drivers table
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  vehicle TEXT,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Create delivery charges table
CREATE TABLE IF NOT EXISTS public.delivery_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT,
  min_subtotal DECIMAL(10,2) DEFAULT 0,
  charge DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.delivery_charges ENABLE ROW LEVEL SECURITY;

-- Add product fields for short description and benefits (JSONB array)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;

-- RLS policies: admins can manage drivers and charges
CREATE POLICY IF NOT EXISTS "Admins can manage delivery drivers"
  ON public.delivery_drivers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Admins can manage delivery charges"
  ON public.delivery_charges FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public can view delivery charges
CREATE POLICY IF NOT EXISTS "Anyone can view delivery charges"
  ON public.delivery_charges FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Attach updated_at triggers if the helper exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    RAISE NOTICE 'update_updated_at_column function not found; skipping triggers';
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_drivers_updated_at'
    ) THEN
      EXECUTE 'CREATE TRIGGER update_delivery_drivers_updated_at
        BEFORE UPDATE ON public.delivery_drivers
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_charges_updated_at'
    ) THEN
      EXECUTE 'CREATE TRIGGER update_delivery_charges_updated_at
        BEFORE UPDATE ON public.delivery_charges
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
    END IF;
  END IF;
END$$;

-- Seed example delivery charges
INSERT INTO public.delivery_charges (id, state, city, min_subtotal, charge, notes)
VALUES
  (gen_random_uuid(), 'Rivers', 'Port Harcourt', 0, 0.00, 'No delivery fee inside Port Harcourt'),
  (gen_random_uuid(), 'Rivers', NULL, 0, 500.00, 'Standard Rivers State delivery fee'),
  (gen_random_uuid(), 'Other', NULL, 0, 1500.00, 'Out-of-state delivery fee')
ON CONFLICT DO NOTHING;

-- Seed a default delivery driver
INSERT INTO public.delivery_drivers (id, full_name, phone, whatsapp, vehicle, active)
VALUES
  (gen_random_uuid(), 'Default Driver', '+2348000000000', '+2348000000000', 'Motorbike', TRUE)
ON CONFLICT DO NOTHING;









-- End of migration************************8888888888888888888888888888888888888888
-- Migration: add delivery_drivers, delivery_charges, and product benefits
-- Timestamp: 2025-11-26 12:00:00

-- Ensure pgcrypto (gen_random_uuid) is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create delivery drivers table
CREATE TABLE IF NOT EXISTS public.delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  vehicle TEXT,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

-- Create delivery charges table
CREATE TABLE IF NOT EXISTS public.delivery_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT NOT NULL,
  city TEXT,
  min_subtotal DECIMAL(10,2) DEFAULT 0,
  charge DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.delivery_charges ENABLE ROW LEVEL SECURITY;

-- Add product fields for short description and benefits (JSONB array)
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;

-- RLS policies: create only if missing (Postgres doesn't support CREATE POLICY IF NOT EXISTS)
DO $$
BEGIN
  -- Admins can manage delivery drivers
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can manage delivery drivers'
      AND polrelid = 'public.delivery_drivers'::regclass
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Admins can manage delivery drivers"
        ON public.delivery_drivers
        FOR ALL
        TO authenticated
        USING ((public.has_role(auth.uid(), 'admin')));
    $pol$;
  END IF;

  -- Admins can manage delivery charges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Admins can manage delivery charges'
      AND polrelid = 'public.delivery_charges'::regclass
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Admins can manage delivery charges"
        ON public.delivery_charges
        FOR ALL
        TO authenticated
        USING ((public.has_role(auth.uid(), 'admin')));
    $pol$;
  END IF;

  -- Public can view delivery charges
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polname = 'Anyone can view delivery charges'
      AND polrelid = 'public.delivery_charges'::regclass
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Anyone can view delivery charges"
        ON public.delivery_charges
        FOR SELECT
        TO anon, authenticated
        USING ((TRUE));
    $pol$;
  END IF;
END
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers if the helper exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    RAISE NOTICE 'update_updated_at_column function not found; skipping triggers';
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_drivers_updated_at'
    ) THEN
      EXECUTE 'CREATE TRIGGER update_delivery_drivers_updated_at
        BEFORE UPDATE ON public.delivery_drivers
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'update_delivery_charges_updated_at'
    ) THEN
      EXECUTE 'CREATE TRIGGER update_delivery_charges_updated_at
        BEFORE UPDATE ON public.delivery_charges
        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();';
    END IF;
  END IF;
END
$$ LANGUAGE plpgsql;

-- Seed example delivery charges (idempotent)
INSERT INTO public.delivery_charges (id, state, city, min_subtotal, charge, notes)
VALUES
  (gen_random_uuid(), 'Rivers', 'Port Harcourt', 0, 0.00, 'No delivery fee inside Port Harcourt'),
  (gen_random_uuid(), 'Rivers', NULL, 0, 500.00, 'Standard Rivers State delivery fee'),
  (gen_random_uuid(), 'Other', NULL, 0, 1500.00, 'Out-of-state delivery fee')
ON CONFLICT DO NOTHING;

-- Seed a default delivery driver (idempotent)
INSERT INTO public.delivery_drivers (id, full_name, phone, whatsapp, vehicle, active)
VALUES
  (gen_random_uuid(), 'Default Driver', '+2348000000000', '+2348000000000', 'Motorbike', TRUE)
ON CONFLICT DO NOTHING;