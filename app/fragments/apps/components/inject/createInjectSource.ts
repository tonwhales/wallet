import { EdgeInsets } from "react-native-safe-area-context";
import WebView from "react-native-webview";

export const mainButtonAPI = `
window['main-button'] = (() => {
    let requestId = 0;
    let callbacks = {};
    let __MAIN_BUTTON_AVAILIBLE = true;

    const setText = (text) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.setText', args: { text } } }));
    };

    const onClick = (callback) => {
        let id = requestId++;
        callback.uniqueId = id;
        window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name: 'main-button.onClick' } }));
        callbacks[id] = callback;
    };

    const offClick = (callback) => {
        let id = callback.uniqueId;
        if (!id) {
            id = requestId;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name: 'main-button.offClick' } }));
        delete callbacks[id];
    };

    const showProgress = (leaveActive) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.showProgress', args: { leaveActive } } }));
    };

    const hideProgress = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.hideProgress' } }));
    };

    const show = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.show' } }));
    };

    const hide = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.hide' } }));
    };

    const enable = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.enable' } }));
    };

    const disable = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.disable' } }));
    };

    const setParams = (params) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'main-button.setParams', args: params } }));
    };

    const __response = (ev) => {
        if (ev && callbacks[ev.id] && ev.data) {
            let c = callbacks[ev.id];
            c(ev.data);
            return;
        }

        const lastId = Object.keys(callbacks).pop();
        if (lastId && callbacks[lastId]) {
            let c = callbacks[lastId];
            c();
        }
    }

    const obj = { setText, onClick, offClick, showProgress, hideProgress, show, hide, enable, disable, setParams, __MAIN_BUTTON_AVAILIBLE, __response };
    Object.freeze(obj);
    return obj;
})();
`

export const toasterAPI = `
window['toaster'] = (() => {
    let __TOASTER_AVAILIBLE = true;

    const show = (props) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'toaster.show', args: props } }));
    };

    const clear = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'toaster.clear' } }));
    };

    const push = (props) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'toaster.push', args: props } }));
    };

    const pop = () => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'toaster.pop' } }));
    };

    const obj = { show, clear, push, pop, __TOASTER_AVAILIBLE };
    Object.freeze(obj);
    return obj;
})();
`



export const emitterAPI = `
window['dapp-emitter'] = (() => {
    let __EMITTER_READY = true;

    const transferEvent = (event) => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'dapp-emitter', args: { event } } }));
    };

    const obj = { transferEvent, __EMITTER_READY };
    Object.freeze(obj);
    return obj;
})();
`

export const statusBarAPI = (safeArea: EdgeInsets) => {
    return `
    window['status-bar'] = (() => {
        let __STATUS_BAR_AVAILIBLE = true;
        const safeArea = ${JSON.stringify(safeArea)};

        const setStatusBarStyle = (style) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'status-bar.setStatusBarStyle', args: [style] } }));
        };

        const setStatusBarBackgroundColor = (backgroundColor) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'status-bar.setStatusBarBackgroundColor', args: [backgroundColor] } }));
        };

        const statusBar = { setStatusBarStyle, setStatusBarBackgroundColor };

        Object.freeze(statusBar);
        Object.freeze(safeArea);

        const obj = { __STATUS_BAR_AVAILIBLE, statusBar, safeArea };

        Object.freeze(obj);
        return obj;
    })();
    `
}

export const authAPI = (params: { lastAuthTime?: number, isSecured: boolean }) => {
    return `
    window['tonhub-auth'] = (() => {
        let __AUTH_AVAILIBLE = true;
        let inProgress = false;
        let currentCallback = null;
        const params = ${JSON.stringify(params)};

        const getLastAuthTime = (callback) => {
            if (inProgress) {
                callback({ erorr: 'auth.inProgress' });
                return;
            }
            currentCallback = callback;
            window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'auth.getLastAuthTime' } }));
        }

        const authenticate = (callback) => {
            if (inProgress) {
                callback({ isAuthenticated: false, erorr: 'auth.inProgress' });
                return;
            }

            inProgress = true;
            currentCallback = callback;
            window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'auth.authenticate' } }));
        };

        const lockAppWithAuth = (callback) => {
            if (inProgress) {
                callback({ isAuthenticated: false, erorr: 'auth.inProgress' });
                return;
            }

            inProgress = true;
            currentCallback = callback;
            window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'auth.lockAppWithAuth' } }));
        }

        const __response = (ev) => {
            inProgress = false;
            if (!ev || !ev.data) {
                if (currentCallback) {
                    currentCallback({ erorr: 'auth.noResponse' });
                }
                currentCallback = null;
                return;
            }
            if (currentCallback) {
                if (typeof ev.data === 'number') {
                    params.lastAuthTime = ev.data;
                    currentCallback(ev.data);
                } else {
                    if (!!ev.data.lastAuthTime) {
                        params.lastAuthTime = ev.data.lastAuthTime;
                    }
                    if (typeof ev.data.isSecured === 'boolean') {
                        params.isSecured = true;
                        currentCallback({ isSecured: ev.data.isSecured, lastAuthTime: ev.data.lastAuthTime });
                    } else if (typeof ev.data.isAuthenticated === 'boolean') {
                        currentCallback({ isAuthenticated: ev.data.isAuthenticated, lastAuthTime: ev.data.lastAuthTime });
                    }
                }
                currentCallback = null;
            }
        }

        const obj = { __AUTH_AVAILIBLE, params, authenticate, getLastAuthTime, lockAppWithAuth, __response };
        Object.freeze(obj);
        return obj;
    })();
    `
}


