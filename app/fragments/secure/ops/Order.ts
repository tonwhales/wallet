import BN from "bn.js";
import { Address, beginCell, Cell, CommentMessage } from "ton";
import { AppConfig } from "../../../AppConfig";
import { SignRawMessage } from "../../../engine/tonconnect/types";

export type Order = {
    domain?: string;
    messages: {
        target: string;
        amount: BN;
        amountAll: boolean;
        payload: Cell | null;
        stateInit: Cell | null;
    }[],
    app?: {
        domain: string,
        title: string,
    }
};

export function createOrder(args: {
    target: string,
    domain?: string,
    amount: BN,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string
    }
}) {
    return {
        type: 'final',
        messages: [{
            target: args.target,
            amount: args.amount,
            amountAll: args.amountAll,
            payload: args.payload,
            stateInit: args.stateInit,
        }],
        domain: args.domain,
        app: args.app
    };
}

export function createSimpleOrder(args: {
    target: string,
    domain?: string,
    text: string | null,
    amount: BN,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null,
    app?: {
        domain: string,
        title: string
    }
}): Order {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = new Cell();
        new CommentMessage(args.text).writeTo(c);
        payload = c;
    }

    return createOrder({
        target: args.target,
        domain: args.domain,
        payload,
        amount: args.amount,
        amountAll: args.amountAll,
        stateInit: args.stateInit,
        app: args.app
    });
}

export function createJettonOrder(args: {
    wallet: Address,
    target: string,
    domain?: string,
    responseTarget: Address,
    text: string | null,
    amount: BN,
    tonAmount: BN,
    txAmount: BN,
    payload: Cell | null
}): Order {

    // Resolve payload
    let payload: Cell | null = null;
    if (args.payload) {
        payload = args.payload;
    } else if (args.text) {
        let c = new Cell();
        new CommentMessage(args.text).writeTo(c);
        payload = c;
    }

    // Create body
    // transfer#f8a7ea5 query_id:uint64 amount:(VarUInteger 16) destination:MsgAddress
    //              response_destination:MsgAddress custom_payload:(Maybe ^Cell)
    //              forward_ton_amount:(VarUInteger 16) forward_payload:(Either Cell ^Cell)
    //              = InternalMsgBody;
    const msg = beginCell()
        .storeUint(0xf8a7ea5, 32)
        .storeUint(0, 64)
        .storeCoins(args.amount)
        .storeAddress(Address.parse(args.target))
        .storeAddress(args.responseTarget)
        .storeRefMaybe(null)
        .storeCoins(args.tonAmount)
        .storeRefMaybe(payload)
        .endCell();


    return createOrder({
        target: args.wallet.toFriendly({ testOnly: AppConfig.isTestnet }),
        domain: args.domain,
        payload: msg,
        amount: args.txAmount,
        amountAll: false,
        stateInit: null
    });
}