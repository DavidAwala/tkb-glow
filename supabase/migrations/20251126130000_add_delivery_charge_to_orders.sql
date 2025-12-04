-- Migration: add delivery_charge column to orders table
-- Timestamp: 2025-11-26 13:00:00

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10,2) DEFAULT 0;
