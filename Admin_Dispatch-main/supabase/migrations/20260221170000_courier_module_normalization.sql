-- ============================================================================
-- Courier Module Normalization Migration
-- ============================================================================
-- This migration:
-- 1. Adds missing columns to the existing `couriers` table
-- 2. Creates new normalized tables: courier_contacts, courier_insurance,
--    courier_trucks, courier_routes, courier_billing, courier_payout_settings
-- 3. Migrates existing denormalized data (trucks, insurance_company, equipment_type)
--    into the new tables before dropping those columns
-- ============================================================================

-- ==========================
-- ENUMS
-- ==========================

CREATE TYPE public.business_type AS ENUM ('llc', 'corporation', 'sole-proprietor', 'partnership');
CREATE TYPE public.timezone_type AS ENUM ('est', 'cst', 'mst', 'pst');
CREATE TYPE public.operating_status AS ENUM ('active', 'not-active');
CREATE TYPE public.mcs150_status AS ENUM ('current', 'expired', 'pending');
CREATE TYPE public.authority_status AS ENUM ('authorized', 'pending', 'revoked');
CREATE TYPE public.equipment_type AS ENUM (
  'Open Transport',
  'Enclosed Transport',
  'Flatbed',
  'Hotshot',
  'Multi-Car Carrier'
);


-- ==========================
-- 1. ALTER couriers TABLE — add missing columns from AddCourierForm
-- ==========================

ALTER TABLE public.couriers
  -- Link to Supabase auth (courier portal login)
  ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Company info (AddCourierForm.tsx: lines 19-29)
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN zip_code TEXT,
  ADD COLUMN business_type public.business_type,
  ADD COLUMN business_phone TEXT,
  ADD COLUMN fax TEXT,
  ADD COLUMN business_email TEXT,
  ADD COLUMN website TEXT,
  ADD COLUMN business_hours TEXT,
  ADD COLUMN timezone public.timezone_type,

  -- Compliance info (AddCourierForm.tsx: lines 36-43)
  ADD COLUMN usdot_link TEXT,
  ADD COLUMN mc_link TEXT,
  ADD COLUMN operating_status public.operating_status DEFAULT 'active',
  ADD COLUMN mcs150_status public.mcs150_status,
  ADD COLUMN out_of_service_date DATE,
  ADD COLUMN authority_status public.authority_status,

  -- Notification preferences (SetupPage.tsx: lines 86, 93, 100)
  ADD COLUMN notify_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN notify_sms BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN notify_late_delivery BOOLEAN NOT NULL DEFAULT true;


-- ==========================
-- 2. CREATE courier_contacts (1:N)
-- Source: AddCourierForm.tsx Contact tab, lines 30-35
-- ==========================

CREATE TABLE public.courier_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                -- contactName (line 30)
  position TEXT,                     -- contactPosition (line 31)
  phone TEXT,                        -- contactPhone (line 32)
  desk_phone TEXT,                   -- deskPhone (line 33)
  email TEXT,                        -- contactEmail (line 34)
  hours TEXT,                        -- contactHours (line 35)
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courier_contacts_courier_id ON public.courier_contacts(courier_id);


-- ==========================
-- 3. CREATE courier_insurance (1:N)
-- Source: AddCourierForm.tsx Compliance tab, lines 44-48
-- ==========================

CREATE TABLE public.courier_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  company_name TEXT,                 -- insuranceCompany (line 44)
  agent_name TEXT,                   -- insuranceAgent (line 45)
  agent_phone TEXT,                  -- insurancePhone (line 46)
  agent_email TEXT,                  -- insuranceEmail (line 47)
  physical_damage_limit TEXT,        -- physicalDamageLimit (line 48)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courier_insurance_courier_id ON public.courier_insurance(courier_id);


-- ==========================
-- 4. CREATE courier_trucks (1:N)
-- Source: AddCourierForm.tsx Equipment tab, lines 49-50
-- ==========================

CREATE TABLE public.courier_trucks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  equipment_type public.equipment_type NOT NULL,  -- equipmentType (line 50)
  count INTEGER NOT NULL DEFAULT 0,               -- numTrucks (line 49)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courier_trucks_courier_id ON public.courier_trucks(courier_id);


