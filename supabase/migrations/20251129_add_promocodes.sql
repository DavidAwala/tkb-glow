-- Migration: Add promo_codes table
-- Generated: 2025-11-29

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent' or 'fixed'
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  apply_to_delivery BOOLEAN DEFAULT FALSE,
  occasions TEXT,
  active BOOLEAN DEFAULT TRUE,
  min_subtotal NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_code_code ON public.promo_codes (code);

COMMENT ON TABLE public.promo_codes IS 'Promo codes for discounts: percent or fixed, may apply to delivery, have expiration and max uses.';
