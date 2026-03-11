-- Prevent duplicate vehicles: same courier cannot have two vehicles with the same registration number.
-- Backend trims reg_no before insert; constraint enforces uniqueness per courier.
ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_courier_reg_no_unique UNIQUE (courier_id, reg_no);
