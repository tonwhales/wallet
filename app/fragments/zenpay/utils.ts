import { warn } from "../../utils/log";
import { ZenPayQueryParams } from "./types";

export function extractZenPayQueryParams(url: string): {
    closeApp: boolean,
    openUrl: string | null,
    hardwareBackPolicy: 'back' | 'close',
    openEnrollment: boolean,
} {
    try {
        const query = url.split('?')[1];
        const params = new URLSearchParams(query);
        let closeApp = false;
        let openUrl = null;
        let hardwareBackPolicy: 'back' | 'close' = 'close';
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

            if (params.has(ZenPayQueryParams.HardwareBackPolicy)) {
                const queryValue = params.get(ZenPayQueryParams.HardwareBackPolicy);
                if (queryValue === 'back') {
                    hardwareBackPolicy = 'back';
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
                hardwareBackPolicy,
                openEnrollment,
            }
    } catch (error) {
        warn(error);
        return {
            closeApp: false,
            openUrl: null,
            hardwareBackPolicy: 'close',
            openEnrollment: false,
        }
    }
}