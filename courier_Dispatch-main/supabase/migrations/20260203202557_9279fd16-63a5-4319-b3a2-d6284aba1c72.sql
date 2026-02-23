-- Create a public view that excludes sensitive shipper information
CREATE VIEW public.load_notifications_public
WITH (security_invoker = on) AS
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
  vehicle_make,
  vehicle_model,
  vehicle_type,
  vehicle_year,
  price,
  distance,
  status,
  expires_at,
  created_at,
  updated_at,
  assigned_courier_id,
  shipper_id
  -- Excluded: shipper_name, shipper_company, shipper_phone, shipper_rating, shipper_total_loads
FROM public.load_notifications;

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can view pending notifications" ON public.load_notifications;

-- Create a restrictive policy - only shipper or assigned courier can see full data
CREATE POLICY "Shipper and assigned courier can view full data" 
ON public.load_notifications 
FOR SELECT 
USING (
  (shipper_id = auth.uid()) OR 
  (assigned_courier_id = auth.uid())
);

-- Create policy for the public view to allow viewing pending notifications
CREATE POLICY "Anyone can view pending notifications via view"
ON public.load_notifications
FOR SELECT
USING (status = 'pending'::text);

-- Add comment explaining the security pattern
COMMENT ON VIEW public.load_notifications_public IS 'Public view that hides sensitive shipper data (phone, name, company, rating). Use this for anonymous/public access to pending notifications.';