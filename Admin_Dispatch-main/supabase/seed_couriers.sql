-- ============================================================================
-- Seed Data for Normalized Courier Module
-- ============================================================================
-- This script inserts 3 sample couriers with all their normalized data
-- (contacts, insurance, trucks, routes, and history).
-- You can run this directly in the Supabase SQL Editor.
-- ============================================================================

-- Use specific UUIDs so we can easily link the related records
WITH courier_1 AS (
  INSERT INTO public.couriers (
    id, name, city, state, zip_code, business_type, business_phone, 
    business_email, contact_email, phone, usdot, mc, compliance, 
    status, is_new
  ) VALUES (
    '11111111-1111-1111-1111-111111111111', 'Express Logistics LLC', 'Chicago', 'IL', '60601', 'llc', '(555) 123-4567', 
    'info@express.com', 'john@express.com', '(555) 123-4567', '1234567', 'MC-123456', 'compliant', 
    'active', false
  )
  RETURNING id
),
courier_2 AS (
  INSERT INTO public.couriers (
    id, name, city, state, zip_code, business_type, business_phone, 
    business_email, contact_email, phone, usdot, mc, compliance, 
    status, is_new
  ) VALUES (
    '22222222-2222-2222-2222-222222222222', 'Swift Delivery Co', 'Detroit', 'MI', '48201', 'corporation', '(555) 234-5678', 
    'operations@swift.com', 'sarah@swift.com', '(555) 234-5678', '2345678', 'MC-234567', 'non-compliant', 
    'active', true
  )
  RETURNING id
),
courier_3 AS (
  INSERT INTO public.couriers (
    id, name, city, state, zip_code, business_type, business_phone, 
    business_email, contact_email, phone, usdot, mc, compliance, 
    status, is_new
  ) VALUES (
    '33333333-3333-3333-3333-333333333333', 'FastTrack Transport', 'Miami', 'FL', '33101', 'llc', '(555) 456-7890', 
    'admin@fasttrack.com', 'lisa@fasttrack.com', '(555) 456-7890', '4567890', 'MC-456789', 'compliant', 
    'inactive', false
  )
  RETURNING id
)

-- Now insert the related data using the exact same UUIDs

-- 1. Contacts
INSERT INTO public.courier_contacts (courier_id, name, position, phone, email, is_primary)
VALUES 
('11111111-1111-1111-1111-111111111111', 'John Doe', 'Operations Manager', '(555) 123-4567', 'john@express.com', true),
('22222222-2222-2222-2222-222222222222', 'Sarah Smith', 'Owner', '(555) 234-5678', 'sarah@swift.com', true),
('33333333-3333-3333-3333-333333333333', 'Lisa Wong', 'Dispatcher', '(555) 456-7890', 'lisa@fasttrack.com', true);

-- 2. Insurance
INSERT INTO public.courier_insurance (courier_id, company_name, agent_name, agent_phone, physical_damage_limit)
VALUES 
('11111111-1111-1111-1111-111111111111', 'SafeGuard Insurance', 'Mike Protection', '(800) 555-0100', '$1,000,000'),
('22222222-2222-2222-2222-222222222222', 'TruckSafe Insurance', 'Jane Risk', '(800) 555-0200', '$750,000'),
('33333333-3333-3333-3333-333333333333', 'Florida Carrier Insurance', 'David Cover', '(800) 555-0300', '$500,000');

-- 3. Trucks
INSERT INTO public.courier_trucks (courier_id, equipment_type, count)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Enclosed Transport', 8),
('11111111-1111-1111-1111-111111111111', 'Open Transport', 4),
('22222222-2222-2222-2222-222222222222', 'Open Transport', 8),
('33333333-3333-3333-3333-333333333333', 'Flatbed', 5);

-- 4. Routes
INSERT INTO public.courier_routes (courier_id, route_name)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Midwest'),
('11111111-1111-1111-1111-111111111111', 'East Coast'),
('22222222-2222-2222-2222-222222222222', 'Nationwide'),
('33333333-3333-3333-3333-333333333333', 'Southeast'),
('33333333-3333-3333-3333-333333333333', 'Florida Local');

-- 5. History Logs
INSERT INTO public.courier_history (courier_id, action)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Account created'),
('11111111-1111-1111-1111-111111111111', 'Compliance verified'),
('22222222-2222-2222-2222-222222222222', 'Account created'),
('22222222-2222-2222-2222-222222222222', 'Insurance expired - needs renewal'),
('33333333-3333-3333-3333-333333333333', 'Account created'),
('33333333-3333-3333-3333-333333333333', 'Account deactivated');

-- 6. Documents (mocked records, no actual files)
INSERT INTO public.courier_documents (courier_id, name, type)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Insurance Certificate', 'PDF'),
('11111111-1111-1111-1111-111111111111', 'USDOT Registration', 'PDF'),
('22222222-2222-2222-2222-222222222222', 'Insurance Certificate (Expired)', 'PDF');
