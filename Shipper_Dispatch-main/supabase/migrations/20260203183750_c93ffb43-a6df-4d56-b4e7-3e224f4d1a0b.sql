-- Create condition_reports table for storing vehicle condition reports
CREATE TABLE public.condition_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Drivability
  runs_and_drives TEXT NOT NULL DEFAULT 'unknown',
  starts BOOLEAN NOT NULL DEFAULT false,
  not_drivable BOOLEAN NOT NULL DEFAULT false,
  
  -- Structural & Body
  no_structural_damage BOOLEAN NOT NULL DEFAULT true,
  prior_paint BOOLEAN NOT NULL DEFAULT false,
  
  -- Interior & Exterior
  tires_condition TEXT NOT NULL DEFAULT 'good',
  clean BOOLEAN NOT NULL DEFAULT true,
  other_odor BOOLEAN NOT NULL DEFAULT false,
  smoke_odor BOOLEAN NOT NULL DEFAULT false,
  
  -- Keys & Accessories
  keys_available BOOLEAN NOT NULL DEFAULT true,
  key_fobs INTEGER NOT NULL DEFAULT 1,
  
  -- Documentation
  invoice_available BOOLEAN NOT NULL DEFAULT false,
  
  -- Mileage
  mileage TEXT DEFAULT '',
  
  -- Complex data stored as JSONB
  announcements JSONB NOT NULL DEFAULT '[]'::jsonb,
  high_value_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  exterior_damage_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  interior_damage_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  mechanical_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  structural_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  vehicle_history JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  tires_wheels JSONB NOT NULL DEFAULT '{}'::jsonb,
  exterior_checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  under_vehicle JSONB NOT NULL DEFAULT '{}'::jsonb,
  under_hood JSONB NOT NULL DEFAULT '{}'::jsonb,
  brakes_tires JSONB NOT NULL DEFAULT '{}'::jsonb,
  damage_areas JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Notes
  condition_notes TEXT DEFAULT '',
  mechanic_comments TEXT DEFAULT '',
  estimated_repair_cost TEXT DEFAULT '',
  
  -- Photos (array of URLs)
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- PDF Upload
  pdf_report_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.condition_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented)
CREATE POLICY "Allow public read condition_reports" 
ON public.condition_reports 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert condition_reports" 
ON public.condition_reports 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update condition_reports" 
ON public.condition_reports 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete condition_reports" 
ON public.condition_reports 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_condition_reports_updated_at
BEFORE UPDATE ON public.condition_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on vehicle_id for faster lookups
CREATE INDEX idx_condition_reports_vehicle_id ON public.condition_reports(vehicle_id);
CREATE INDEX idx_condition_reports_lead_id ON public.condition_reports(lead_id);