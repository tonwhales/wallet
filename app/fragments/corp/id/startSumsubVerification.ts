import { t } from "../../../i18n/t";

const SNSMobileSDK = require('@sumsub/react-native-mobilesdk-module');

export async function startSumsubVerification(args: { token: string, refetchToken: () => Promise<string> }) {

    return await new Promise<boolean>((resolve) => {
        let resolved = false;

        let snsMobileSDK = SNSMobileSDK
            .init(args.token, args.refetchToken)
            .withDebug(__DEV__)
            .withLocale(t('lang')) // Language Code
            .withHandlers({
                onEvent: (event: any) => {
                    console.log("onEvent: " + JSON.stringify(event));
                },
                onStatusChanged: (event: any) => {
                    console.log("onStatusChanged: [" + event.prevStatus + "] => [" + event.newStatus + "]");
                },
                // onLog: (event: any) => {
                //     console.log("onLog: [Idensic] " + event.message);
                // },
                onActionResult: (result: any) => {
                    console.log("onActionResult: " + JSON.stringify(result));

                    // you must return a `Promise` that in turn should be resolved with
                    // either `cancel` to force the user interface to close, or `continue` to proceed as usual
                    return new Promise(resolve => {
                        resolve("continue");
                    })
                }
            })
            .build();

        // Launch
        (snsMobileSDK.launch() as Promise<any>).then((v) => {
            if (!resolved) {
                console.warn(v);
                resolved = true;
                resolve(!!v.success);
            }
        }).catch((e) => {
            if (!resolved) {
                console.warn(e);
                resolved = true;
                resolve(false);
            }
        });
    })
}