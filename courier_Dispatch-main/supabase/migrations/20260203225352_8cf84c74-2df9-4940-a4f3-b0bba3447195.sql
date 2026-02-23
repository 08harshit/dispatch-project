-- Replace security-definer view with a real public table (no PII) + RLS
-- This removes the "Security Definer View" security error while keeping public browsing.

-- 1) Drop the view
DROP VIEW IF EXISTS public.load_notifications_public;

-- 2) Create a public, non-sensitive table
CREATE TABLE IF NOT EXISTS public.load_notifications_public (
  id uuid PRIMARY KEY REFERENCES public.load_notifications(id) ON DELETE CASCADE,

  pickup_address text NOT NULL,
  pickup_city text NOT NULL,
  pickup_state text NOT NULL,
  pickup_coordinates numeric[] NOT NULL,
  pickup_date date NOT NULL,
  pickup_time text NOT NULL,

  delivery_address text NOT NULL,
  delivery_city text NOT NULL,
  delivery_state text NOT NULL,
  delivery_coordinates numeric[] NOT NULL,
  delivery_date date NOT NULL,
  delivery_time text NOT NULL,

  vehicle_type text NOT NULL,
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer NOT NULL,

  price numeric NOT NULL,
  distance numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  assigned_courier_id uuid NULL,
  shipper_id uuid NULL
);

-- 3) Enable RLS and allow public read of pending, non-expired rows
ALTER TABLE public.load_notifications_public ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view pending public loads" ON public.load_notifications_public;
CREATE POLICY "Public can view pending public loads"
ON public.load_notifications_public
FOR SELECT
TO anon, authenticated
USING (status = 'pending' AND expires_at > now());

-- Prevent direct writes from clients (table is maintained by trigger)
DROP POLICY IF EXISTS "No direct insert into public loads" ON public.load_notifications_public;
CREATE POLICY "No direct insert into public loads"
ON public.load_notifications_public
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "No direct update of public loads" ON public.load_notifications_public;
CREATE POLICY "No direct update of public loads"
ON public.load_notifications_public
FOR UPDATE
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "No direct delete of public loads" ON public.load_notifications_public;
CREATE POLICY "No direct delete of public loads"
ON public.load_notifications_public
FOR DELETE
TO anon, authenticated
USING (false);

-- 4) Sync trigger: keep the public table in sync with the private table
CREATE OR REPLACE FUNCTION public.sync_load_notifications_public()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.load_notifications_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  -- Only keep pending + non-expired loads in the public table
  IF NEW.status = 'pending' AND NEW.expires_at > now() THEN
    INSERT INTO public.load_notifications_public (
      id,
      pickup_address, pickup_city, pickup_state, pickup_coordinates, pickup_date, pickup_time,
      delivery_address, delivery_city, delivery_state, delivery_coordinates, delivery_date, delivery_time,
      vehicle_type, vehicle_make, vehicle_model, vehicle_year,
      price, distance, status, expires_at,
      created_at, updated_at,
      assigned_courier_id, shipper_id
    )
    VALUES (
      NEW.id,
      NEW.pickup_address, NEW.pickup_city, NEW.pickup_state, NEW.pickup_coordinates, NEW.pickup_date, NEW.pickup_time,
      NEW.delivery_address, NEW.delivery_city, NEW.delivery_state, NEW.delivery_coordinates, NEW.delivery_date, NEW.delivery_time,
      NEW.vehicle_type, NEW.vehicle_make, NEW.vehicle_model, NEW.vehicle_year,
      NEW.price, NEW.distance, NEW.status, NEW.expires_at,
      NEW.created_at, NEW.updated_at,
      NEW.assigned_courier_id, NEW.shipper_id
    )
    ON CONFLICT (id) DO UPDATE SET
      pickup_address = EXCLUDED.pickup_address,
      pickup_city = EXCLUDED.pickup_city,
      pickup_state = EXCLUDED.pickup_state,
      pickup_coordinates = EXCLUDED.pickup_coordinates,
      pickup_date = EXCLUDED.pickup_date,
      pickup_time = EXCLUDED.pickup_time,
      delivery_address = EXCLUDED.delivery_address,
      delivery_city = EXCLUDED.delivery_city,
      delivery_state = EXCLUDED.delivery_state,
      delivery_coordinates = EXCLUDED.delivery_coordinates,
      delivery_date = EXCLUDED.delivery_date,
      delivery_time = EXCLUDED.delivery_time,
      vehicle_type = EXCLUDED.vehicle_type,
      vehicle_make = EXCLUDED.vehicle_make,
      vehicle_model = EXCLUDED.vehicle_model,
      vehicle_year = EXCLUDED.vehicle_year,
      price = EXCLUDED.price,
      distance = EXCLUDED.distance,
      status = EXCLUDED.status,
      expires_at = EXCLUDED.expires_at,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      assigned_courier_id = EXCLUDED.assigned_courier_id,
      shipper_id = EXCLUDED.shipper_id;
  ELSE
    DELETE FROM public.load_notifications_public WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_load_notifications_public_trigger ON public.load_notifications;
CREATE TRIGGER sync_load_notifications_public_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.load_notifications
FOR EACH ROW
EXECUTE FUNCTION public.sync_load_notifications_public();

-- 5) Backfill existing pending data
INSERT INTO public.load_notifications_public (
  id,
  pickup_address, pickup_city, pickup_state, pickup_coordinates, pickup_date, pickup_time,
  delivery_address, delivery_city, delivery_state, delivery_coordinates, delivery_date, delivery_time,
  vehicle_type, vehicle_make, vehicle_model, vehicle_year,
  price, distance, status, expires_at,
  created_at, updated_at,
  assigned_courier_id, shipper_id
)
SELECT
  id,
  pickup_address, pickup_city, pickup_state, pickup_coordinates, pickup_date, pickup_time,
  delivery_address, delivery_city, delivery_state, delivery_coordinates, delivery_date, delivery_time,
  vehicle_type, vehicle_make, vehicle_model, vehicle_year,
  price, distance, status, expires_at,
  created_at, updated_at,
  assigned_courier_id, shipper_id
FROM public.load_notifications
WHERE status = 'pending' AND expires_at > now()
ON CONFLICT (id) DO NOTHING;
