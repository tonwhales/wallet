import { warn } from "../../utils/log";
import { BackPolicy, HoldersQueryParams } from "./types";

export type HoldersParams = {
    closeApp?: boolean,
    openUrl?: string | null,
    backPolicy: BackPolicy,
    openEnrollment?: boolean,
    showKeyboardAccessoryView?: boolean,
    lockScroll?: boolean,
}

export function extractHoldersQueryParams(url: string): HoldersParams {
    try {
        const query = url.split('?')[1];
        const params = new URLSearchParams(query);
        let closeApp = false;
        let openUrl = null;
        let backPolicy: BackPolicy = 'close';
        let openEnrollment = false;
        let showKeyboardAccessoryView = false;
        let lockScroll = undefined;

        if (params.has(HoldersQueryParams.CloseApp)) {
            const queryValue = params.get(HoldersQueryParams.CloseApp);
            if (queryValue === 'true') {
                closeApp = true;
            }
        }

        if (params.has(HoldersQueryParams.OpenUrl)) {
            const queryValue = params.get(HoldersQueryParams.OpenUrl);
            if (queryValue) {
                openUrl = queryValue;
            }
        }

        if (params.has(HoldersQueryParams.BackPolicy)) {
            const queryValue = params.get(HoldersQueryParams.BackPolicy);
            if (queryValue === 'back') {
                backPolicy = 'back';
            }
        }

        if (params.has(HoldersQueryParams.OpenEnrollment)) {
            const queryValue = params.get(HoldersQueryParams.OpenEnrollment);
            if (queryValue === 'true') {
                openEnrollment = true;
            }
        }

        if (params.has(HoldersQueryParams.ShowKeyboardAccessoryView)) {
            const queryValue = params.get(HoldersQueryParams.ShowKeyboardAccessoryView);
            if (queryValue === 'true') {
                showKeyboardAccessoryView = true;
            }
        }

        if (params.has(HoldersQueryParams.LockScroll)) {
            const queryValue = params.get(HoldersQueryParams.LockScroll);
            if (queryValue === 'false') {
                lockScroll = false;
            } else if (queryValue === 'true') {
                lockScroll = true;
            }
        }

        return {
            closeApp,
            openUrl,
            backPolicy,
            openEnrollment,
            showKeyboardAccessoryView,
            lockScroll
        }
    } catch {
        warn('Failed to extract holders query params');
        return { backPolicy: 'close' }
    }
}