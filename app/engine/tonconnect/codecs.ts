import * as t from 'io-ts';
import { z } from 'zod';

export const tonconnectRpcReqScheme = z.union([
    z.object({
        method: z.literal('sendTransaction'),
        params: z.tuple([z.string()]),
        id: z.union([z.number(), z.string()])
    }),
    z.object({
        method: z.literal('disconnect'),
        id: z.union([z.number(), z.string()])
    }),
    z.object({
        method: z.literal('signData'),
        params: z.tuple([z.string()]),
        id: z.union([z.number(), z.string()])
    })
]);

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