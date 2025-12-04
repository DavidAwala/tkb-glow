-- Seed: sample product + order + order_item for local development
-- Generated: 2025-11-26

DO $$
BEGIN
  -- Insert a sample product if not exists
  IF NOT EXISTS (SELECT 1 FROM public.products WHERE sku = 'SAMPLE-001') THEN
    INSERT INTO public.products (id, sku, title, description, short_desc, price, stock, images, category, featured)
    VALUES (
      gen_random_uuid(),
      'SAMPLE-001',
      'Sample Product',
      'This is a sample product used for local testing.',
      'Sample short description',
      1000.00,
      50,
      ARRAY['https://via.placeholder.com/300'],
      'sample',
      false
    );
  END IF;

  -- Insert a sample order (guest) if not exists
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE email = 'guest@example.com' AND total = 1000.00) THEN
    INSERT INTO public.orders (id, user_id, email, total, status, shipping_address)
    VALUES (
      gen_random_uuid(),
      NULL,
      'guest@example.com',
      1000.00,
      'pending',
      jsonb_build_object('raw_address', '123 Sample St', 'city', 'Sampleville', 'state', 'SV', 'phone', '08000000000')
    ) RETURNING id INTO STRICT _;
  END IF;
END$$;

-- Insert order_item linking to the sample product and most recent guest order
WITH sample_product AS (
  SELECT id FROM public.products WHERE sku = 'SAMPLE-001' LIMIT 1
), sample_order AS (
  SELECT id FROM public.orders WHERE email = 'guest@example.com' AND total = 1000.00 ORDER BY created_at DESC LIMIT 1
)
INSERT INTO public.order_items (id, order_id, product_id, product_title, product_price, quantity)
SELECT gen_random_uuid(), so.id, sp.id, 'Sample Product', 1000.00, 1
FROM sample_product sp, sample_order so
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_items oi WHERE oi.order_id = so.id AND oi.product_id = sp.id
);
