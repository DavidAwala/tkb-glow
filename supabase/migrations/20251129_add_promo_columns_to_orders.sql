-- Migration: Add promo fields to orders table
-- Generated: 2025-11-29

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS promo_code TEXT DEFAULT NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS promo_applied_at TIMESTAMPTZ DEFAULT NULL;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON public.orders (promo_code);

COMMENT ON COLUMN public.orders.promo_code IS 'Applied promo code at time of order';
COMMENT ON COLUMN public.orders.discount_amount IS 'Numeric value of discount applied to order (NGN)';
COMMENT ON COLUMN public.orders.promo_applied_at IS 'Timestamp when promo was applied';
