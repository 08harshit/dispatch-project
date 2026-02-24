-- Contracts, Trips, Trip Events (milestone-based trip lifecycle)
-- Shipper posts load -> Courier bids -> Contract on accept. Trip completes when both pickup_scan and delivery_scan exist.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL;

CREATE TYPE public.contract_status AS ENUM ('draft','signed','active','completed','cancelled');
CREATE TYPE public.trip_status AS ENUM ('scheduled','in_progress','completed','cancelled');
CREATE TYPE public.trip_event_type AS ENUM ('pickup_scan','delivery_scan');
CREATE TYPE public.vehicle_state AS ENUM ('contract_made_will_pickup','in_transit','delivered');

CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  pickup_time TIMESTAMPTZ NOT NULL,
  expected_reach_time TIMESTAMPTZ NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  status public.contract_status NOT NULL DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_lead_id ON public.contracts(lead_id);
CREATE INDEX idx_contracts_courier_id ON public.contracts(courier_id);
CREATE INDEX idx_contracts_shipper_id ON public.contracts(shipper_id);

CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  status public.trip_status NOT NULL DEFAULT 'scheduled',
  vehicle_state public.vehicle_state,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_trips_contract_id ON public.trips(contract_id);

CREATE TABLE public.trip_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  event_type public.trip_event_type NOT NULL,
  scanned_value TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, event_type)
);
CREATE INDEX idx_trip_events_trip_id ON public.trip_events(trip_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Allow read contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Allow insert contracts" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update contracts" ON public.contracts FOR UPDATE USING (true);
CREATE POLICY "Allow read trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Allow insert trips" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update trips" ON public.trips FOR UPDATE USING (true);
CREATE POLICY "Allow read trip_events" ON public.trip_events FOR SELECT USING (true);
CREATE POLICY "Allow insert trip_events" ON public.trip_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update trip_events" ON public.trip_events FOR UPDATE USING (true);
