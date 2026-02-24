-- Courier saved loads (persistent bookmarks). Same DB as Admin; references public.leads and public.couriers.

CREATE TABLE IF NOT EXISTS public.saved_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(courier_id, lead_id)
);

CREATE INDEX idx_saved_loads_courier_id ON public.saved_loads(courier_id);
CREATE INDEX idx_saved_loads_lead_id ON public.saved_loads(lead_id);

ALTER TABLE public.saved_loads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to saved_loads" ON public.saved_loads FOR ALL USING (true) WITH CHECK (true);
