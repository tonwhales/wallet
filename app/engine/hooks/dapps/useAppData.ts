import { useQuery } from '@tanstack/react-query';
import { AppData, fetchAppData } from '../../api/fetchAppData';
import { Queries } from '../../queries';

export function useAppData(url: string): AppData | null {
    let data = useQuery({
        queryKey: Queries.Apps(url).AppData(),
        queryFn: (ctx) => fetchAppData(ctx.queryKey[1]),
    });
    
    return data.data || null;
}