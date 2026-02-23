-- Add new columns for vehicle info and payment method to accounting_records table
ALTER TABLE public.accounting_records 
ADD COLUMN IF NOT EXISTS vehicle_year text DEFAULT '2024',
ADD COLUMN IF NOT EXISTS vehicle_make text DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS vehicle_model text DEFAULT 'Vehicle',
ADD COLUMN IF NOT EXISTS vin text DEFAULT 'N/A',
ADD COLUMN IF NOT EXISTS stock_number text DEFAULT 'N/A',
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod';

-- Drop the old dispatch_status column since we're replacing it with payment_method
ALTER TABLE public.accounting_records DROP COLUMN IF EXISTS dispatch_status;