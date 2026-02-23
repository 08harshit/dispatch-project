import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ShipmentDocument {
  id: string;
  leadId: string;
  courierId: string | null;
  documentType: 'invoice' | 'bill_of_lading' | 'proof_of_delivery' | 'condition_report' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  notes: string | null;
  uploadedBy: 'courier' | 'shipper';
  createdAt: Date;
  updatedAt: Date;
  // Joined data
  courierName?: string;
}

type DocumentType = ShipmentDocument['documentType'];

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: 'Invoice',
  bill_of_lading: 'Bill of Lading',
  proof_of_delivery: 'Proof of Delivery',
  condition_report: 'Condition Report',
  other: 'Other',
};

export const getDocumentTypeLabel = (type: DocumentType): string => {
  return DOCUMENT_TYPE_LABELS[type] || type;
};

// Convert database row to frontend format
const toFrontendFormat = (row: any): ShipmentDocument => ({
  id: row.id,
  leadId: row.lead_id,
  courierId: row.courier_id,
  documentType: row.document_type,
  fileName: row.file_name,
  fileUrl: row.file_url,
  fileSize: row.file_size,
  mimeType: row.mime_type,
  notes: row.notes,
  uploadedBy: row.uploaded_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  courierName: row.couriers?.name,
});

// Fetch documents for a specific lead
export function useShipmentDocuments(leadId: string | null) {
  return useQuery({
    queryKey: ['shipment-documents', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      const { data, error } = await supabase
        .from('shipment_documents')
        .select(`
          *,
          couriers (name)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toFrontendFormat);
    },
    enabled: !!leadId,
  });
}

// Fetch all documents (for dashboard overview)
export function useAllShipmentDocuments() {
  return useQuery({
    queryKey: ['shipment-documents-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipment_documents')
        .select(`
          *,
          couriers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(toFrontendFormat);
    },
  });
}

// Upload a document
export function useUploadShipmentDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      leadId,
      courierId,
      documentType,
      file,
      notes,
      uploadedBy = 'shipper',
    }: {
      leadId: string;
      courierId?: string;
      documentType: DocumentType;
      file: File;
      notes?: string;
      uploadedBy?: 'courier' | 'shipper';
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${leadId}/${documentType}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('shipment-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('shipment-documents')
        .getPublicUrl(fileName);

      // Insert document record
      const { data, error } = await supabase
        .from('shipment_documents')
        .insert({
          lead_id: leadId,
          courier_id: courierId || null,
          document_type: documentType,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          notes: notes || null,
          uploaded_by: uploadedBy,
        })
        .select()
        .single();

      if (error) throw error;
      return toFrontendFormat(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shipment-documents', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-documents-all'] });
      toast({
        title: 'Document uploaded',
        description: 'The document has been uploaded successfully.',
      });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    },
  });
}

// Delete a document
export function useDeleteShipmentDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, leadId, fileUrl }: { id: string; leadId: string; fileUrl: string }) => {
      // Extract file path from URL
      const urlParts = fileUrl.split('/shipment-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('shipment-documents').remove([filePath]);
      }

      // Delete record
      const { error } = await supabase
        .from('shipment_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, leadId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shipment-documents', result.leadId] });
      queryClient.invalidateQueries({ queryKey: ['shipment-documents-all'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.',
      });
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });
}
