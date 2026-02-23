-- Create enum for negotiation status
CREATE TYPE public.negotiation_status AS ENUM (
  'pending',
  'negotiating',
  'accepted',
  'declined',
  'expired',
  'timeout'
);

-- Create couriers table
CREATE TABLE public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  available_capacity INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create leads table (vehicle shipment requests)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id TEXT NOT NULL,
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
  initial_price DECIMAL(10, 2),
  payment_type TEXT,
  notes TEXT,
  status TEXT DEFAULT 'open',
  is_locked BOOLEAN DEFAULT false,
  locked_by_courier_id UUID REFERENCES public.couriers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create negotiations table
CREATE TABLE public.negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  courier_id UUID REFERENCES public.couriers(id) ON DELETE CASCADE NOT NULL,
  status negotiation_status DEFAULT 'pending',
  current_offer DECIMAL(10, 2),
  counter_count INTEGER DEFAULT 0,
  negotiation_started_at TIMESTAMP WITH TIME ZONE,
  negotiation_expires_at TIMESTAMP WITH TIME ZONE,
  courier_response_deadline TIMESTAMP WITH TIME ZONE,
  shipper_response_deadline TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lead_id, courier_id)
);

-- Create offers table (track all offers in negotiation)
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id UUID REFERENCES public.negotiations(id) ON DELETE CASCADE NOT NULL,
  offered_by TEXT NOT NULL CHECK (offered_by IN ('shipper', 'courier')),
  amount DECIMAL(10, 2) NOT NULL,
  response TEXT CHECK (response IN ('pending', 'accepted', 'declined', 'countered', 'expired')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Public read policies (for now, can be restricted later with auth)
CREATE POLICY "Allow public read couriers" ON public.couriers FOR SELECT USING (true);
CREATE POLICY "Allow public insert couriers" ON public.couriers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update couriers" ON public.couriers FOR UPDATE USING (true);

CREATE POLICY "Allow public read leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update leads" ON public.leads FOR UPDATE USING (true);

CREATE POLICY "Allow public read negotiations" ON public.negotiations FOR SELECT USING (true);
CREATE POLICY "Allow public insert negotiations" ON public.negotiations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update negotiations" ON public.negotiations FOR UPDATE USING (true);

CREATE POLICY "Allow public read offers" ON public.offers FOR SELECT USING (true);
CREATE POLICY "Allow public insert offers" ON public.offers FOR INSERT WITH CHECK (true);

-- Enable realtime for negotiations and offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.negotiations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_couriers_updated_at
BEFORE UPDATE ON public.couriers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_negotiations_updated_at
BEFORE UPDATE ON public.negotiations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();