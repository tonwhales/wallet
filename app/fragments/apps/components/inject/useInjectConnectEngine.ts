import { AppRequest, ConnectEvent, RpcMethod, WalletEvent } from '@tonconnect/protocol';
import { useCallback, useMemo, useState } from 'react';
// import { useWebViewBridge } from '../jsBridge';
// import { TonConnectInjectedBridge } from './models';
import {
  removeInjectedConnection,
  useConnectedAppsStore,
} from '$store';
import { Engine } from '../../../../engine/Engine';
import { TonConnectInjectedBridge } from '../../../../engine/tonconnect/TonConnect';
import { CURRENT_PROTOCOL_VERSION, tonConnectDeviceInfo } from '../../../../engine/tonconnect/config';

export function useDAppBridge(walletAddress: string, webViewUrl: string, engine: Engine) {
  const [connectEvent, setConnectEvent] = useState<ConnectEvent | null>(null);
  const app = engine.products.tonConnect.getConnectedAppByUrl(webViewUrl);

  const isConnected = useMemo(() => {
    if (!app) {
      return false;
    }

    return Boolean(connectEvent && connectEvent.event === 'connect');
  }, [app, connectEvent]);

  const bridgeObject = useMemo((): TonConnectInjectedBridge => {
    return {
      deviceInfo: tonConnectDeviceInfo,
      protocolVersion: CURRENT_PROTOCOL_VERSION,
      isWalletBrowser: true,
      connect: async (protocolVersion, request) => {
        const event = await TonConnect.connect(
          protocolVersion,
          request,
          undefined,
          undefined,
          webViewUrl,
        );

        setConnectEvent(event);

        return event;
      },
      restoreConnection: async () => {
        const event = await TonConnect.autoConnect(webViewUrl);

        setConnectEvent(event);

        return event;
      },
      disconnect: async () => {
        setConnectEvent(null);

        removeInjectedConnection(webViewUrl);

        return;
      },
      send: async <T extends RpcMethod>(request: AppRequest<T>) =>
        TonConnect.handleRequestFromInjectedBridge(request, webViewUrl),
    };
  }, [webViewUrl]);

  const [ref, injectedJavaScriptBeforeContentLoaded, onMessage, sendEvent] =
    useWebViewBridge<TonConnectInjectedBridge, WalletEvent>(bridgeObject);

  const disconnect = useCallback(async () => {
    try {
      await TonConnect.disconnect(webViewUrl);
      sendEvent({ event: 'disconnect', payload: {} });
    } catch { }
  }, [webViewUrl, sendEvent]);

  return {
    ref,
    injectedJavaScriptBeforeContentLoaded,
    onMessage,
    isConnected,
    disconnect,
  };
};
