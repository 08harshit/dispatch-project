import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchLoads,
    fetchLoadStats,
    createLoad,
    updateLoad,
    updateLoadStatus,
    deleteLoad,
    addLoadDocumentMeta,
    deleteLoadDocument,
    LoadFilters,
    Load,
    CreateLoadPayload,
    UpdateLoadPayload,
    PaginatedLoadsResponse
} from "../../services/loadService";

// --- Query Keys ---
export const loadKeys = {
    all: ["loads"] as const,
    lists: () => [...loadKeys.all, "list"] as const,
    list: (filters: LoadFilters, page?: number, limit?: number) =>
        [...loadKeys.lists(), { filters, page, limit }] as const,
    stats: () => [...loadKeys.all, "stats"] as const,
};

// --- Queries ---

export function useLoadsQuery(filters: LoadFilters, page?: number, limit?: number) {
    return useQuery({
        queryKey: loadKeys.list(filters, page, limit),
        queryFn: () => fetchLoads(filters, page, limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
        placeholderData: (previousData) => previousData, // keep old data while refetching
    });
}

export function useLoadStatsQuery() {
    return useQuery({
        queryKey: loadKeys.stats(),
        queryFn: fetchLoadStats,
        staleTime: 5 * 60 * 1000,
    });
}

// --- Mutations with Zero-GET Cache Injection ---

export function useCreateLoadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateLoadPayload) => createLoad(data),
        onSuccess: (newLoad) => {
            queryClient.invalidateQueries({ queryKey: loadKeys.stats() });

            // Invalidate the lists to force a fresh fetch from the server
            queryClient.invalidateQueries({ queryKey: loadKeys.lists() });

            // Optimistically inject the newly created load into ALL list cache arrays
            queryClient.setQueriesData<PaginatedLoadsResponse | undefined>(
                { queryKey: loadKeys.lists() },
                (oldData) => {
                    if (!oldData || !oldData.data) return oldData;
                    return {
                        ...oldData,
                        data: [newLoad, ...oldData.data]
                    };
                }
            );
        },
    });
}

export function useUpdateLoadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateLoadPayload }) => updateLoad(id, data),
        onSuccess: (updatedLoad) => {
            queryClient.invalidateQueries({ queryKey: loadKeys.stats() });

            // Update the entity inline inside the cache arrays
            queryClient.setQueriesData<PaginatedLoadsResponse | undefined>(
                { queryKey: loadKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.map(load =>
                            load.id === updatedLoad.id ? updatedLoad : load
                        )
                    };
                }
            );
        },
    });
}

export function useUpdateLoadStatusMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateLoadStatus(id, status),
        onSuccess: (updatedLoad) => {
            queryClient.invalidateQueries({ queryKey: loadKeys.stats() });

            // Swap out the old entity for the fully updated one in local cache
            queryClient.setQueriesData<PaginatedLoadsResponse | undefined>(
                { queryKey: loadKeys.lists() },
                (oldData) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.map(load =>
                            load.id === updatedLoad.id ? updatedLoad : load
                        )
                    };
                }
            );
        },
    });
}

export function useDeleteLoadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => deleteLoad(id),
        onSuccess: (_, deletedId) => {
            queryClient.invalidateQueries({ queryKey: loadKeys.stats() });

            // Since it's a soft delete, we'll update the status to cancelled 
            // OR fully remove depending on the UI (assuming fully remove from default view or update status)
            // Let's just invalidate for full consistency
            queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
        },
    });
}

export function useAddLoadDocumentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ loadId, meta }: { loadId: string; meta: { name: string; type: string; date?: string } }) =>
            addLoadDocumentMeta(loadId, meta.name, meta.type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
        },
    });
}

export function useDeleteLoadDocumentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ loadId, docId }: { loadId: string; docId: string }) =>
            deleteLoadDocument(loadId, docId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: loadKeys.lists() });
        },
    });
}
