-- Add auth_user_id to shippers for Shipper app login resolution
ALTER TABLE public.shippers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_shippers_auth_user_id ON public.shippers(auth_user_id) WHERE auth_user_id IS NOT NULL;
