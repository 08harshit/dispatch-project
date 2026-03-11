-- Courier cost records for expense tracking (fuel, parking, maintenance, etc.)
CREATE TABLE IF NOT EXISTS public.courier_cost_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Fuel','Parking','Insurance','Washing','Maintenance','Credits')),
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  payment_method TEXT DEFAULT 'Card',
  has_docs BOOLEAN DEFAULT false,
  invoice_url TEXT,
  invoice_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courier_cost_records_courier_id ON public.courier_cost_records(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_cost_records_date ON public.courier_cost_records(date);
