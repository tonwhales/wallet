import { Platform } from "react-native";
import { AppVersionsConfig } from "../engine/api/fetchAppVersionsConfig";
import * as Application from 'expo-application';
import { warn } from "./log";
import { compareVersions } from "./compareVersions";

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