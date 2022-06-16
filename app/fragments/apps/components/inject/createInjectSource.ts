import WebView from "react-native-webview";

export function createInjectSource(config: any) {
    return `
    window['ton-x'] = (() => {
        let requestId = 0;
        let callbacks = {};
        let config = ${JSON.stringify(config)};
    
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
        
        return { call, config, __response };
    })();
    
    true;
    `;
};

export function dispatchResponse(webRef: React.RefObject<WebView>, data: any) {
    let injectedMessage = `window['ton-x'].__response(${JSON.stringify(data)}); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}