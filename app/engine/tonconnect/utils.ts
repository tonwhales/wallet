import { ConnectRequest } from '@tonconnect/protocol';
import { MIN_PROTOCOL_VERSION } from './constants';
import { SignBinaryPayload, SignCellPayload, SignTextPayload, WebViewBridgeMessageType } from './types';
import { t } from '../../i18n/t';
import { Address, beginCell, Cell } from '@ton/core';
import { sha256_sync } from '@ton/crypto';
import { crc32 } from '../../utils/crc32';
import { toASCII } from 'punycode';

export function resolveAuthError(error: Error) {
  switch ((error as Error)?.message) {
    case 'Invalid key':
      return t('products.tonConnect.errors.invalidKey');
    case 'Invalid session':
      return t('products.tonConnect.errors.invalidSession');
    case 'Invalid testnet flag':
      return t('products.tonConnect.errors.invalidTestnetFlag');
    case 'Already completed':
      return t('products.tonConnect.errors.alreadyCompleted');
    default:
      return t('products.tonConnect.errors.unknown');
  }
}

export function isHexString(str: string): boolean {
  const hexRegex = /^[0-9a-fA-F]+$/;
  return hexRegex.test(str) && str.length % 2 === 0;
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


/**
 * Convert a human-readable domain (e.g. "ton-connect.github.io")
 * into the TON DNS internal byte representation defined in TEP-81.
 *
 * Rules (TEP-81 §“Domain names” → §“Domain internal representation”):
 *   • UTF-8 string ≤ 126 bytes; bytes 0x00–0x20 are forbidden. :contentReference[oaicite:0]{index=0}
 *   • Split by ".", reverse the order, append 0x00 after every label
 *     (“google.com” ⇒ “com\0google\0”). :contentReference[oaicite:1]{index=1}
 *   • Resulting byte array must fit into a Cell (n ≤ 127). :contentReference[oaicite:2]{index=2}
 *
 * The helper returns both:
 *   • `Buffer` — raw bytes, convenient for hashing/debugging
 *   • `Cell`   — ready for `dnsresolve` calls via @ton/core
 */

export function encodeDnsName(domain: string): Buffer {
  if (!domain) {
    throw new Error('Domain must be non-empty');
  }

  // Normalise (lower-case, strip trailing dot) – recommended for interop
  let norm = domain.toLowerCase();
  if (norm.endsWith('.')) norm = norm.slice(0, -1);

  // Special case: single dot (“.”) ⇒ self-reference ⇒ single 0x00
  if (norm === '') {
    return Buffer.from([0]);
  }

  // Split & validate labels
  const labelsAscii = norm.split('.').map((lbl) => {
    if (lbl.length === 0) {
      throw new Error('Empty label ("..") not allowed');
    }
    // IDN: convert Unicode → punycode ASCII (xn--…)
    const ascii = toASCII(lbl);
    // Disallow bytes 0x00–0x20 and label > 63 chars (classic DNS rule)
    if (ascii.length > 63 || /[\x00-\x20]/.test(ascii)) {
      throw new Error(`Invalid label "${lbl}"`);
    }
    return ascii;
  });

  // Build byte array: reverse order + 0x00 after each label
  const byteChunks: number[] = [];
  for (const label of labelsAscii.reverse()) {
    byteChunks.push(...Buffer.from(label, 'utf8'), 0);
  }
  const bytes = Buffer.from(byteChunks);

  if (bytes.length > 126) {
    throw new Error(
      `Encoded name is ${bytes.length} bytes; TEP-81 allows at most 126`
    );
  }

  return bytes;
}

/**
 * Creates hash for text or binary payload.
 * Message format:
 * message = 0xffff || "ton-connect/sign-data/" || workchain || address_hash || domain_len || domain || timestamp || payload
 */
export function createTextBinaryHash(
  payload: SignTextPayload | SignBinaryPayload,
  parsedAddr: Address,
  domain: string,
  timestamp: number
): Buffer {
  // Create workchain buffer
  const wcBuffer = Buffer.alloc(4);
  wcBuffer.writeInt32BE(parsedAddr.workChain);

  // Create domain buffer
  const domainBuffer = Buffer.from(domain, 'utf8');
  const domainLenBuffer = Buffer.alloc(4);
  domainLenBuffer.writeUInt32BE(domainBuffer.length);

  // Create timestamp buffer
  const tsBuffer = Buffer.alloc(8);
  tsBuffer.writeBigUInt64BE(BigInt(timestamp));

  // Create payload buffer
  const typePrefix = payload.type === 'text' ? 'txt' : 'bin';
  const content = payload.type === 'text' ? payload.text : payload.bytes;
  const encoding = payload.type === 'text' ? 'utf8' : 'base64';

  const payloadPrefix = Buffer.from(typePrefix);
  const payloadBuffer = Buffer.from(content, encoding);
  const payloadLenBuffer = Buffer.alloc(4);
  payloadLenBuffer.writeUInt32BE(payloadBuffer.length);

  // Build message
  const message = Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from("ton-connect/sign-data/"),
    wcBuffer,
    parsedAddr.hash,
    domainLenBuffer,
    domainBuffer,
    tsBuffer,
    payloadPrefix,
    payloadLenBuffer,
    payloadBuffer,
  ]);

  // Hash message with sha256
  return sha256_sync(message);
}

/**
* Creates hash for Cell payload according to TON Connect specification.
*/
export function createCellHash(
  payload: SignCellPayload,
  parsedAddr: Address,
  domain: string,
  timestamp: number
): Buffer {
  const cell = Cell.fromBase64(payload.cell);
  const schemaHash = crc32(Buffer.from(payload.schema, 'utf8')) >>> 0; // unsigned crc32 hash
  const encodedDomain = encodeDnsName(domain).toString('utf8');

  const message = beginCell()
    .storeUint(0x75569022, 32) // prefix
    .storeUint(schemaHash, 32) // schema hash
    .storeUint(timestamp, 64) // timestamp
    .storeAddress(parsedAddr) // user wallet address
    .storeStringRefTail(encodedDomain) // app domain
    .storeRef(cell) // payload cell
    .endCell();

  // return Buffer.from(message.hash());
  return message.hash();
}