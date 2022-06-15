import WebView from "react-native-webview";
import { CommandResponce, getCommandCodec, getSessionCodec, newCommandCodec, newSessionCodec, TonXMessage, TonXResponse, waitSessionCodec } from "./codecs";
import { isLeft } from 'fp-ts/lib/Either';
import { DomainSubkey } from "../products/AppsProduct";
import { Cell } from "ton";
import { parseJob } from "../apps/parseJob";

export function postTonXMessage(webRef: React.RefObject<WebView>, message: TonXResponse<any>) {
    console.log('[TonXMessage] post', { data: message.data, id: message.id });
    let injectedMessage = `
        (() => {
            const event = new CustomEvent('ton-x-message', { detail: JSON.parse('${JSON.stringify(message)}') });
            window.dispatchEvent(event);
        })();
        true;
        `;
    webRef.current?.injectJavaScript(injectedMessage);
}

export async function handleTonXMessage(
    message: TonXMessage<any>,
    domainSubKey: DomainSubkey,
    webRef: React.RefObject<WebView>,
) {
    console.log('[TonXMessage] got', { type: message.type, id: message.id, });

    if (message.data) {
        switch (message.type) {
            // New session
            case 'session_new': {
                const parsed = newSessionCodec.decode(message.data);
                if (!isLeft(parsed)) {
                    const data = parsed.right;
                    // TODO session setup

                    postTonXMessage(webRef, { id: message.id, data: { ok: true } });
                }
                break;
            }

            // Get session
            case 'session_get': {
                const parsed = getSessionCodec.decode(message.data);
                if (!isLeft(parsed)) {
                    // TODO answer with a valid session
                    // if (sessionState) {
                    //     const parsedSession = sessionStateCodec.decode(sessionState);
                    //     if (!isLeft(parsedSession)) {
                    //         const data = parsedSession.right;
                    //         postTonXMessage(webRef, { id: message.id, data });
                    //     }
                    // } else {
                    //     postTonXMessage(webRef, { id: message.id, data: { state: 'not_found' } });
                    // }
                }
                break;
            }
            // Wait session
            case 'session_wait': {
                const parsedMessage = waitSessionCodec.decode(message.data);
                if (!isLeft(parsedMessage)) {

                    // TODO answer with a valid session
                    // const parsedSession = sessionStateCodec.decode(sessionState);

                    // if (!isLeft(parsedSession)) {
                    //     const data = parsedSession.right;
                    //     switch (data.state) {
                    //         case 'ready': {
                    //             if (sessionIsSet) {
                    //                 postTonXMessage(webRef, { id: message.id, data });
                    //                 setSessionState('ready');
                    //             } else {
                    //                 setTimeout(() => postTonXMessage(webRef, { id: message.id, data }), 10_000);
                    //             }
                    //             break;
                    //         }
                    //         case 'not_found':
                    //         case 'initing': {
                    //             postTonXMessage(webRef, { id: message.id, data: { state: data.state } });
                    //             break;
                    //         }
                    //         default: {
                    //             postTonXMessage(webRef, { id: message.id, data: { state: 'not_found' } });
                    //         }
                    //     }
                    // } else {
                    //     postTonXMessage(webRef, { id: message.id, data: { state: 'not_found' } });
                    // }
                }
                break;
            }

            // New command
            case 'command_new': {
                const parsed = newCommandCodec.decode(message.data);
                if (!isLeft(parsed)) {
                    const data = parsed.right;

                    const res: CommandResponce = {
                        state: 'submitted',
                        job: data.job,
                        now: Date.now(),
                        updated: Date.now(),
                        created: Date.now()
                    }

                    postTonXMessage(webRef, { id: message.id, data: res });

                    // Navigate to sign or transfer fragment for the job
                    if (data.job) {
                        let jobCell = Cell.fromBoc(Buffer.from(data.job, 'base64'))[0];
                        let parsed = parseJob(jobCell.beginParse());
                        if (!parsed) {
                            return;
                        }

                        // TODO navigate to corresponding job type fragment
                        // if (parsed.job.type === 'transaction') {
                        //     navigation.navigateTransfer({
                        //         order: {
                        //             target: parsed.job.target.toFriendly({ testOnly: AppConfig.isTestnet }),
                        //             amount: parsed.job.amount,
                        //             payload: parsed.job.payload,
                        //             stateInit: parsed.job.stateInit,
                        //             amountAll: false
                        //         },
                        //         job: data.job,
                        //         text: parsed.job.text,
                        //         back: true
                        //     });
                        //     return;
                        // }

                        // if (parsed.job.type === 'sign') {
                        //     navigation.navigate('Sign', { job: data.job });
                        //     return;
                        // }
                    }
                }
                break;
            }

            // Get command
            case 'command_get': {
                const parsed = getCommandCodec.decode(message.data);
                if (!isLeft(parsed)) {
                    const res: CommandResponce = {
                        state: 'empty',
                        now: Date.now()
                    }
                    postTonXMessage(webRef, { id: message.id, data: res });
                }
                break;
            }
            default:
                break;
        }
    }
}