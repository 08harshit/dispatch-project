-- Create shipment_documents table for storing courier-uploaded documents (invoices, BOL, etc.)
CREATE TABLE public.shipment_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  courier_id UUID REFERENCES public.couriers(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'bill_of_lading', 'proof_of_delivery', 'condition_report', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  notes TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'courier', -- 'courier' or 'shipper'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipment_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we don't have auth yet)
CREATE POLICY "Allow public read shipment_documents" 
ON public.shipment_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert shipment_documents" 
ON public.shipment_documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update shipment_documents" 
ON public.shipment_documents 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete shipment_documents" 
ON public.shipment_documents 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_shipment_documents_updated_at
BEFORE UPDATE ON public.shipment_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for shipment documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shipment-documents', 'shipment-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for shipment documents
CREATE POLICY "Allow public read shipment documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'shipment-documents');

CREATE POLICY "Allow public upload shipment documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'shipment-documents');

CREATE POLICY "Allow public delete shipment documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'shipment-documents');

-- Enable realtime for shipment_documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_documents;