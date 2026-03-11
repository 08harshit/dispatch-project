import { apiGet, apiPost, apiPatch, apiDelete } from "./api";
import type { ConditionReport } from "@/types/conditionReport";

function toApiFormat(report: ConditionReport): Record<string, unknown> {
  return {
    vehicleId: report.vehicleId,
    leadId: (report as any).leadId,
    runsAndDrives: report.runsAndDrives,
    starts: report.starts,
    notDrivable: report.notDrivable,
    noStructuralDamage: report.noStructuralDamage,
    priorPaint: report.priorPaint,
    tiresCondition: report.tiresCondition,
    clean: report.clean,
    otherOdor: report.otherOdor,
    smokeOdor: report.smokeOdor,
    keysAvailable: report.keysAvailable,
    keyFobs: report.keyFobs,
    invoiceAvailable: report.invoiceAvailable,
    mileage: report.mileage,
    announcements: report.announcements,
    highValueOptions: report.highValueOptions,
    exteriorDamageItems: report.exteriorDamageItems,
    interiorDamageItems: report.interiorDamageItems,
    mechanicalIssues: report.mechanicalIssues,
    structuralIssues: report.structuralIssues,
    vehicleHistory: report.vehicleHistory,
    vehicleDetails: report.vehicleDetails,
    tiresWheels: report.tiresWheels,
    exteriorChecklist: report.exteriorChecklist,
    underVehicle: report.underVehicle,
    underHood: report.underHood,
    brakesTires: report.brakesTires,
    damageAreas: report.damageAreas,
    conditionNotes: report.conditionNotes,
    mechanicComments: report.mechanicComments,
    estimatedRepairCost: report.estimatedRepairCost,
    photos: report.photos,
    pdfReportUrl: report.pdfReportUrl,
  };
}

function fromApiFormat(row: any): ConditionReport {
  return {
    id: row.id,
    vehicleId: row.vehicleId,
    runsAndDrives: row.runsAndDrives ?? "unknown",
    starts: row.starts ?? false,
    notDrivable: row.notDrivable ?? false,
    noStructuralDamage: row.noStructuralDamage ?? true,
    priorPaint: row.priorPaint ?? false,
    tiresCondition: row.tiresCondition ?? "good",
    clean: row.clean ?? true,
    otherOdor: row.otherOdor ?? false,
    smokeOdor: row.smokeOdor ?? false,
    keysAvailable: row.keysAvailable ?? true,
    keyFobs: row.keyFobs ?? 1,
    invoiceAvailable: row.invoiceAvailable ?? false,
    mileage: row.mileage ?? "",
    announcements: row.announcements ?? [],
    highValueOptions: row.highValueOptions ?? [],
    exteriorDamageItems: row.exteriorDamageItems ?? [],
    interiorDamageItems: row.interiorDamageItems ?? [],
    mechanicalIssues: row.mechanicalIssues ?? [],
    structuralIssues: row.structuralIssues ?? [],
    vehicleHistory: row.vehicleHistory ?? {},
    vehicleDetails: row.vehicleDetails ?? {},
    tiresWheels: row.tiresWheels ?? {},
    exteriorChecklist: row.exteriorChecklist ?? {},
    underVehicle: row.underVehicle ?? {},
    underHood: row.underHood ?? {},
    brakesTires: row.brakesTires ?? {},
    damageAreas: row.damageAreas ?? {},
    conditionNotes: row.conditionNotes ?? "",
    mechanicComments: row.mechanicComments ?? "",
    estimatedRepairCost: row.estimatedRepairCost ?? "",
    photos: row.photos ?? [],
    pdfReportUrl: row.pdfReportUrl,
    createdAt: new Date(row.createdAt ?? row.created_at),
    updatedAt: new Date(row.updatedAt ?? row.updated_at),
  };
}

export async function listConditionReports(params?: { leadId?: string; vehicleId?: string }): Promise<ConditionReport[]> {
  const search = new URLSearchParams();
  if (params?.leadId) search.set("lead_id", params.leadId);
  if (params?.vehicleId) search.set("vehicle_id", params.vehicleId);
  const qs = search.toString();
  const path = `/condition-reports${qs ? `?${qs}` : ""}`;
  const res = await apiGet<any[]>(path);
  return (res.data ?? []).map(fromApiFormat);
}

export async function getConditionReport(id: string): Promise<ConditionReport | null> {
  const res = await apiGet<any>(`/condition-reports/${id}`);
  return res.data ? fromApiFormat(res.data) : null;
}

export async function getConditionReportByVehicle(vehicleId: string): Promise<ConditionReport | null> {
  const reports = await listConditionReports({ vehicleId });
  return reports[0] ?? null;
}

export async function createConditionReport(report: Omit<ConditionReport, "id" | "createdAt" | "updatedAt">): Promise<ConditionReport> {
  const payload = toApiFormat(report as ConditionReport);
  delete payload.id;
  const res = await apiPost<any>("/condition-reports", payload);
  if (!res.data) throw new Error(res.error ?? "Failed to create report");
  return fromApiFormat(res.data);
}

export async function updateConditionReport(report: ConditionReport): Promise<ConditionReport> {
  const res = await apiPatch<any>(`/condition-reports/${report.id}`, toApiFormat(report));
  if (!res.data) throw new Error(res.error ?? "Failed to update report");
  return fromApiFormat(res.data);
}

export async function deleteConditionReport(id: string): Promise<void> {
  await apiDelete(`/condition-reports/${id}`);
}

export async function uploadConditionReportPdf(id: string, file: File): Promise<ConditionReport> {
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const res = await apiPost<any>(`/condition-reports/${id}/upload-pdf`, { data: base64 });
  if (!res.data) throw new Error(res.error ?? "Failed to upload PDF");
  return fromApiFormat(res.data);
}
