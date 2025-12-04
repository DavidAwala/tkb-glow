-- Migration: Create redeem_promo RPC (idempotent)
-- Generated: 2025-11-29

-- Drop existing function if present (to avoid signature mismatch issues)
DROP FUNCTION IF EXISTS public.redeem_promo(TEXT, NUMERIC);

-- This function atomically validates and increments promo usage.
-- It locks the promo row with FOR UPDATE, checks constraints, increments `uses`, and returns the promo row as a TABLE.
CREATE FUNCTION public.redeem_promo(p_code TEXT, p_subtotal NUMERIC)
RETURNS TABLE(
  id UUID,
  code TEXT,
  description TEXT,
  discount_type TEXT,
  value NUMERIC(10,2),
  apply_to_delivery BOOLEAN,
  occasions TEXT,
  active BOOLEAN,
  min_subtotal NUMERIC(10,2),
  max_uses INTEGER,
  uses INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
  v_code TEXT;
  v_description TEXT;
  v_discount_type TEXT;
  v_value NUMERIC(10,2);
  v_apply_to_delivery BOOLEAN;
  v_occasions TEXT;
  v_active BOOLEAN;
  v_min_subtotal NUMERIC(10,2);
  v_max_uses INTEGER;
  v_uses INTEGER;
  v_expires_at TIMESTAMPTZ;
  v_created_at TIMESTAMPTZ;
  v_updated_at TIMESTAMPTZ;
BEGIN
  -- Fetch the promo code row with explicit column selection to avoid ambiguity
  -- Lock it with FOR UPDATE for atomicity
  SELECT 
    promo_codes.id,
    promo_codes.code,
    promo_codes.description,
    promo_codes.discount_type,
    promo_codes.value,
    promo_codes.apply_to_delivery,
    promo_codes.occasions,
    promo_codes.active,
    promo_codes.min_subtotal,
    promo_codes.max_uses,
    promo_codes.uses,
    promo_codes.expires_at,
    promo_codes.created_at,
    promo_codes.updated_at
  INTO 
    v_id,
    v_code,
    v_description,
    v_discount_type,
    v_value,
    v_apply_to_delivery,
    v_occasions,
    v_active,
    v_min_subtotal,
    v_max_uses,
    v_uses,
    v_expires_at,
    v_created_at,
    v_updated_at
  FROM public.promo_codes
  WHERE public.promo_codes.code = upper(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROMO_NOT_FOUND';
  END IF;

  IF v_active IS NOT TRUE THEN
    RAISE EXCEPTION 'PROMO_INACTIVE';
  END IF;

  IF v_expires_at IS NOT NULL AND v_expires_at <= now() THEN
    RAISE EXCEPTION 'PROMO_EXPIRED';
  END IF;

  IF v_min_subtotal IS NOT NULL AND p_subtotal < v_min_subtotal THEN
    RAISE EXCEPTION 'PROMO_MIN_SUBTOTAL';
  END IF;

  IF v_max_uses IS NOT NULL AND v_uses >= v_max_uses THEN
    RAISE EXCEPTION 'PROMO_MAX_USES_REACHED';
  END IF;

  -- Increment uses for this promo code
  UPDATE public.promo_codes 
  SET uses = uses + 1, updated_at = now() 
  WHERE public.promo_codes.id = v_id;

  -- Return the updated promo data using explicit local variables (no ambiguity possible)
  RETURN QUERY SELECT v_id, v_code, v_description, v_discount_type, v_value, v_apply_to_delivery, v_occasions, v_active, v_min_subtotal, v_max_uses, (v_uses + 1)::INTEGER, v_expires_at, v_created_at, v_updated_at;
END;
$$;
