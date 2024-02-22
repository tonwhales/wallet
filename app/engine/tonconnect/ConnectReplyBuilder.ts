
import {
  CHAIN,
  ConnectItem,
  ConnectItemReply,
  ConnectRequest,
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

export class ConnectReplyBuilder {
  request: ConnectRequest;

  manifest: AppManifest;

  constructor(request: ConnectRequest, manifest: AppManifest) {
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
    const domain = extractDomain(this.manifest.url);
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
        payload,
      },
    };
  }

  createReplyItems(addr: string, privateKey: Uint8Array, publicKey: Uint8Array, walletStateInit: string, isTestnet: boolean): ConnectItemReply[] {
    const address = Address.parse(addr).toRawString();

    const replyItems = this.request.items.map((requestItem): ConnectItemReply => {
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

        default:
          throw new Error('Unsupported method');
      }
    });

    return replyItems;
  }
}
