-- Add soft delete support for shippers
ALTER TABLE public.shippers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_shippers_deleted_at ON public.shippers(deleted_at);
