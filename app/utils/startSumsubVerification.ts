import { t } from "../i18n/t";

const SNSMobileSDK = require('@sumsub/react-native-mobilesdk-module');

export function startSumsubVerification(token: string, handler: (result: 'ok' | 'fail' | 'error') => void) {
    let snsMobileSDK = SNSMobileSDK
        .init(token, () => { })
        .withDebug(__DEV__)
        .withLocale(t('lang')) // Language Code
        .withHandlers({
            onEvent: (event: any) => {
                console.log("onEvent: " + JSON.stringify(event));
            },
            onStatusChanged: (event: any) => {
                console.log("onStatusChanged: [" + event.prevStatus + "] => [" + event.newStatus + "]");
            },
            onLog: (event: any) => {
                console.log("onLog: [Idensic] " + event.message);
            },
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
    snsMobileSDK.launch().then((r: any) => {
        console.log(r);
    }).catch((err: any) => {
        console.warn(err);
    });
}