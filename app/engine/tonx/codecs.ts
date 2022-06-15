import * as t from 'io-ts';

export type TonXRequest<T> = {
    id: number,
    type: string,
    data: T
};

export type TonXResponse<T> = {
    id: number,
    data?: T
};

export type TonXMessage<T> = {
    id: number,
    type: 'session_get' | 'session_new' | 'session_wait' | 'command_new' | 'command_get',
    data: T
}

export const tonXMessageCodec = t.type({
    id: t.number,
    type: t.string,
    data: t.unknown
});

export const newSessionCodec = t.type({
    key: t.string,
    testnet: t.boolean,
    name: t.string,
    url: t.string
});

export const getSessionCodec = t.type({
    id: t.string
});

export const waitSessionCodec = t.type({
    id: t.string,
    lastUpdated: t.union([t.number, t.undefined])
});

export const newCommandCodec = t.type({
    job: t.string
});

export const getCommandCodec = t.type({
    appk: t.string
});

export type CommandResponce = {
    state: 'empty',
    now: number
} | {
    state: 'completed',
    job: string,
    created: number,
    updated: number,
    result: string,
    now: number
} | {
    state: 'submitted' | 'expired' | 'rejected',
    job: string,
    created: number,
    updated: number,
    now: number
}

export type TonXSession = {
    state: 'not_found'
} | {
    state: 'initing',
    name: string,
    url: string,
    testnet: boolean,
    created: number,
    updated: number,
    revoked: boolean
} | {
    state: 'ready',
    name: string,
    url: string,
    wallet: {
        address: string,
        endpoint: string,
        walletConfig: string,
        walletType: string,
        walletSig: string,
        appPublicKey: string
    },
    testnet: boolean,
    created: number,
    updated: number,
    revoked: boolean
};

export const sessionStateCodec = t.union([
    t.type({
        state: t.literal('not_found')
    }),
    t.type({
        state: t.literal('initing'),
        name: t.string,
        url: t.string,
        testnet: t.boolean,
        created: t.number,
        updated: t.number,
        revoked: t.boolean
    }),
    t.type({
        state: t.literal('ready'),
        name: t.string,
        url: t.string,
        wallet: t.type({
            address: t.string,
            endpoint: t.string,
            walletConfig: t.string,
            walletType: t.string,
            walletSig: t.string,
            appPublicKey: t.string
        }),
        testnet: t.boolean,
        created: t.number,
        updated: t.number,
        revoked: t.boolean
    })
]);