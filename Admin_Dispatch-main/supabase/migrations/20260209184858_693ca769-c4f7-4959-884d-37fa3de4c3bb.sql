
-- Enums
CREATE TYPE public.courier_status AS ENUM ('active', 'inactive');
CREATE TYPE public.courier_compliance AS ENUM ('compliant', 'non-compliant');
CREATE TYPE public.shipper_status AS ENUM ('active', 'inactive');
CREATE TYPE public.shipper_compliance AS ENUM ('compliant', 'non-compliant');
CREATE TYPE public.load_status AS ENUM ('pending', 'in-transit', 'delivered', 'cancelled');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in-progress', 'resolved', 'closed');

-- Couriers
CREATE TABLE public.couriers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  usdot TEXT,
  mc TEXT,
  compliance courier_compliance NOT NULL DEFAULT 'non-compliant',
  status courier_status NOT NULL DEFAULT 'active',
  trucks INTEGER DEFAULT 0,
  insurance_company TEXT,
  equipment_type TEXT,
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shippers
CREATE TABLE public.shippers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  phone TEXT,
  address TEXT,
  business_type TEXT,
  city TEXT,
  state TEXT,
  tax_exempt BOOLEAN DEFAULT false,
  ein TEXT,
  hours_pickup TEXT,
  hours_dropoff TEXT,
  principal_name TEXT,
  compliance shipper_compliance NOT NULL DEFAULT 'non-compliant',
  status shipper_status NOT NULL DEFAULT 'active',
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loads (references couriers and shippers)
CREATE TABLE public.loads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vin TEXT,
  stock_number TEXT,
  shipper_id UUID REFERENCES public.shippers(id) ON DELETE SET NULL,
  courier_id UUID REFERENCES public.couriers(id) ON DELETE SET NULL,
  pickup_date DATE,
  dropoff_date DATE,
  status load_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Load documents
CREATE TABLE public.load_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Load history
CREATE TABLE public.load_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  load_id UUID NOT NULL REFERENCES public.loads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courier documents
CREATE TABLE public.courier_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courier history
CREATE TABLE public.courier_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipper documents
CREATE TABLE public.shipper_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shipper history
CREATE TABLE public.shipper_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID NOT NULL REFERENCES public.shippers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  priority ticket_priority NOT NULL DEFAULT 'medium',
  status ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket comments
CREATE TABLE public.ticket_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shippers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipper_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipper_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth yet — open access for now)
CREATE POLICY "Allow all access to couriers" ON public.couriers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shippers" ON public.shippers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to loads" ON public.loads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to load_documents" ON public.load_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to load_history" ON public.load_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to courier_documents" ON public.courier_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to courier_history" ON public.courier_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shipper_documents" ON public.shipper_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to shipper_history" ON public.shipper_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tickets" ON public.tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ticket_comments" ON public.ticket_comments FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_couriers_updated_at BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shippers_updated_at BEFORE UPDATE ON public.shippers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loads_updated_at BEFORE UPDATE ON public.loads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
