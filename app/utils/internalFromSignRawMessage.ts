import { Address, Cell, MessageRelaxed, internal, loadStateInit } from "@ton/core";

export function internalFromSignRawMessage(message: {
    target: string;
    amount: bigint;
    amountAll: boolean;
    payload: Cell | null;
    stateInit: Cell | null;
}, bounce?: boolean) {
    let to: Address;
    try {
        to = Address.parse(message.target);
    } catch (e) {
        return null;
    }

    const init = message.stateInit
        ? loadStateInit(message.stateInit.asSlice())
        : null;

    return internal({
        to,
        value: message.amount,
        bounce: bounce ?? true,
        body: message.payload,
        init
    });
}