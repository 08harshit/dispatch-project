-- Add soft delete support for couriers
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_couriers_deleted_at ON public.couriers(deleted_at);
