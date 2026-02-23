-- Create load_notifications table for real-time sync between shipper and courier apps
CREATE TABLE public.load_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shipper_name TEXT NOT NULL,
  shipper_company TEXT,
  shipper_rating NUMERIC(3,2) DEFAULT 5.0,
  shipper_total_loads INTEGER DEFAULT 0,
  shipper_phone TEXT,
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  pickup_state TEXT NOT NULL,
  pickup_coordinates NUMERIC[] NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TEXT NOT NULL,
  
  -- Delivery details
  delivery_address TEXT NOT NULL,
  delivery_city TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_coordinates NUMERIC[] NOT NULL,
  delivery_date DATE NOT NULL,
  delivery_time TEXT NOT NULL,
  
  -- Vehicle details
  vehicle_year INTEGER NOT NULL,
  vehicle_make TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  
  -- Pricing and distance
  price NUMERIC(10,2) NOT NULL,
  distance NUMERIC(10,2) NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'counter_offered')),
  assigned_courier_id UUID REFERENCES auth.users(id),
  
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create load_offers table for counter-offers and negotiations
CREATE TABLE public.load_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.load_notifications(id) ON DELETE CASCADE NOT NULL,
  courier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_price NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'countered')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.load_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.load_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for load_notifications
-- All authenticated users can view pending notifications
CREATE POLICY "Anyone can view pending notifications" 
ON public.load_notifications 
FOR SELECT 
TO authenticated
USING (status = 'pending' OR shipper_id = auth.uid() OR assigned_courier_id = auth.uid());

-- Shippers can create notifications
CREATE POLICY "Shippers can create notifications" 
ON public.load_notifications 
FOR INSERT 
TO authenticated
WITH CHECK (shipper_id = auth.uid());

-- Shippers can update their own notifications
CREATE POLICY "Shippers can update own notifications" 
ON public.load_notifications 
FOR UPDATE 
TO authenticated
USING (shipper_id = auth.uid());

-- RLS Policies for load_offers
-- Couriers and shippers can view offers on relevant notifications
CREATE POLICY "Users can view relevant offers" 
ON public.load_offers 
FOR SELECT 
TO authenticated
USING (
  courier_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.load_notifications 
    WHERE id = notification_id AND shipper_id = auth.uid()
  )
);

-- Couriers can create offers
CREATE POLICY "Couriers can create offers" 
ON public.load_offers 
FOR INSERT 
TO authenticated
WITH CHECK (courier_id = auth.uid());

-- Users can update their own offers or offers on their notifications
CREATE POLICY "Users can update relevant offers" 
ON public.load_offers 
FOR UPDATE 
TO authenticated
USING (
  courier_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.load_notifications 
    WHERE id = notification_id AND shipper_id = auth.uid()
  )
);

-- Enable realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.load_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.load_offers;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_load_notifications_updated_at
BEFORE UPDATE ON public.load_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_load_offers_updated_at
BEFORE UPDATE ON public.load_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();