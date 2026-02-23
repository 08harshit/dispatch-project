-- Create activity_log table to track all modifications
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id),
  action_type TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  performed_by TEXT DEFAULT 'System',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read activity_log" 
ON public.activity_log 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert activity_log" 
ON public.activity_log 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_activity_log_lead_id ON public.activity_log(lead_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;