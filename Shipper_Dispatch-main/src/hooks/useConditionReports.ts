import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConditionReport } from "@/types/conditionReport";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// Convert frontend ConditionReport to database format
const toDbFormat = (report: ConditionReport) => ({
  id: report.id,
  vehicle_id: report.vehicleId,
  runs_and_drives: report.runsAndDrives,
  starts: report.starts,
  not_drivable: report.notDrivable,
  no_structural_damage: report.noStructuralDamage,
  prior_paint: report.priorPaint,
  tires_condition: report.tiresCondition,
  clean: report.clean,
  other_odor: report.otherOdor,
  smoke_odor: report.smokeOdor,
  keys_available: report.keysAvailable,
  key_fobs: report.keyFobs,
  invoice_available: report.invoiceAvailable,
  mileage: report.mileage,
  announcements: report.announcements as unknown as Json,
  high_value_options: report.highValueOptions as unknown as Json,
  exterior_damage_items: report.exteriorDamageItems as unknown as Json,
  interior_damage_items: report.interiorDamageItems as unknown as Json,
  mechanical_issues: report.mechanicalIssues as unknown as Json,
  structural_issues: report.structuralIssues as unknown as Json,
  vehicle_history: report.vehicleHistory as unknown as Json,
  vehicle_details: report.vehicleDetails as unknown as Json,
  tires_wheels: report.tiresWheels as unknown as Json,
  exterior_checklist: report.exteriorChecklist as unknown as Json,
  under_vehicle: report.underVehicle as unknown as Json,
  under_hood: report.underHood as unknown as Json,
  brakes_tires: report.brakesTires as unknown as Json,
  damage_areas: report.damageAreas as unknown as Json,
  condition_notes: report.conditionNotes,
  mechanic_comments: report.mechanicComments,
  estimated_repair_cost: report.estimatedRepairCost,
  photos: report.photos as unknown as Json,
  pdf_report_url: report.pdfReportUrl,
});

// Convert database format to frontend ConditionReport
const fromDbFormat = (row: any): ConditionReport => ({
  id: row.id,
  vehicleId: row.vehicle_id,
  runsAndDrives: row.runs_and_drives,
  starts: row.starts,
  notDrivable: row.not_drivable,
  noStructuralDamage: row.no_structural_damage,
  priorPaint: row.prior_paint,
  tiresCondition: row.tires_condition,
  clean: row.clean,
  otherOdor: row.other_odor,
  smokeOdor: row.smoke_odor,
  keysAvailable: row.keys_available,
  keyFobs: row.key_fobs,
  invoiceAvailable: row.invoice_available,
  mileage: row.mileage || '',
  announcements: row.announcements || [],
  highValueOptions: row.high_value_options || [],
  exteriorDamageItems: row.exterior_damage_items || [],
  interiorDamageItems: row.interior_damage_items || [],
  mechanicalIssues: row.mechanical_issues || [],
  structuralIssues: row.structural_issues || [],
  vehicleHistory: row.vehicle_history || {},
  vehicleDetails: row.vehicle_details || {},
  tiresWheels: row.tires_wheels || {},
  exteriorChecklist: row.exterior_checklist || {},
  underVehicle: row.under_vehicle || {},
  underHood: row.under_hood || {},
  brakesTires: row.brakes_tires || {},
  damageAreas: row.damage_areas || {},
  conditionNotes: row.condition_notes || '',
  mechanicComments: row.mechanic_comments || '',
  estimatedRepairCost: row.estimated_repair_cost || '',
  photos: row.photos || [],
  pdfReportUrl: row.pdf_report_url,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const useConditionReports = () => {
  return useQuery({
    queryKey: ["condition-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condition_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map(fromDbFormat);
    },
  });
};

export const useConditionReport = (vehicleId: string) => {
  return useQuery({
    queryKey: ["condition-report", vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("condition_reports")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .maybeSingle();

      if (error) throw error;
      return data ? fromDbFormat(data) : null;
    },
    enabled: !!vehicleId,
  });
};

export const useSaveConditionReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: ConditionReport) => {
      const dbData = toDbFormat(report);
      
      // Check if report exists
      const { data: existing } = await supabase
        .from("condition_reports")
        .select("id")
        .eq("id", report.id)
        .maybeSingle();

      if (existing) {
        // Update existing report
        const { data, error } = await supabase
          .from("condition_reports")
          .update(dbData)
          .eq("id", report.id)
          .select()
          .single();

        if (error) throw error;
        return fromDbFormat(data);
      } else {
        // Insert new report
        const { data, error } = await supabase
          .from("condition_reports")
          .insert(dbData)
          .select()
          .single();

        if (error) throw error;
        return fromDbFormat(data);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["condition-reports"] });
      queryClient.invalidateQueries({ queryKey: ["condition-report", data.vehicleId] });
      toast.success("Condition report saved successfully");
    },
    onError: (error) => {
      console.error("Error saving condition report:", error);
      toast.error("Failed to save condition report");
    },
  });
};

export const useDeleteConditionReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("condition_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condition-reports"] });
      toast.success("Condition report deleted");
    },
    onError: (error) => {
      console.error("Error deleting condition report:", error);
      toast.error("Failed to delete condition report");
    },
  });
};