-- ==========================
-- 5. CREATE courier_routes (1:N)
-- Source: AddCourierForm.tsx Equipment tab, line 51
-- ==========================

CREATE TABLE public.courier_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,          -- routes (line 51, split from comma-separated textarea)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courier_routes_courier_id ON public.courier_routes(courier_id);


-- ==========================
-- 6. CREATE courier_billing (1:N)
-- Source: SetupPage.tsx, lines 141-165
-- ==========================

CREATE TABLE public.courier_billing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL REFERENCES public.couriers(id) ON DELETE CASCADE,
  cardholder_name TEXT,              -- card-name input (line 143)
  card_last4 TEXT,                   -- card-number input, store last 4 only (line 147)
  expiry TEXT,                       -- expiry input MM/YY (line 152)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courier_billing_courier_id ON public.courier_billing(courier_id);


-- ==========================
-- 7. CREATE courier_payout_settings (1:1)
-- Source: SetupPage.tsx, lines 180-201
-- ==========================

CREATE TABLE public.courier_payout_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  courier_id UUID NOT NULL UNIQUE REFERENCES public.couriers(id) ON DELETE CASCADE,
  bank_account_number TEXT,          -- payout-account input (line 182)
  routing_number TEXT,               -- routing input (line 186)
  auto_pay_on_delivery BOOLEAN NOT NULL DEFAULT true,   -- Switch (line 193)
  weekly_batch_payouts BOOLEAN NOT NULL DEFAULT false,   -- Switch (line 200)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ==========================
-- 8. MIGRATE existing denormalized data into new tables
-- ==========================

-- Migrate insurance_company → courier_insurance
INSERT INTO public.courier_insurance (courier_id, company_name)
SELECT id, insurance_company
FROM public.couriers
WHERE insurance_company IS NOT NULL AND insurance_company != '';

-- Migrate trucks + equipment_type → courier_trucks
INSERT INTO public.courier_trucks (courier_id, equipment_type, count)
SELECT id, equipment_type::public.equipment_type, COALESCE(trucks, 0)
FROM public.couriers
WHERE equipment_type IS NOT NULL AND equipment_type != '';

-- Add file_url column to existing courier_documents table (it was missing)
ALTER TABLE public.courier_documents
  ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add date column to courier_history (existing table uses created_at only)
-- The mock data has a separate date field; we keep created_at as the source of truth.
-- No alteration needed — courier_history already has created_at.


-- ==========================
-- 9. DROP migrated columns from couriers table
-- ==========================

ALTER TABLE public.couriers
  DROP COLUMN IF EXISTS trucks,
  DROP COLUMN IF EXISTS insurance_company,
  DROP COLUMN IF EXISTS equipment_type;


-- ==========================
-- 10. RENAME existing columns for consistency with form fields
-- ==========================

-- contact_email → business_email is handled by the new column added above.
-- The old contact_email can stay as a quick-reference email (used in Couriers.tsx listing).
-- No rename needed — they serve different purposes:
--   contact_email = displayed in courier listing card (Couriers.tsx:41)
--   business_email = from the AddCourierForm company tab (AddCourierForm.tsx:26)


-- ==========================
-- 11. ENABLE RLS on new tables
-- ==========================

ALTER TABLE public.courier_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_payout_settings ENABLE ROW LEVEL SECURITY;


-- ==========================
-- 12. RLS POLICIES — open access for now (matching existing pattern)
-- ==========================

CREATE POLICY "Allow all access to courier_contacts"
  ON public.courier_contacts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to courier_insurance"
  ON public.courier_insurance FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to courier_trucks"
  ON public.courier_trucks FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to courier_routes"
  ON public.courier_routes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to courier_billing"
  ON public.courier_billing FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to courier_payout_settings"
  ON public.courier_payout_settings FOR ALL USING (true) WITH CHECK (true);


-- ==========================
-- 13. TRIGGERS — updated_at for payout_settings
-- ==========================

CREATE TRIGGER update_courier_payout_settings_updated_at
  BEFORE UPDATE ON public.courier_payout_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
