-- Leads table (shipper-posted loads) for Admin/Courier DB.
-- Must exist before contracts migration (20260224100000) which references public.leads and adds shipper_id.
-- Schema aligned with Shipper app leads; shipper_id included for contract flow.

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_location_type TEXT,
  pickup_contact_name TEXT,
  pickup_contact_phone TEXT,
  pickup_contact_email TEXT,
  delivery_address TEXT NOT NULL,
  delivery_location_type TEXT,
  delivery_contact_name TEXT,
  delivery_contact_phone TEXT,
  delivery_contact_email TEXT,
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_vin TEXT,
  vehicle_type TEXT,
  vehicle_color TEXT,
  vehicle_runs BOOLEAN DEFAULT true,
  vehicle_rolls BOOLEAN DEFAULT true,
  initial_price NUMERIC(10, 2),
  payment_type TEXT,
  notes TEXT,
  status TEXT DEFAULT 'open',
  is_locked BOOLEAN DEFAULT false,
  locked_by_courier_id UUID REFERENCES public.couriers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_shipper_id ON public.leads(shipper_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
