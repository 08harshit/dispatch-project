import { apiGet, apiPost, apiDelete } from "./api";

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
  createdAt: string;
  updatedAt: string;
  courierName?: string;
}

export async function listShipmentDocuments(leadId: string): Promise<ShipmentDocument[]> {
  const res = await apiGet<ShipmentDocument[]>(`/loads/${leadId}/shipment-documents`);
  return (res.data ?? []).map((d) => ({
    ...d,
    createdAt: d.createdAt ?? (d as any).created_at,
    updatedAt: d.updatedAt ?? (d as any).updated_at,
  }));
}

export async function uploadShipmentDocument(
  leadId: string,
  params: {
    documentType: ShipmentDocument["documentType"];
    file: File;
    notes?: string;
    uploadedBy?: "courier" | "shipper";
  }
): Promise<ShipmentDocument> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(params.file);
  });

  const res = await apiPost<ShipmentDocument>(`/loads/${leadId}/shipment-documents`, {
    documentType: params.documentType,
    fileName: params.file.name,
    fileSize: params.file.size,
    mimeType: params.file.type,
    notes: params.notes ?? null,
    uploadedBy: params.uploadedBy ?? "shipper",
    data: base64,
  });

  if (!res.data) throw new Error(res.error ?? "Failed to upload document");
  return res.data;
}

export async function deleteShipmentDocument(leadId: string, docId: string): Promise<void> {
  await apiDelete(`/loads/${leadId}/shipment-documents/${docId}`);
}

export async function getDownloadUrl(leadId: string, docId: string): Promise<string> {
  const res = await apiGet<{ url: string }>(`/loads/${leadId}/shipment-documents/${docId}/download`);
  return res.data?.url ?? "";
}
