import { SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from '@tonconnect/protocol';
import { Alert } from 'react-native';
import { Cell } from 'ton';
import { t } from '../../i18n/t';
import { getTimeSec } from '../../utils/getTimeSec';
import { Engine } from '../Engine';
import { SendTransactionError } from './TonConnect';
import { SendTransactionRequest, SignRawParams, WebViewBridgeMessageType } from './types';

export const tonConnectTransactionCallback = (
  ok: boolean,
  result: Cell | null,
  request: { from: string } & SendTransactionRequest,
  sessionCrypto: SessionCrypto,
  engine: Engine
) => {
  if (!ok) {
      engine.products.tonConnect.send({
          response: new SendTransactionError(
              request.id,
              SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
              'Wallet declined the request',
          ),
          sessionCrypto,
          clientSessionId: request.from
      });
      engine.products.tonConnect.deleteActiveRemoteRequest(request.from);
      return;
  }

  engine.products.tonConnect.send({
      response: { result: result?.toBoc({ idx: false }).toString('base64') ?? '', id: request.id },
      sessionCrypto,
      clientSessionId: request.from
  });
  engine.products.tonConnect.deleteActiveRemoteRequest(request.from);
}

export const prepareTonConnectRequest = (request: { from: string } & SendTransactionRequest, engine: Engine) => {
  const params = JSON.parse(request.params[0]) as SignRawParams;

  const isValidRequest =
      params && typeof params.valid_until === 'number' &&
      Array.isArray(params.messages) &&
      params.messages.every((msg) => !!msg.address && !!msg.amount);

  const session = engine.products.tonConnect.getConnectionByClientSessionId(request.from);
  if (!session) {
      engine.products.tonConnect.deleteActiveRemoteRequest(request.from);
      Alert.alert(t('common.error'), t('products.tonConnect.errors.connection'));
      return;
  }
  const sessionCrypto = new SessionCrypto(session.sessionKeyPair);

  if (!isValidRequest) {
      engine.products.tonConnect.deleteActiveRemoteRequest(request.from);
      engine.products.tonConnect.send({
          response: {
              error: {
                  code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                  message: `Bad request`,
              },
              id: request.id.toString(),
          },
          sessionCrypto,
          clientSessionId: request.from
      })
      return;
  }

  const { valid_until } = params;
  if (valid_until < getTimeSec()) {
      engine.products.tonConnect.deleteActiveRemoteRequest(request.from);
      engine.products.tonConnect.send({
          response: {
              error: {
                  code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                  message: `Request timed out`,
              },
              id: request.id.toString(),
          },
          sessionCrypto,
          clientSessionId: request.from
      })
      return;
  }

  const app = engine.products.tonConnect.findConnectedAppByClientSessionId(request.from);

  return {
      request,
      sessionCrypto,
      messages: params.messages,
      app
  }
}

export const objectToInjection = (obj: Record<string, any>, timeout: number | null) => {
  const funcKeys = Object.keys(obj).filter((key) => typeof obj[key] === 'function');

  const funcs = funcKeys.reduce(
    (acc, funcName) => `${acc}${funcName}: (...args) => {
      return new Promise((resolve, reject) => window.invokeRnFunc('${funcName}', args, resolve, reject))
    },`,
    '',
  );

  return `
    (() => {
      if (!window.tonkeeper) {
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
      window.tonkeeper = {
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
