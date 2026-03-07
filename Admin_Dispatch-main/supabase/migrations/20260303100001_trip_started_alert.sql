-- Extend on_trip_event_insert to insert trip_started into notification_log when pickup_scan is recorded.
CREATE OR REPLACE FUNCTION public.on_trip_event_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_pickup BOOLEAN;
  v_has_delivery BOOLEAN;
  v_contract_id UUID;
  v_amount NUMERIC(12,2);
  v_start_location TEXT;
  v_end_location TEXT;
  v_pickup_time TIMESTAMPTZ;
  v_delivered_at TIMESTAMPTZ;
  v_courier_name TEXT;
  v_shipper_name TEXT;
  v_load_description TEXT;
BEGIN
  IF NEW.event_type = 'pickup_scan' THEN
    UPDATE public.trips
    SET
      status = 'in_progress',
      vehicle_state = 'in_transit',
      started_at = COALESCE(started_at, NEW.occurred_at),
      updated_at = now()
    WHERE id = NEW.trip_id;

    INSERT INTO public.notification_log (event_type, trip_id, contract_id, created_at)
    SELECT 'trip_started', NEW.trip_id, t.contract_id, now()
    FROM public.trips t
    WHERE t.id = NEW.trip_id AND t.contract_id IS NOT NULL;
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

      UPDATE public.vehicle_access
      SET exp_dt = now() + interval '30 minutes', updated_at = now()
      WHERE trip_id = NEW.trip_id AND is_active = true;

      SELECT t.contract_id, c.amount, c.start_location, c.end_location, c.pickup_time,
             t.completed_at, cou.name, sh.name,
             trim(concat_ws(' ',
               l.vehicle_year, l.vehicle_make, l.vehicle_model,
               l.vehicle_type, l.vehicle_color
             )) || case when l.notes is not null and l.notes <> '' then ' - ' || l.notes else '' end
      INTO v_contract_id, v_amount, v_start_location, v_end_location, v_pickup_time,
           v_delivered_at, v_courier_name, v_shipper_name, v_load_description
      FROM public.trips t
      JOIN public.contracts c ON c.id = t.contract_id
      LEFT JOIN public.couriers cou ON cou.id = c.courier_id
      LEFT JOIN public.shippers sh ON sh.id = c.shipper_id
      LEFT JOIN public.leads l ON l.id = c.lead_id
      WHERE t.id = NEW.trip_id;

      IF v_contract_id IS NOT NULL AND v_amount IS NOT NULL THEN
        INSERT INTO public.invoices (
          trip_id, contract_id, amount, generated_at, created_at,
          start_location, end_location, pickup_time, delivered_at, courier_name, shipper_name, load_description
        )
        VALUES (
          NEW.trip_id, v_contract_id, v_amount, now(), now(),
          COALESCE(v_start_location, ''), COALESCE(v_end_location, ''), v_pickup_time, v_delivered_at,
          v_courier_name, v_shipper_name, COALESCE(NULLIF(trim(v_load_description), ''), v_start_location || ' to ' || v_end_location)
        );

        INSERT INTO public.notification_log (event_type, trip_id, contract_id, created_at)
        VALUES ('trip_completed', NEW.trip_id, v_contract_id, now());
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
