import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchShippers,
    fetchShipperStats,
    createShipper,
    updateShipper,
    updateShipperStatus,
    deleteShipper,
    updateShipperCompliance,
    addShipperDocument,
    deleteShipperDocument,
    ShipperFilters,
    Shipper,
    CreateShipperPayload,
} from "../../services/shipperService";

// --- Query Keys ---
export const shipperKeys = {
    all: ["shippers"] as const,
    lists: () => [...shipperKeys.all, "list"] as const,
    list: (filters: ShipperFilters) =>
        [...shipperKeys.lists(), { filters }] as const,
    stats: () => [...shipperKeys.all, "stats"] as const,
};

// --- Queries ---

export function useShippersQuery(filters: ShipperFilters) {
    return useQuery({
        queryKey: shipperKeys.list(filters),
        queryFn: () => fetchShippers(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: (previousData) => previousData, // keep old data while refetching
    });
}

export function useShipperStatsQuery() {
    return useQuery({
        queryKey: shipperKeys.stats(),
        queryFn: fetchShipperStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

// --- Mutations with Zero-GET Cache Injection ---

export function useCreateShipperMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateShipperPayload) => createShipper(data),
        onSuccess: (newShipper) => {
            // Invalidate stats to trigger a refetch
            queryClient.invalidateQueries({ queryKey: shipperKeys.stats() });

            // Invalidate the lists to force a fresh fetch from the server
            queryClient.invalidateQueries({ queryKey: shipperKeys.lists() });

            // Optimistically inject the newly created shipper into ALL list cache arrays
            queryClient.setQueriesData<Shipper[]>(
                { queryKey: shipperKeys.lists() },
                (oldData) => {
                    if (!oldData) return [newShipper];
                    return [newShipper, ...oldData];
                }
            );
        },
    });
}

export function useUpdateShipperMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateShipperPayload> }) => updateShipper(id, data),
        onSuccess: (updatedShipper) => {
            queryClient.invalidateQueries({ queryKey: shipperKeys.stats() });

            // Update the entity inline inside the cache arrays
            queryClient.setQueriesData<Shipper[]>(
                { queryKey: shipperKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return oldData.map(shipper =>
                        shipper.id === updatedShipper.id ? updatedShipper : shipper
                    );
                }
            );
        },
    });
}

export function useToggleShipperStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) => updateShipperStatus(id, status),
        onSuccess: (updatedShipper) => {
            queryClient.invalidateQueries({ queryKey: shipperKeys.stats() });

            // Swap out the old entity for the fully updated one in local cache
            queryClient.setQueriesData<Shipper[]>(
                { queryKey: shipperKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return oldData.map(shipper =>
                        shipper.id === updatedShipper.id ? updatedShipper : shipper
                    );
                }
            );
        },
    });
}

export function useUpdateShipperComplianceMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, compliance }: { id: string; compliance: "compliant" | "non-compliant" }) =>
            updateShipperCompliance(id, compliance),
        onSuccess: (updatedShipper) => {
            queryClient.invalidateQueries({ queryKey: shipperKeys.stats() });

            queryClient.setQueriesData<Shipper[]>(
                { queryKey: shipperKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return oldData.map(shipper =>
                        shipper.id === updatedShipper.id ? updatedShipper : shipper
                    );
                }
            );
        },
    });
}

export function useDeleteShipperMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteShipper(id),
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: shipperKeys.stats() });

            // Filter out the deleted shipper directly from the cache
            queryClient.setQueriesData<Shipper[]>(
                { queryKey: shipperKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return oldData.filter(shipper => shipper.id !== deletedId);
                }
            );
        },
    });
}

export function useAddShipperDocumentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ shipperId, meta }: { shipperId: string; meta: { name: string; type: string; date?: string } }) =>
            addShipperDocument(shipperId, meta),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shipperKeys.lists() });
        },
    });
}

export function useDeleteShipperDocumentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ shipperId, docId }: { shipperId: string; docId: string }) =>
            deleteShipperDocument(shipperId, docId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: shipperKeys.lists() });
        },
    });
}
