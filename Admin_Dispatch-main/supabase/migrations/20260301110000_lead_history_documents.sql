-- Create lead_history and lead_documents tables correctly linked to `leads` table

-- Lead history
CREATE TABLE IF NOT EXISTS public.lead_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lead documents
CREATE TABLE IF NOT EXISTS public.lead_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all access to lead_history" ON public.lead_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to lead_documents" ON public.lead_documents FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON public.lead_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_documents_lead_id ON public.lead_documents(lead_id);
