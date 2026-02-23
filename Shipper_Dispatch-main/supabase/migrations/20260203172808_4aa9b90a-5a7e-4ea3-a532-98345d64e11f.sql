-- Create accounting_records table
CREATE TABLE public.accounting_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id TEXT NOT NULL,
  cost NUMERIC NOT NULL DEFAULT 0,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dispatch_status TEXT NOT NULL DEFAULT 'pending',
  payout_status TEXT NOT NULL DEFAULT 'pending',
  has_docs BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create accounting_history table for tracking all modifications
CREATE TABLE public.accounting_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.accounting_records(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  performed_by TEXT NOT NULL DEFAULT 'System',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accounting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_history ENABLE ROW LEVEL SECURITY;

-- Create policies for accounting_records
CREATE POLICY "Allow public read accounting_records" 
ON public.accounting_records 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert accounting_records" 
ON public.accounting_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update accounting_records" 
ON public.accounting_records 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete accounting_records" 
ON public.accounting_records 
FOR DELETE 
USING (true);

-- Create policies for accounting_history
CREATE POLICY "Allow public read accounting_history" 
ON public.accounting_history 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert accounting_history" 
ON public.accounting_history 
FOR INSERT 
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_accounting_history_record_id ON public.accounting_history(record_id);
CREATE INDEX idx_accounting_records_listing_id ON public.accounting_records(listing_id);

-- Create trigger for updated_at
CREATE TRIGGER update_accounting_records_updated_at
BEFORE UPDATE ON public.accounting_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounting_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounting_history;

-- Insert initial seed data
INSERT INTO public.accounting_records (listing_id, cost, date, dispatch_status, payout_status, has_docs) VALUES
('SHP-001', 850, '2025-12-20T18:28:00Z', 'dispatched', 'processing', true),
('SHP-002', 620, '2026-01-19T18:28:00Z', 'dispatched', 'paid', true),
('SHP-003', 450, '2026-02-01T18:28:00Z', 'dispatched', 'paid', true),
('SHP-004', 1200, '2025-12-30T18:28:00Z', 'pending', 'pending', false),
('SHP-005', 380, '2026-01-10T18:28:00Z', 'dispatched', 'processing', true),
('SHP-006', 720, '2025-11-15T18:28:00Z', 'canceled', 'pending', false),
('SHP-007', 580, '2026-01-25T18:28:00Z', 'dispatched', 'paid', true),
('SHP-008', 490, '2026-01-05T18:28:00Z', 'dispatched', 'paid', false);

-- Insert initial history for seed data
INSERT INTO public.accounting_history (record_id, action_type, performed_by, details)
SELECT id, 'created', 'System', 'Record created'
FROM public.accounting_records;