export const dappWalletAPI = `
window['dapp-wallet'] = (() => {
    let __DAPP_WALLET_AVAILIBLE = true;
    let inProgress = false;
    let currentCallback = null;

    const canAddCards = (callback) => {
        if (inProgress) {
            callback({ erorr: 'wallet.inProgress' });
            return;
        }

        inProgress = true;
        currentCallback = callback;

        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'wallet.canAddCards' } }));
    }

    const checkIfCardIsAlreadyAdded = (primaryAccountIdentifier, callback) => {
        if (inProgress) {
            callback({ erorr: 'wallet.inProgress' });
            return;
        }

        inProgress = true;
        currentCallback = callback;

        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'wallet.checkIfCardIsAlreadyAdded', args: { primaryAccountIdentifier } } }));
    }

    const canAddCard = (cardId, callback) => {
        if (inProgress) {
            callback({ erorr: 'wallet.inProgress' });
            return;
        }

        inProgress = true;
        currentCallback = callback;

        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'wallet.canAddCard', args: { cardId } } }));
    }

    const addCardToWallet = (request, callback) => {
        if (inProgress) {
            callback({ erorr: 'wallet.inProgress' });
            return;
        }

        inProgress = true;
        currentCallback = callback;

        window.ReactNativeWebView.postMessage(JSON.stringify({ data: { name: 'wallet.addCardToWallet', args: request } }));
    }

    const __response = (ev) => {
        inProgress = false;
        if (!ev || !ev.data) {
            if (currentCallback) {
                currentCallback({ erorr: 'wallet.noResponse' });
            }
            currentCallback = null;
            return;
        }
        if (currentCallback) {
            currentCallback(ev.data);
            currentCallback = null;
        }
    }

    const obj = { __DAPP_WALLET_AVAILIBLE, canAddCards, checkIfCardIsAlreadyAdded, canAddCard, addCardToWallet, __response };
})();
`

type InjectionConfig = {
    version: number;
    platform: "ios" | "android" | "windows" | "macos" | "web";
    platformVersion: string | number;
    network: string;
    address: string;
    publicKey: string;
    walletConfig: string;
    walletType: string;
    signature: string;
    time: number;
    subkey: {
        domain: string;
        publicKey: string;
        time: number;
        signature: string;
    }
}

type InjectSourceProps = {
    config: InjectionConfig,
    safeArea: EdgeInsets,
    additionalInjections?: string,
    useMainButtonAPI?: boolean,
    useStatusBarAPI?: boolean
}

export function createInjectSource(sourceProps: InjectSourceProps) {
    const { config, safeArea, additionalInjections, useMainButtonAPI, useStatusBarAPI } = sourceProps;
    return `
    ${additionalInjections || ''}
    ${useMainButtonAPI ? mainButtonAPI : ''}
    ${useStatusBarAPI ? statusBarAPI(safeArea) : ''}
    window['ton-x'] = (() => {
        let requestId = 0;
        let callbacks = {};
        let config = ${JSON.stringify(config)};
        let __IS_TON_X = true;
    
        const call = (name, args, callback) => {
            let id = requestId++;
            window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name, args } }));
            callbacks[id] = callback;
        };

        const __response = (ev) => {
            if (ev && typeof ev.id === 'number' && ev.data && callbacks[ev.id]) {
                let c = callbacks[ev.id];
                delete callbacks[ev.id];
                c(ev.data);
            }
        }

        Object.freeze(config);
        
        const obj = { call, config, __IS_TON_X, __response };
        Object.freeze(obj);
        return obj;
    })();
    true;
    `;
};

type TonhubBridgeSourceProps = {
    platform: string;
    wallet: {
        address: string;
        publicKey: string;
    };
    version: number;
    network: 'testnet' | 'mainnet';
    theme: 'light' | 'dark';
}

export function tonhubBridgeSource(props: TonhubBridgeSourceProps) {
    return `
    window['tonhub-bridge'] = (() => {
        let requestId = 0;
        let callbacks = {};
        let __TONHUB_BRIDGE_AVAILIBLE = true;

        const call = (name, args, callback) => {
            let id = requestId++;
            window.ReactNativeWebView.postMessage(JSON.stringify({ id, data: { name, args } }));
            callbacks[id] = callback;
        };

        const __response = (ev) => {
            if (ev && typeof ev.id === 'number' && ev.data && callbacks[ev.id]) {
                let c = callbacks[ev.id];
                delete callbacks[ev.id];
                c(ev.data);
            }
        }

        const obj = { call, __TONHUB_BRIDGE_AVAILIBLE, __response, ...${JSON.stringify(props)} };
        Object.freeze(obj);
        return obj;
    })();
    true;
    `;

}

export function dispatchWalletResponse(webRef: React.RefObject<WebView>, data: { result: boolean }) {
    let injectedMessage = `window['dapp-wallet'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchLastAuthTimeResponse(webRef: React.RefObject<WebView>, lastAuthTime: number) {
    let injectedMessage = `window['tonhub-auth'].__response({ data: ${lastAuthTime} }); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchAuthResponse(webRef: React.RefObject<WebView>, data: { isAuthenticated: boolean, lastAuthTime?: number }) {
    let injectedMessage = `window['tonhub-auth'].__response(${JSON.stringify({ data })}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchLockAppWithAuthResponse(webRef: React.RefObject<WebView>, data: { isSecured: boolean, lastAuthTime?: number }) {
    let injectedMessage = `window['tonhub-auth'].__response(${JSON.stringify({ data })}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchMainButtonResponse(webRef: React.RefObject<WebView>) {
    let injectedMessage = `window['main-button'].__response(); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchTonhubBridgeResponse(webRef: React.RefObject<WebView>, data: any) {
    let injectedMessage = `window['tonhub-bridge'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchResponse(webRef: React.RefObject<WebView>, data: any) {
    let injectedMessage = `window['ton-x'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}