import BN from "bn.js";
import { Address, beginCell, Cell, CommentMessage, toNano } from "ton";
import { AppConfig } from "../../../AppConfig";

export type Order = {
    target: string;
    amount: BN;
    amountAll: boolean;
    payload: Cell | null;
    stateInit: Cell | null;
    transferCell?: boolean
};

export function createOrder(args: {
    target: string,
    amount: BN,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null
}) {
    return {
        type: 'final',
        target: args.target,
        amount: args.amount,
        amountAll: args.amountAll,
        payload: args.payload,
        stateInit: args.stateInit
    };
}

export function createSimpleOrder(args: {
    target: string,
    text: string | null,
    amount: BN,
    amountAll: boolean,
    payload: Cell | null,
    stateInit: Cell | null
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
        payload,
        amount: args.amount,
        amountAll: args.amountAll,
        stateInit: args.stateInit
    });
}

export function createJettonOrder(args: {
    wallet: Address,
    target: string,
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
        .storeRefMaybe(payload)
        .storeCoins(args.tonAmount)
        .storeBit(false)
        .endCell();


    return createOrder({
        target: args.wallet.toFriendly({ testOnly: AppConfig.isTestnet }),
        payload: msg,
        amount: args.txAmount,
        amountAll: false,
        stateInit: null
    });
}