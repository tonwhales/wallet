import { ConnectRequest } from '@tonconnect/protocol';
import { MIN_PROTOCOL_VERSION } from './config';
import { WebViewBridgeMessageType } from './types';
import { storage } from '../../storage/storage';
import { getCurrentAddress } from '../../storage/appState';

export function setLastEventId(lastEventId: string) {
  const selected = getCurrentAddress().addressString;
  storage.set(`${selected}/connect_last_event_id`, lastEventId);
}

export function getLastEventId() {
  const selected = getCurrentAddress().addressString;
  return storage.getString(`${selected}/connect_last_event_id`);
}

export function isHexString(str: string): boolean {
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(str) && str.length % 2 === 0;;
}

export function checkProtocolVersionCapability(protocolVersion: number) {
  if (typeof protocolVersion !== 'number' || protocolVersion < MIN_PROTOCOL_VERSION) {
    throw new Error(`Protocol version ${String(protocolVersion)} is not supported by the wallet app`);
  }
}

export function verifyConnectRequest(request: ConnectRequest) {
  if (!(request && request.manifestUrl && request.items?.length)) {
    throw new Error('Wrong request data');
  }
}

export const objectToInjection = (obj: Record<string, any>, timeout: number | null) => {
  const funcKeys = Object.keys(obj).filter((key) => typeof obj[key] === 'function');
  const bridgeKey = 'tonhub';

  const funcs = funcKeys.reduce(
    (acc, funcName) => `${acc}${funcName}: (...args) => {
      return new Promise((resolve, reject) => window.invokeRnFunc('${funcName}', args, resolve, reject))
    },`,
    '',
  );

  return `
    (() => {
      if (!window.${bridgeKey}) {
        window.rnPromises = {};
        window.rnEventListeners = [];
        window.invokeRnFunc = (name, args, resolve, reject) => {
          const invocationId = btoa(Math.random()).substring(0, 12);
          const timeoutMs = ${timeout};
          const timeoutId = timeoutMs ? setTimeout(() => reject(new Error(\`bridge timeout for function with name: \${name}\`)), timeoutMs) : null;
          window.rnPromises[invocationId] = { resolve, reject, timeoutId }
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: '${WebViewBridgeMessageType.invokeRnFunc}',
            invocationId: invocationId,
            name,
            args,
          }));
        };
        window.addEventListener('message', ({ data }) => {
          try {
            const message = JSON.parse(data);
            if (message.type === '${WebViewBridgeMessageType.functionResponse}') {
              const promise = window.rnPromises[message.invocationId];
              if (!promise) {
                return;
              }
              if (promise.timeoutId) {
                clearTimeout(promise.timeoutId);
              }
              if (message.status === 'fulfilled') {
                promise.resolve(message.data);
              } else {
                promise.reject(new Error(message.data));
              }
              delete window.rnPromises[message.invocationId];
            }
            if (message.type === '${WebViewBridgeMessageType.event}') {
              window.rnEventListeners.forEach((listener) => listener(message.event));
            }
          } catch {}
        });
      }
      const listen = (cb) => {
        window.rnEventListeners.push(cb);
        return () => {
          const index = window.rnEventListeners.indexOf(cb);
          if (index > -1) {
            window.rnEventListeners.splice(index, 1);
          }
        };
      };
      window.${bridgeKey} = {
        tonconnect: Object.assign(
          ${JSON.stringify(obj)},
          {${funcs}},
          { listen },
        ),
      };
    })();
  `;
};

export const getInjectableJSMessage = (message: any) => {
  return `
    (function() {
      window.dispatchEvent(new MessageEvent('message', {
        data: ${JSON.stringify(message)}
      }));
    })();
  `;
};
