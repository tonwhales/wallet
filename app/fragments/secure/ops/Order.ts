import { Address, beginCell, Cell, comment, fromNano, toNano } from "@ton/core";
import { OperationType } from "../../../engine/transactions/parseMessageBody";
import { TonPayloadFormat } from '@ton-community/ton-ledger';
import { SignRawMessage } from "../../../engine/tonconnect/types";
import { PublicKey } from "@solana/web3.js";

export type Order = {
    type: 'order';
    domain?: string;
    messages: {
        target: string;
        amount: bigint;
        amountAll: boolean;
        payload: Cell | null;
        stateInit: Cell | null;
        extraCurrency?: {
            [k: number]: bigint;
        }
    }[],
    app?: {
        domain: string,
        title: string,
        url: string
    },
    validUntil?: number | null
};

export type LedgerOrder = {
    type: 'ledger';
    target: string;
    domain?: string;
    amount: bigint;
    amountAll: boolean;
    payload: TonPayloadFormat | null;
    stateInit: Cell | null;
    app?: {
        domain: string,
        title: string
    },
    validUntil?: number | null
};

export type SolanaOrderApp = {
    domain?: string;
    image?: string | null;
    label?: string | null;
    message?: string | null;
}

export type SolanaOrder = {
    type: 'solana';
    target: string;
    token?: {
        mint: string;
        symbol?: string;
        decimals?: number;
    } | null;
    amount: bigint;
    comment: string | null;
    app?: SolanaOrderApp;
    reference?: PublicKey[] | null;
}


export function createLedgerJettonOrder(args: {
    wallet: Address,
    target: string,
    domain?: string,
    responseTarget: Address,
    text: string | null,
    amount: bigint,
    tonAmount: bigint,
    txAmount: bigint,
    payload: Cell | null,
    validUntil?: number | null
}, isTestnet: boolean): LedgerOrder {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = comment(args.text);
        payload = c;
    }

    // Create body
    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;

    return {
        type: 'ledger',
        target: args.wallet.toString({ testOnly: isTestnet }),
        domain: args.domain,
        amount: args.txAmount,
        payload: {
            type: 'jetton-transfer',
            queryId: null,
            amount: args.amount,
            destination: Address.parse(args.target),
            responseDestination: args.responseTarget,
            customPayload: null,
            forwardAmount: args.tonAmount,
            forwardPayload: payload,
            knownJetton: null
        },
        amountAll: false,
        stateInit: null,
    }
}

export function createUnsafeLedgerOrder(msg: SignRawMessage): LedgerOrder {
    let payload: TonPayloadFormat | null = null;
    if (msg.payload) {
        payload = { type: 'unsafe', message: Cell.fromBoc(Buffer.from(msg.payload, 'base64'))[0] };
    }

    return {
        type: 'ledger',
        target: msg.address,
        amount: toNano(fromNano(msg.amount)),
        amountAll: false,
        payload,
        stateInit: msg.stateInit ? Cell.fromBoc(Buffer.from(msg.stateInit, 'base64'))[0] : null,
    }
}

export function createSimpleLedgerOrder(args: {
    target: string,
    domain?: string,
    text: string | null,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string
    },
    validUntil?: number | null
}): LedgerOrder {

    // Resolve payload
    let payload: TonPayloadFormat | null = null;
    if (args.payload) {
        payload = { type: 'unsafe', message: args.payload };
    } else if (args.text) {
        payload = { type: 'comment', text: args.text };
    }

    return {
        type: 'ledger',
        target: args.target,
        domain: args.domain,
        amount: args.amount,
        amountAll: args.amountAll,
        payload: payload ? payload : null,
        stateInit: args.stateInit,
        app: args.app
    }
}

export function createOrder(args: {
    target: string,
    domain?: string,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string,
        url: string
    },
    extraCurrency?: {
        [k: number]: bigint;
    },
    validUntil?: number | null
}) {
    return {
        messages: [{
            target: args.target,
            amount: args.amount,
            amountAll: args.amountAll,
            payload: args.payload,
            stateInit: args.stateInit,
            extraCurrency: args.extraCurrency
        }],
        domain: args.domain,
        app: args.app,
        validUntil: args.validUntil
    };
}

export function createSimpleOrder(args: {
    target: string,
    domain?: string,
    text: string | null,
    amount: bigint,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string,
        url: string
    },
    extraCurrency?: {
        [k: number]: bigint;
    },
    validUntil?: number | null
}): Order {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = comment(args.text);
        payload = c;
    }

    return {
        type: 'order',
        ...createOrder({
            target: args.target,
            domain: args.domain,
            payload,
            amount: args.amount,
            amountAll: args.amountAll,
            stateInit: args.stateInit,
            app: args.app,
            extraCurrency: args.extraCurrency,
            validUntil: args.validUntil
        })
    };
}

export function createJettonOrder(args: {
    wallet: Address,
    target: string,
    domain?: string,
    responseTarget: Address,
    text: string | null,
    amount: bigint,
    tonAmount: bigint,
    txAmount: bigint,
    customPayload: Cell | null,
    payload: Cell | null,
    stateInit: Cell | null,
    validUntil?: number | null
}, isTestnet: boolean): Order {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = comment(args.text);
        payload = c;
    }

    // Create body
    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;
    const msg = beginCell()
        .storeUint(OperationType.JettonTransfer, 32)
        .storeUint(0, 64)
        .storeCoins(args.amount)
        .storeAddress(Address.parse(args.target))
        .storeAddress(args.responseTarget)
        .storeMaybeRef(args.customPayload)
        .storeCoins(args.tonAmount)
        .storeMaybeRef(payload)
        .endCell();

    return {
        type: 'order',
        ...createOrder({
            target: args.wallet.toString({ testOnly: isTestnet }),
            domain: args.domain,
            payload: msg,
            amount: args.txAmount,
            amountAll: false,
            stateInit: args.stateInit,
            validUntil: args.validUntil
        })
    };
}