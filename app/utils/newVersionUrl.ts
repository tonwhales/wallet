import { Platform } from "react-native";
import { AppVersionsConfig } from "../engine/api/fetchAppVersionsConfig";
import * as Application from 'expo-application';
import { warn } from "./log";
import { compareVersions } from "./compareVersions";

// Hard update: the running version is below the minimal one the backend still supports,
// so the app must be blocked until the user installs a newer build from the store.
// Anything unexpected (no config, unparsable version) resolves to "not required" —
// locking users out on a parsing quirk is worse than letting an old build run
export function forceUpdateUrl(config: AppVersionsConfig | null | undefined): string | null {
    const currentVersion = Application.nativeApplicationVersion;
    const storeVersion = config?.[Platform.OS === 'android' ? 'android' : 'ios'];

    if (!storeVersion?.minimal || !currentVersion) {
        return null;
    }

    try {
        if (compareVersions(currentVersion, storeVersion.minimal) === -1) {
            return storeVersion.url;
        }
        return null;
    } catch {
        warn('Failed to compare versions');
        return null;
    }
}

export function newVersionUrl(config: AppVersionsConfig): { url: string, isCiritical: boolean } | null {
    const currentVersion = Application.nativeApplicationVersion;
    const storeVersion = config[Platform.OS === 'android' ? 'android' : 'ios'];

    if (!storeVersion || !currentVersion) {
        return null;
    }

    try {
        if (compareVersions(currentVersion, storeVersion.critical) === -1) {
            return { url: storeVersion.url, isCiritical: true };
        }

        if (compareVersions(currentVersion, storeVersion.latest) === -1) {
            return { url: storeVersion.url, isCiritical: storeVersion.critical === storeVersion.latest };
        }
        return null;
    } catch {
        warn('Failed to compare versions');
        return null;
    }
}