import { useCallback, useMemo, useRef } from 'react';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { getInjectableJSMessage, objectToInjection } from '../../tonconnect/utils';
import { UseWebViewBridgeReturnType, WebViewBridgeMessage, WebViewBridgeMessageType } from '../../tonconnect/types';

export const useWebViewBridge = <
  BridgeObject extends { [key: string]: any } = {},
  Event extends object = {},
>(
  bridgeObj: BridgeObject,
  timeout: number | null = null,
): UseWebViewBridgeReturnType<Event> => {
  const ref = useRef<WebView>(null);
  const injectedJavaScriptBeforeContentLoaded = useMemo(
    () => objectToInjection(bridgeObj, timeout),
    [bridgeObj, timeout],
  );

  const postMessage = useCallback((message: any) => {
    ref.current?.injectJavaScript(getInjectableJSMessage(JSON.stringify(message)));
  }, []);

  const onMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      const message = JSON.parse(event.nativeEvent.data) as WebViewBridgeMessage;

      if (message.type === WebViewBridgeMessageType.invokeRnFunc) {
        try {
          const result = await bridgeObj[message.name](...message.args);

          postMessage({
            type: WebViewBridgeMessageType.functionResponse,
            invocationId: message.invocationId,
            status: 'fulfilled',
            data: result,
          });
        } catch (e) {
          postMessage({
            type: WebViewBridgeMessageType.functionResponse,
            invocationId: message.invocationId,
            status: 'rejected',
            data: (e as any)?.message,
          });
        }
      }
    },
    [bridgeObj, postMessage],
  );

  const sendEvent = useCallback(
    (event: any) => {
      postMessage({ type: WebViewBridgeMessageType.event, event });
    },
    [postMessage],
  );

  return [ref, injectedJavaScriptBeforeContentLoaded, onMessage, sendEvent];
};
