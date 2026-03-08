import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchCouriers,
    fetchCourierStats,
    createCourier,
    updateCourier,
    toggleCourierStatus,
    deleteCourier,
    updateCourierCompliance,
    CourierFilters,
    CourierListItem,
    PaginatedCouriersResponse
} from "../../services/courierService";

// --- Query Keys ---
export const courierKeys = {
    all: ["couriers"] as const,
    lists: () => [...courierKeys.all, "list"] as const,
    list: (filters: CourierFilters, page?: number, limit?: number) =>
        [...courierKeys.lists(), { filters, page, limit }] as const,
    stats: () => [...courierKeys.all, "stats"] as const,
};

// --- Queries ---

export function useCouriersQuery(filters: CourierFilters, page?: number, limit?: number) {
    return useQuery({
        queryKey: courierKeys.list(filters, page, limit),
        queryFn: () => fetchCouriers(filters, page, limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
    });
}

export function useCourierStatsQuery() {
    return useQuery({
        queryKey: courierKeys.stats(),
        queryFn: fetchCourierStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// --- Mutations with Zero-GET Cache Injection ---

export function useCreateCourierMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Record<string, string>) => createCourier(data),
        onSuccess: (newCourier) => {
            // Invalidate stats to trigger a refetch
            queryClient.invalidateQueries({ queryKey: courierKeys.stats() });

            // Optimistically inject the newly created courier into current paginated lists
            queryClient.setQueriesData<PaginatedCouriersResponse>(
                { queryKey: courierKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: [newCourier, ...oldData.data],
                        pagination: {
                            ...oldData.pagination,
                            total: oldData.pagination.total + 1,
                        }
                    };
                }
            );
        },
    });
}

export function useUpdateCourierMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) => updateCourier(id, data),
        onSuccess: (updatedCourier) => {
            // Update the entity inline inside the cache arrays
            queryClient.setQueriesData<PaginatedCouriersResponse>(
                { queryKey: courierKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.map(courier =>
                            courier.id === updatedCourier.id ? updatedCourier : courier
                        ),
                    };
                }
            );
        },
    });
}

export function useToggleCourierStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => toggleCourierStatus(id),
        onMutate: async (id) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: courierKeys.lists() });

            // Snapshot the previous value
            const previousCouriers = queryClient.getQueriesData<PaginatedCouriersResponse>({ queryKey: courierKeys.lists() });

            // Optimistically update to the new value
            queryClient.setQueriesData<PaginatedCouriersResponse>(
                { queryKey: courierKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.map(courier => {
                            if (courier.id === id) {
                                return { ...courier, status: courier.status === "active" ? "inactive" : "active" };
                            }
                            return courier;
                        }),
                    };
                }
            );

            // Return a context object with the snapshotted value
            return { previousCouriers };
        },
        onError: (_err, _id, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousCouriers) {
                context.previousCouriers.forEach(([queryKey, data]) => {
                    queryClient.setQueryData(queryKey, data);
                });
            }
        },
        onSettled: () => {
            // Sync backend stats whether success or error
            queryClient.invalidateQueries({ queryKey: courierKeys.stats() });
        },
    });
}

export function useUpdateCourierComplianceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, compliance }: { id: string; compliance: "compliant" | "non-compliant" }) =>
            updateCourierCompliance(id, compliance),
        onSuccess: (updatedCourier) => {
            queryClient.invalidateQueries({ queryKey: courierKeys.stats() });

            queryClient.setQueriesData<PaginatedCouriersResponse>(
                { queryKey: courierKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.map(courier =>
                            courier.id === updatedCourier.id ? updatedCourier : courier
                        ),
                    };
                }
            );
        },
    });
}

export function useDeleteCourierMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteCourier(id),
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: courierKeys.stats() });

            // Filter out the deleted courier directly from the cache
            queryClient.setQueriesData<PaginatedCouriersResponse>(
                { queryKey: courierKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.filter(courier => courier.id !== deletedId),
                        pagination: {
                            ...oldData.pagination,
                            total: Math.max(0, oldData.pagination.total - 1),
                        }
                    };
                }
            );
        },
    });
}
