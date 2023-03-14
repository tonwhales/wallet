
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
import { AppConfig } from '../../AppConfig';
import { Address } from 'ton';
import { getTimeSec } from '../../utils/getTimeSec';
import { extractDomain } from '../utils/extractDomain';
import { AppManifest } from '../api/fetchManifest';
import { sha256_sync } from 'ton-crypto';

export class ConnectReplyBuilder {
  request: ConnectRequest;

  manifest: AppManifest;

  constructor(request: ConnectRequest, manifest: AppManifest) {
    this.request = request;
    this.manifest = manifest;
  }

  private static getNetwork() {
    return !AppConfig.isTestnet ? CHAIN.MAINNET : CHAIN.TESTNET;
  }

  private createTonProofItem(
    address: string,
    secretKey: Uint8Array,
    payload: string,
  ): TonProofItemReply {
    const timestamp = getTimeSec();
    let timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigInt64LE(BigInt(timestamp), 0);

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

  createReplyItems(addr: string, privateKey: Uint8Array, walletStateInit: string): ConnectItemReply[] {
    const address = Address.parse(addr).toString();

    const replyItems = this.request.items.map((requestItem): ConnectItemReply => {
      switch (requestItem.name) {
        case 'ton_addr':
          return {
            name: 'ton_addr',
            address,
            network: ConnectReplyBuilder.getNetwork(),
            walletStateInit,
          };

        case 'ton_proof':
          return this.createTonProofItem(address, privateKey, requestItem.payload);

        default:
          throw new Error('Unsupported method');
      }
    });

    return replyItems;
  }

  static createAutoConnectReplyItems(addr: string, walletStateInit: string): ConnectItemReply[] {
    const address = Address.parse(addr).toString();

    return [
      {
        name: 'ton_addr',
        address,
        network: ConnectReplyBuilder.getNetwork(),
        walletStateInit,
      },
    ];
  }
}
