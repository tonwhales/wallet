import { atom } from "recoil";

export interface LocalStorageStatus {
    isAvailable: boolean;
    isObjectAvailable?: boolean;
    keys: string[];
    totalSizeBytes?: number;
    error?: string;
    lastChecked: number;
}

export const localStorageStatusAtom = atom<LocalStorageStatus>({
    key: 'webViewLocalStorageStatus',
    default: {
        isAvailable: false,
        keys: [],
        lastChecked: 0
    }
}); 