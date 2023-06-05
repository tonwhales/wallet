import { ConnectRequest, SEND_TRANSACTION_ERROR_CODES, SessionCrypto } from '@tonconnect/protocol';
import { Alert } from 'react-native';
import { Cell, fromNano, toNano } from 'ton';
import { t } from '../../i18n/t';
import { getTimeSec } from '../../utils/getTimeSec';
import { warn } from '../../utils/log';
import { sendTonConnectResponse } from '../api/sendTonConnectResponse';
import { Engine } from '../Engine';
import { MIN_PROTOCOL_VERSION } from './config';
import { SendTransactionError, SendTransactionRequest, SignRawParams, WebViewBridgeMessageType } from './types';

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

export const tonConnectTransactionCallback = (
  ok: boolean,
  result: Cell | null,
  request: { from: string } & SendTransactionRequest,
  sessionCrypto: SessionCrypto,
  engine: Engine
) => {
  if (!ok) {
    sendTonConnectResponse({
      response: new SendTransactionError(
        request.id,
        SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
        'Wallet declined the request',
      ),
      sessionCrypto,
      clientSessionId: request.from
    });
    engine.products.syncable.tonConnect.deleteActiveRemoteRequest(request.from);
    return;
  }

  sendTonConnectResponse({
    response: { result: result?.toBoc({ idx: false }).toString('base64') ?? '', id: request.id },
    sessionCrypto,
    clientSessionId: request.from
  });
  engine.products.syncable.tonConnect.deleteActiveRemoteRequest(request.from);
}

export const prepareTonConnectRequest = (request: { from: string } & SendTransactionRequest, engine: Engine) => {
  const params = JSON.parse(request.params[0]) as SignRawParams;

  const isValidRequest =
    params && typeof params.valid_until === 'number' &&
    Array.isArray(params.messages) &&
    params.messages.every((msg) => !!msg.address && !!msg.amount);

  const session = engine.products.syncable.tonConnect.getConnectionByClientSessionId(request.from);
  if (!session) {
    engine.products.syncable.tonConnect.deleteActiveRemoteRequest(request.from);
    Alert.alert(t('common.error'), t('products.tonConnect.errors.connection'));
    return;
  }
  const sessionCrypto = new SessionCrypto(session.sessionKeyPair);

  if (!isValidRequest) {
    engine.products.syncable.tonConnect.deleteActiveRemoteRequest(request.from);
    sendTonConnectResponse({
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
    engine.products.syncable.tonConnect.deleteActiveRemoteRequest(request.from);
    sendTonConnectResponse({
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

  const app = engine.products.syncable.tonConnect.findConnectedAppByClientSessionId(request.from);

  const messages = [];
  for (const message of params.messages) {
    try {
      const msg = {
        amount: toNano(fromNano(message.amount)),
        target: message.address,
        amountAll: false,
        payload: message.payload ? Cell.fromBoc(Buffer.from(message.payload, 'base64'))[0] : null,
        stateInit: message.stateInit ? Cell.fromBoc(Buffer.from(message.stateInit, 'base64'))[0] : null
      }
      messages.push(msg);
    } catch (error) {
      warn(error);
    }
  }

  return {
    request,
    sessionCrypto,
    messages,
    app
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
