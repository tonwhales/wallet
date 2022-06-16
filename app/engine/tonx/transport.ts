import WebView from "react-native-webview";

export type TonXResponse<T> = {
    id: number,
    data?: T
};

export type TonXMessage<T> = {
    id: number,
    type: 'session_get' | 'session_new' | 'session_wait' | 'command_new' | 'command_get',
    data: T
}

export function dispatchTonXData(webRef: React.RefObject<WebView>, key: string, value: any) {
    let injectedMessage = `
        (() => {
            if (window.tonXData == undefined) window.tonXData = {};
            window.tonXData['${key}'] = JSON.parse('${JSON.stringify(value)}');
        })();
        true;
        `;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchWebViewMessage(webRef: React.RefObject<WebView>, event: string, data: any) {
    let injectedMessage = `
        (() => {
            const event = new CustomEvent('${event}', { detail: JSON.parse('${JSON.stringify(data)}') });
            window.dispatchEvent(event);
        })();
        true;
        `;
    webRef.current?.injectJavaScript(injectedMessage);
}

export function dispatchTonXMessage(webRef: React.RefObject<WebView>, message: TonXResponse<any>) {
    dispatchWebViewMessage(webRef, 'ton-x-message', message);
}