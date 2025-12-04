-- Migration: Add tracking_info field to orders table
-- Generated: 2025-11-29

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS tracking_info JSONB DEFAULT NULL;

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_orders_tracking_info ON public.orders USING GIN (tracking_info);

-- Comment explaining the field structure
COMMENT ON COLUMN public.orders.tracking_info IS 'JSON array of tracking updates: [{ "timestamp": "2025-11-29T...", "status": "out_for_delivery", "message": "Driver is 5 minutes away", "location": { "lat": 6.5244, "lng": 3.3792 } }, ...]';
