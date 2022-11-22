import WebView from "react-native-webview";

// window.localStorage.clear(); is a hack to clear the cache for ton-x connection bug not reseting on address change
export function createInjectSource(config: any) {
    return `
    window.localStorage.clear();
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
        
        const obj = { call, config, __IS_TON_X, __response };
        Object.freeze(obj);
        return obj;
    })();
    
    true;
    `;
};

export function dispatchResponse(webRef: React.RefObject<WebView>, data: any) {
    let injectedMessage = `window['ton-x'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}