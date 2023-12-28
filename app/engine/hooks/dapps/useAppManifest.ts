import { useQuery } from '@tanstack/react-query';
import { AppManifest, fetchManifest } from '../../api/fetchManifest';
import { Queries } from '../../queries';

export function useAppManifest(url: string): AppManifest | null {
    let res = useQuery({
        queryKey: Queries.Apps(url).Manifest(),
        queryFn: (ctx) => fetchManifest(ctx.queryKey[1]),
    });

    return res.data || null;
}