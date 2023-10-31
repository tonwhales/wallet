import { CHAIN } from '@tonconnect/protocol';
import * as t from 'io-ts';
import * as c from '../utils/codecs';
import { CONNECT_ITEM_ERROR_CODES, TonConnectBridgeType } from './types';

export const tonProofItemReplyErrorCodec = t.type({
    name: t.literal('ton_proof'),
    error: t.intersection([
        t.type({
            code: c.createEnumType<CONNECT_ITEM_ERROR_CODES>(CONNECT_ITEM_ERROR_CODES, 'CONNECT_ITEM_ERROR_CODES'),
        }),
        t.partial({
            message: t.union([t.string, t.undefined]),
        })
    ])
});

export const tonProofItemReplyCodec = t.union([
    t.type({
        name: t.literal('ton_proof'),
        proof: t.type({
            timestamp: t.number,
            domain: t.type({
                lengthBytes: t.number,
                value: t.string
            }),
            payload: t.string,
            signature: t.string,
        })
    }),
    tonProofItemReplyErrorCodec
]);

export const connectItemReplyCodec = t.union([
    t.type({
        name: t.literal('ton_addr'),
        address: t.string,
        network: c.createEnumType<CHAIN>(CHAIN, 'CHAIN'),
        walletStateInit: t.string,
    }),
    tonProofItemReplyCodec,
]);

export const appConnectionCodec = t.union([
    t.type({
        type: t.literal(TonConnectBridgeType.Remote),
        sessionKeyPair: t.type({
            publicKey: t.string,
            secretKey: t.string,
        }),
        clientSessionId: t.string,
        replyItems: t.array(connectItemReplyCodec)
    }),
    t.type({
        type: t.literal(TonConnectBridgeType.Injected),
        replyItems: t.array(connectItemReplyCodec)
    }),
]);

export const pendingSendTransactionRpcRequestCodec = t.type({
    method: t.literal('sendTransaction'),
    params: t.array(t.string),
    id: t.string,
    from: t.string
});

export const transactionRpcRequestCodec = t.type({
    method: t.literal('sendTransaction'),
    params: t.tuple([t.string]),
    id: t.union([t.number, t.string])
});

export const connectItemCodec = t.union([
    t.type({
        name: t.literal('ton_proof'),
        payload: t.string
    }),
    t.type({
        name: t.literal('ton_addr')
    })
]);

export const connectRequestCodec = t.type({
    manifestUrl: t.string,
    items: t.array(connectItemCodec)
});