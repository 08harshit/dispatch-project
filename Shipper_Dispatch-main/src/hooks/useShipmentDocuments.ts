import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import * as shipmentDocumentService from "@/services/shipmentDocumentService";

export interface ShipmentDocument {
  id: string;
  leadId: string;
  courierId: string | null;
  documentType: "invoice" | "bill_of_lading" | "proof_of_delivery" | "condition_report" | "other";
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  notes: string | null;
  uploadedBy: "courier" | "shipper";
  createdAt: Date;
  updatedAt: Date;
  courierName?: string;
}

type DocumentType = ShipmentDocument["documentType"];

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  invoice: "Invoice",
  bill_of_lading: "Bill of Lading",
  proof_of_delivery: "Proof of Delivery",
  condition_report: "Condition Report",
  other: "Other",
};

export const getDocumentTypeLabel = (type: DocumentType): string => {
  return DOCUMENT_TYPE_LABELS[type] || type;
};

function toFrontendFormat(d: shipmentDocumentService.ShipmentDocument): ShipmentDocument {
  return {
    ...d,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}

export function useShipmentDocuments(leadId: string | null) {
  return useQuery({
    queryKey: ["shipment-documents", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const data = await shipmentDocumentService.listShipmentDocuments(leadId);
      return data.map(toFrontendFormat);
    },
    enabled: !!leadId,
  });
}

export function useAllShipmentDocuments() {
  return useQuery({
    queryKey: ["shipment-documents-all"],
    queryFn: async () => [],
  });
}

export function useUploadShipmentDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      leadId,
      documentType,
      file,
      notes,
      uploadedBy = "shipper",
    }: {
      leadId: string;
      documentType: DocumentType;
      file: File;
      notes?: string;
      uploadedBy?: "courier" | "shipper";
    }) => {
      const data = await shipmentDocumentService.uploadShipmentDocument(leadId, {
        documentType,
        file,
        notes,
        uploadedBy,
      });
      return toFrontendFormat(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipment-documents", variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ["shipment-documents-all"] });
      toast({ title: "Document uploaded", description: "The document has been uploaded successfully." });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteShipmentDocument() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ leadId, docId }: { leadId: string; docId: string }) => {
      await shipmentDocumentService.deleteShipmentDocument(leadId, docId);
      return { leadId, docId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["shipment-documents", result.leadId] });
      queryClient.invalidateQueries({ queryKey: ["shipment-documents-all"] });
      toast({ title: "Document deleted", description: "The document has been removed." });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete document",
        variant: "destructive",
      });
    },
  });
}
