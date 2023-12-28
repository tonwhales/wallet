import { AppManifest, fetchManifest } from "../api/fetchManifest";
import { queryClient } from "../clients";
import { Queries } from "../queries";

export async function getAppManifest(url: string) {
    const exising = queryClient.getQueryData<AppManifest | null>(Queries.Apps(url).Manifest());
    if (exising) {
        return exising;
    }

    const manifest = await fetchManifest(url);
    if (manifest) {
        queryClient.setQueryData<AppManifest | null>(Queries.Apps(url).Manifest(), manifest);
    }
    return manifest;
}