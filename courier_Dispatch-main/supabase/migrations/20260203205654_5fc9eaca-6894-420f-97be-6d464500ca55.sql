-- Fix 1: Make invoices bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'invoices';

-- Remove public SELECT policy
DROP POLICY IF EXISTS "Public can view invoices" ON storage.objects;

-- Add authenticated-only policy for uploading
CREATE POLICY "Authenticated users can upload invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoices');

-- Add authenticated-only policy for viewing own uploads
CREATE POLICY "Authenticated users can view invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoices');

-- Add authenticated-only policy for deleting own uploads
CREATE POLICY "Authenticated users can delete invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoices');

-- Fix 2: Update load_notifications_public view to be security definer (bypasses RLS)
DROP VIEW IF EXISTS public.load_notifications_public;

CREATE VIEW public.load_notifications_public
WITH (security_invoker = false) AS
SELECT 
  id,
  pickup_address,
  pickup_city,
  pickup_state,
  pickup_coordinates,
  pickup_date,
  pickup_time,
  delivery_address,
  delivery_city,
  delivery_state,
  delivery_coordinates,
  delivery_date,
  delivery_time,
  vehicle_type,
  vehicle_make,
  vehicle_model,
  vehicle_year,
  price,
  distance,
  status,
  expires_at,
  created_at,
  updated_at,
  assigned_courier_id,
  shipper_id
FROM public.load_notifications
WHERE status = 'pending';

-- Fix 3: Drop the problematic policy that exposes all data for pending loads
DROP POLICY IF EXISTS "Anyone can view pending notifications via view" ON public.load_notifications;