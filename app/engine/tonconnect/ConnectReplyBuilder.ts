import bs58 from 'bs58';
import {
  CHAIN,
  ConnectItem,
  ConnectItemReply,
  ConnectRequest,
  TonAddressItemReply,
  TonProofItemReply,
} from '@tonconnect/protocol';
import naclUtils from 'tweetnacl-util';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { Address } from '@ton/core';
import { Int64LE } from 'int64-buffer';
import { sha256_sync } from '@ton/crypto';
import { getTimeSec } from '../../utils/getTimeSec';
import { extractDomain } from '../utils/extractDomain';
import { AppManifest } from '../api/fetchManifest';
import { normalizeUrl } from '../../utils/url/resolveUrl';
import { PublicKey } from '@solana/web3.js';
export type SolanaProofItem = {
  name: 'solana_proof';
  payload: string;
}

export type ExtendedConnectItem = ConnectItem | SolanaProofItem;
export type ExtendedConnectItemReply = TonAddressItemReply | TonProofItemReply | SolanaProofItemReply;

export type ExtendedConnectRequest = {
  manifestUrl: string;
  items: ExtendedConnectItem[];
}

export type SolanaProofItemReply = {
  name: 'solana_proof';
  proof: {
    timestamp: number;
    domain: {
      lengthBytes: number;
      value: string;
    };
    signature: string;
    payload: string;
  };
}

export class ConnectReplyBuilder {
  request: ExtendedConnectRequest;

  manifest: AppManifest;

  constructor(request: ExtendedConnectRequest, manifest: AppManifest) {
    this.request = request;
    this.manifest = manifest;
  }

  private static getNetwork(isTestnet: boolean): CHAIN {
    return isTestnet ? CHAIN.TESTNET : CHAIN.MAINNET;
  }

  private createTonProofItem(
    address: string,
    secretKey: Uint8Array,
    payload: string,
  ): TonProofItemReply {
    const timestamp = getTimeSec();
    const timestampBuffer = new Int64LE(timestamp).toBuffer();
    const normalizedUrl = normalizeUrl(this.manifest.url) ?? this.manifest.url;
    const domain = extractDomain(normalizedUrl);
    const domainBuffer = Buffer.from(domain);
    const domainLengthBuffer = Buffer.allocUnsafe(4);
    domainLengthBuffer.writeInt32LE(domainBuffer.byteLength);

    const [workchain, addrHash] = address.split(':');

    const addressWorkchainBuffer = Buffer.allocUnsafe(4);
    addressWorkchainBuffer.writeInt32BE(Number(workchain));

    const addressBuffer = Buffer.concat([
      addressWorkchainBuffer,
      Buffer.from(addrHash, 'hex'),
    ]);

    const messageBuffer = Buffer.concat([
      Buffer.from('ton-proof-item-v2/'),
      addressBuffer,
      domainLengthBuffer,
      domainBuffer,
      timestampBuffer,
      Buffer.from(payload),
    ]);

    const message = sha256_sync(messageBuffer);

    const bufferToSign = Buffer.concat([
      Buffer.from('ffff', 'hex'),
      Buffer.from('ton-connect'),
      message,
    ]);

    const signed = nacl.sign.detached(
      sha256_sync(bufferToSign),
      secretKey,
    );

    const signature = naclUtils.encodeBase64(signed);

    return {
      name: 'ton_proof',
      proof: {
        timestamp,
        domain: {
          lengthBytes: domainBuffer.byteLength,
          value: domain,
        },
        signature,
        payload
      },
    };
  }

  private createSolanaProofItem(
    publicKey: PublicKey,
    secretKey: Uint8Array,
    payload: string,
  ): SolanaProofItemReply {
    const timestamp = getTimeSec();
    const timestampBuffer = new Int64LE(timestamp).toBuffer();
    const normalizedUrl = normalizeUrl(this.manifest.url) ?? this.manifest.url;
    const domain = extractDomain(normalizedUrl);
    const domainBuffer = Buffer.from(domain);
    const domainLengthBuffer = Buffer.allocUnsafe(4);
    domainLengthBuffer.writeInt32LE(domainBuffer.byteLength);

    const messageBuffer = Buffer.concat([
      Buffer.from('ton-proof-item-v2/'),
      publicKey.toBuffer(),
      domainLengthBuffer,
      domainBuffer,
      timestampBuffer,
      Buffer.from(payload),
    ]);

    const message = sha256_sync(messageBuffer);

    const bufferToSign = Buffer.concat([
      Buffer.from('ffff', 'hex'),
      Buffer.from('ton-connect'),
      message,
    ]);

    const signed = nacl.sign.detached(
      sha256_sync(bufferToSign),
      secretKey,
    );

    // const signature = naclUtils.encodeBase64(signed);
    const signature = bs58.encode(signed);

    return {
      name: 'solana_proof',
      proof: {
        timestamp,
        domain: {
          lengthBytes: domainBuffer.byteLength,
          value: domain,
        },
        signature,
        payload,
      },
    };
  }

  createReplyItems(addr: string, privateKey: Uint8Array, publicKey: Uint8Array, walletStateInit: string, isTestnet: boolean): ExtendedConnectItemReply[] {
    const address = Address.parse(addr).toRawString();

    const replyItems = this.request.items.map((requestItem): ExtendedConnectItemReply => {
      switch (requestItem.name) {
        case 'ton_addr':
          return {
            name: 'ton_addr',
            address,
            network: ConnectReplyBuilder.getNetwork(isTestnet),
            walletStateInit,
            publicKey: Buffer.from(publicKey).toString('hex'),
          };

        case 'ton_proof':
          return this.createTonProofItem(address, privateKey, requestItem.payload);

        case 'solana_proof':
          const solanaPublicKey = new PublicKey(publicKey);
          return this.createSolanaProofItem(solanaPublicKey, privateKey, requestItem.payload);

        default:
          throw new Error('Unsupported method');
      }
    });

    return replyItems;
  }
}
