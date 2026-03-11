-- Vehicles (courier-owned), vehicle_access (shipper can view vehicle during trip), invoices (post trip).
-- Vehicle access is revoked 30 mins after trip end (app/cron sets is_active = false when now() > exp_dt).

-- Vehicles: courier does the shipping; each vehicle belongs to a courier.
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  reg_no TEXT NOT NULL,
  vehicle_type TEXT,
  vin TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicles_courier_id ON public.vehicles(courier_id);
CREATE INDEX idx_vehicles_reg_no ON public.vehicles(reg_no);
CREATE INDEX idx_vehicles_is_available ON public.vehicles(is_available);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vehicle access: time-bound grant for shipper to view courier's vehicle during/after trip. Revoke 30 mins after trip end.
CREATE TABLE public.vehicle_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  wef_dt TIMESTAMPTZ NOT NULL,
  exp_dt TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_access_vehicle_id ON public.vehicle_access(vehicle_id);
CREATE INDEX idx_vehicle_access_shipper_id ON public.vehicle_access(shipper_id);
CREATE INDEX idx_vehicle_access_trip_id ON public.vehicle_access(trip_id);
CREATE INDEX idx_vehicle_access_exp_dt ON public.vehicle_access(exp_dt);
CREATE INDEX idx_vehicle_access_is_active ON public.vehicle_access(is_active);

ALTER TABLE public.vehicle_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to vehicle_access" ON public.vehicle_access FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_vehicle_access_updated_at
  BEFORE UPDATE ON public.vehicle_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoices: data only (no stored PDF). Generated when trip is completed; PDF is built at runtime from these columns.
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Columns used to generate PDF at runtime (snapshot at invoice creation)
  start_location TEXT NOT NULL DEFAULT '',
  end_location TEXT NOT NULL DEFAULT '',
  pickup_time TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  courier_name TEXT,
  shipper_name TEXT,
  load_description TEXT
);

CREATE INDEX idx_invoices_trip_id ON public.invoices(trip_id);
CREATE INDEX idx_invoices_contract_id ON public.invoices(contract_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
