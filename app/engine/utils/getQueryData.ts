import { hashQueryKey, Query, QueryCache, QueryKey } from "@tanstack/react-query";

export function getQueryData<T>(cache: QueryCache, queryKey: QueryKey) {
    const hash = hashQueryKey(queryKey);
    return (cache.get(hash) as Query<T>)?.state?.data;
}