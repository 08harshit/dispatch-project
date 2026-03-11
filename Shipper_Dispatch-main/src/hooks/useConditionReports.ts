import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConditionReport } from "@/types/conditionReport";
import { toast } from "sonner";
import * as conditionReportService from "@/services/conditionReportService";

export const useConditionReports = (params?: { leadId?: string; vehicleId?: string }) => {
  return useQuery({
    queryKey: ["condition-reports", params?.leadId, params?.vehicleId],
    queryFn: () => conditionReportService.listConditionReports(params),
  });
};

export const useConditionReport = (vehicleId: string) => {
  return useQuery({
    queryKey: ["condition-report", vehicleId],
    queryFn: () => conditionReportService.getConditionReportByVehicle(vehicleId),
    enabled: !!vehicleId,
  });
};

export const useSaveConditionReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: ConditionReport) => {
      try {
        if (report.id) {
          return await conditionReportService.updateConditionReport(report);
        }
      } catch {
        // 404 or other - fall through to create
      }
      const { id, createdAt, updatedAt, ...rest } = report;
      return conditionReportService.createConditionReport(rest);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["condition-reports"] });
      queryClient.invalidateQueries({ queryKey: ["condition-report", data.vehicleId] });
      toast.success("Condition report saved successfully");
    },
    onError: () => {
      toast.error("Failed to save condition report");
    },
  });
};

export const useDeleteConditionReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reportId: string) => conditionReportService.deleteConditionReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["condition-reports"] });
      toast.success("Condition report deleted");
    },
    onError: () => {
      toast.error("Failed to delete condition report");
    },
  });
};

export const useUploadConditionReportPdf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      conditionReportService.uploadConditionReportPdf(id, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["condition-reports"] });
      queryClient.invalidateQueries({ queryKey: ["condition-report", data.vehicleId] });
      toast.success("PDF uploaded successfully");
    },
    onError: () => {
      toast.error("Failed to upload PDF");
    },
  });
};
