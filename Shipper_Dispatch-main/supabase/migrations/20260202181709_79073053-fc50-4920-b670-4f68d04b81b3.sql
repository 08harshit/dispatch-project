-- Add verification columns to couriers table
ALTER TABLE public.couriers 
ADD COLUMN IF NOT EXISTS dot_number text,
ADD COLUMN IF NOT EXISTS mc_number text,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS legal_name text,
ADD COLUMN IF NOT EXISTS operating_status text;

-- Create index for DOT number lookups
CREATE INDEX IF NOT EXISTS idx_couriers_dot_number ON public.couriers(dot_number);
CREATE INDEX IF NOT EXISTS idx_couriers_verification_status ON public.couriers(verification_status);