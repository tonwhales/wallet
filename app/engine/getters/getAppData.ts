import { AppData, fetchAppData } from "../api/fetchAppData";
import { queryClient } from "../clients";
import { Queries } from "../queries";

export function getCachedAppData(url: string) {
    const exising = queryClient.getQueryData<AppData | null>(Queries.Apps(url).AppData());
    if (exising) {
        return exising;
    }
}

export async function getAppData(url: string) {
    const exising = queryClient.getQueryData<AppData | null>(Queries.Apps(url).AppData());
    if (exising) {
        return exising;
    }

    const appData = await fetchAppData(url);
    if (appData) {
        queryClient.setQueryData<AppData | null>(Queries.Apps(url).AppData(), appData);
    }
    return appData;
}