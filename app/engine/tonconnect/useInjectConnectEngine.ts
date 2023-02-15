import { AppRequest, ConnectEvent, ConnectItemReply, CONNECT_EVENT_ERROR_CODES, RpcMethod, WalletEvent } from '@tonconnect/protocol';
import { useCallback, useMemo, useState } from 'react';
import { Engine } from '../Engine';
import { checkProtocolVersionCapability, TonConnectInjectedBridge, verifyConnectRequest } from './TonConnect';
import { CURRENT_PROTOCOL_VERSION, tonConnectDeviceInfo } from './config';
import { useWebViewBridge } from './useWebViewBridge';
import { ConnectEventError, TonConnectBridgeType } from './types';
import { TypedNavigation } from '../../utils/useTypedNavigation';
import { TonConnectAuthResult } from '../../fragments/secure/TonconnectAuthenticateFragment';

export function useDAppBridge(webViewUrl: string, engine: Engine, navigation: TypedNavigation) {
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

        try {
          checkProtocolVersionCapability(protocolVersion);
          verifyConnectRequest(request);

          const manifest = await engine.products.tonConnect.getConnectAppData(request.manifestUrl);

          if (!manifest) {
            return new ConnectEventError(
              CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
              'Unknown app',
            );
          }

          const event = await new Promise<ConnectEvent>((resolve, reject) => {
            const callback = (result: TonConnectAuthResult) => {
              if (result.ok) {
                engine.products.tonConnect.saveAppConnection(
                  {
                    name: manifest.name,
                    url: manifest.url,
                    icon: manifest.iconUrl,
                  },
                  {
                    type: TonConnectBridgeType.Injected,
                    replyItems: result.replyItems,
                  }
                );

                resolve({
                  event: 'connect',
                  payload: {
                    items: result.replyItems,
                    device: tonConnectDeviceInfo,
                  },
                });

                return;
              }
              reject();
            }

            navigation.navigateConnectAuth({
              type: 'callback',
              protocolVersion: protocolVersion as 2,
              request,
              callback
            });

          });
          setConnectEvent(event);
          return event;

        } catch (error: any) {
          if (error instanceof ConnectEventError) {
            return error;
          }

          return new ConnectEventError(
            CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
            error?.message,
          );
        }
      },

      restoreConnection: async () => {
        const event = await engine.products.tonConnect.autoConnect(webViewUrl);
        setConnectEvent(event);
        return event;
      },

      disconnect: async () => {
        setConnectEvent(null);
        engine.products.tonConnect.removeInjectedConnection(webViewUrl);
        return;
      },

      send: async <T extends RpcMethod>(request: AppRequest<T>) => {
        
        return engine.products.tonConnect.handleRequestFromInjectedBridge(request, webViewUrl)
      }
    };
  }, [webViewUrl]);

  const [ref, injectedJavaScriptBeforeContentLoaded, onMessage, sendEvent] =
    useWebViewBridge<TonConnectInjectedBridge, WalletEvent>(bridgeObject);

  const disconnect = useCallback(async () => {
    try {
      await engine.products.tonConnect.disconnect(webViewUrl);
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
