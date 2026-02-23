-- Create matching_requests table to track automatic driver matching
CREATE TABLE public.matching_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'pending_response', 'negotiating', 'completed', 'failed', 'cancelled')),
  initial_offer NUMERIC NOT NULL,
  pickup_latitude NUMERIC,
  pickup_longitude NUMERIC,
  search_radius_meters INTEGER NOT NULL DEFAULT 50000,
  current_courier_id UUID REFERENCES public.couriers(id),
  courier_notified_at TIMESTAMP WITH TIME ZONE,
  response_deadline TIMESTAMP WITH TIME ZONE,
  couriers_tried UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver_notifications table
CREATE TABLE public.driver_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matching_request_id UUID NOT NULL REFERENCES public.matching_requests(id) ON DELETE CASCADE,
  courier_id UUID NOT NULL REFERENCES public.couriers(id),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'declined', 'expired')),
  distance_meters NUMERIC,
  offer_amount NUMERIC NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.matching_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for matching_requests
CREATE POLICY "Allow public read matching_requests" ON public.matching_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert matching_requests" ON public.matching_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update matching_requests" ON public.matching_requests FOR UPDATE USING (true);

-- RLS policies for driver_notifications
CREATE POLICY "Allow public read driver_notifications" ON public.driver_notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert driver_notifications" ON public.driver_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update driver_notifications" ON public.driver_notifications FOR UPDATE USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_matching_requests_updated_at
BEFORE UPDATE ON public.matching_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for driver_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matching_requests;