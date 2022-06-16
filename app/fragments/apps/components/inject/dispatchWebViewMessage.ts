import WebView from "react-native-webview";

export function dispatchWebViewMessage(webRef: React.RefObject<WebView>, event: string, data: any) {
    let injectedMessage = `const event = new CustomEvent('${event}', { data: JSON.parse('${JSON.stringify(data)}'); window.dispatchEvent(event); true;`;
    webRef.current?.injectJavaScript(injectedMessage);
}