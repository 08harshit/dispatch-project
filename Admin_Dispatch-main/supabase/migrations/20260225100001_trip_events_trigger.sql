-- Trip event handler: update trip status and vehicle_state when pickup_scan or delivery_scan is recorded.
-- Trip closes (status = completed, completed_at set) only when BOTH events exist.

CREATE OR REPLACE FUNCTION public.on_trip_event_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_pickup BOOLEAN;
  v_has_delivery BOOLEAN;
BEGIN
  IF NEW.event_type = 'pickup_scan' THEN
    UPDATE public.trips
    SET
      status = 'in_progress',
      vehicle_state = 'in_transit',
      started_at = COALESCE(started_at, NEW.occurred_at),
      updated_at = now()
    WHERE id = NEW.trip_id;
  ELSIF NEW.event_type = 'delivery_scan' THEN
    UPDATE public.trips
    SET
      vehicle_state = 'delivered',
      updated_at = now()
    WHERE id = NEW.trip_id;

    SELECT
      EXISTS (SELECT 1 FROM public.trip_events WHERE trip_id = NEW.trip_id AND event_type = 'pickup_scan'),
      EXISTS (SELECT 1 FROM public.trip_events WHERE trip_id = NEW.trip_id AND event_type = 'delivery_scan')
    INTO v_has_pickup, v_has_delivery;

    IF v_has_pickup AND v_has_delivery THEN
      UPDATE public.trips
      SET
        status = 'completed',
        completed_at = now(),
        updated_at = now()
      WHERE id = NEW.trip_id;

      -- Set vehicle_access expiry to 30 mins after trip end (revoke is done by cron calling revoke_expired_vehicle_access)
      UPDATE public.vehicle_access
      SET exp_dt = now() + interval '30 minutes', updated_at = now()
      WHERE trip_id = NEW.trip_id AND is_active = true;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_on_trip_event_insert ON public.trip_events;
CREATE TRIGGER trigger_on_trip_event_insert
  AFTER INSERT ON public.trip_events
  FOR EACH ROW
  EXECUTE FUNCTION public.on_trip_event_insert();

-- Revoke vehicle access when exp_dt has passed. Call from cron or Supabase Edge Function (e.g. every 5 mins).
CREATE OR REPLACE FUNCTION public.revoke_expired_vehicle_access()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.vehicle_access
  SET is_active = false, updated_at = now()
  WHERE is_active = true AND exp_dt < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
