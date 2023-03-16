import { warn } from "../../utils/log";
import { BackPolicy, ZenPayQueryParams } from "./types";

export function extractZenPayQueryParams(url: string): {
    closeApp: boolean,
    openUrl: string | null,
    backPolicy: BackPolicy,
    openEnrollment: boolean,
} {
    try {
        const query = url.split('?')[1];
        const params = new URLSearchParams(query);
        let closeApp = false;
        let openUrl = null;
        let backPolicy: BackPolicy = 'close';
        let openEnrollment = false;

            if (params.has(ZenPayQueryParams.CloseApp)) {
                const queryValue = params.get(ZenPayQueryParams.CloseApp);
                if (queryValue === 'true') {
                    closeApp = true;
                }
            }

            if (params.has(ZenPayQueryParams.OpenUrl)) {
                const queryValue = params.get(ZenPayQueryParams.OpenUrl);
                if (queryValue) {
                    openUrl = queryValue;
                }
            }

            if (params.has(ZenPayQueryParams.BackPolicy)) {
                const queryValue = params.get(ZenPayQueryParams.BackPolicy);
                if (queryValue === 'back') {
                    backPolicy = 'back';
                }
            }

            if (params.has(ZenPayQueryParams.OpenEnrollment)) {
                const queryValue = params.get(ZenPayQueryParams.OpenEnrollment);
                if (queryValue === 'true') {
                    openEnrollment = true;
                }
            }

            return {
                closeApp,
                openUrl,
                backPolicy: backPolicy,
                openEnrollment,
            }
    } catch (error) {
        warn(error);
        return {
            closeApp: false,
            openUrl: null,
            backPolicy: 'close',
            openEnrollment: false,
        }
    }
}