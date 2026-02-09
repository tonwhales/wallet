import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { readPublicProfile, PublicProfileValues } from '../../api/publicProfile';

export interface UsePublicProfileResult {
    avatar: number | null;
    backgroundColor: string | null;
    isLoading: boolean;
    error: Error | null;
}

/**
 * Hook to fetch a public profile by address
 * Returns avatar hash and background color if profile exists
 */
export function usePublicProfile(address: string | null | undefined): UsePublicProfileResult {
    const query = useQuery({
        queryKey: Queries.PublicProfile(address ?? ''),
        queryFn: async () => {
            if (!address) {
                return null;
            }
            return readPublicProfile(address);
        },
        enabled: !!address,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000,
        retry: 1
    });

    return {
        avatar: query.data?.values?.avatar ?? null,
        backgroundColor: query.data?.values?.backgroundColor ?? null,
        isLoading: query.isLoading,
        error: query.error as Error | null
    };
}

/**
 * Hook to get full public profile data including all addresses
 */
export function usePublicProfileFull(address: string | null | undefined) {
    return useQuery({
        queryKey: Queries.PublicProfile(address ?? ''),
        queryFn: async () => {
            if (!address) {
                return null;
            }
            return readPublicProfile(address);
        },
        enabled: !!address,
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
        retry: 1
    });
}

