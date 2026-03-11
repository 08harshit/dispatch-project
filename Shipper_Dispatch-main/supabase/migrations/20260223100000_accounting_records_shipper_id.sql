-- Add shipper_id to accounting_records for multi-tenant isolation
-- Uses nullable column without FK so migration works even if shippers table is in different schema
ALTER TABLE public.accounting_records 
ADD COLUMN IF NOT EXISTS shipper_id UUID;

CREATE INDEX IF NOT EXISTS idx_accounting_records_shipper_id ON public.accounting_records(shipper_id);
