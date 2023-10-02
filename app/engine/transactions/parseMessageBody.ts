import { Address, Cell } from "@ton/core";
import { crc32str } from "../../utils/crc32";

export type SupportedMessage =
    {
        type: 'jetton::excesses',
        data: {
            queryId: number;
        }
    }
    | {
        type: 'jetton::transfer',
        data: {
            queryId: number;
            amount: bigint;
            destination: Address;
            responseDestination: Address;
            customPayload: Cell | null;
            forwardTonAmount: bigint;
            forwardPayload: Cell;
        }
    } | {
        type: 'jetton::transfer_notification',
        data: {
            queryId: number;
            amount: bigint;
            sender: Address;
            forwardPayload: Cell;
        }
    } | {
        type: 'deposit',
        data: {
            queryId: number;
            gasLimit: bigint;
        }
    } | {
        type: 'deposit::ok',
        data: {}
    } | {
        type: 'withdraw',
        data: {
            stake: bigint;
            queryId: number;
            gasLimit: bigint;
        }
    } | {
        type: 'withdraw::delayed',
        data: {}
    } | {
        type: 'withdraw::ok',
        data: {}
    };

export function parseMessageBody(payload: Cell): SupportedMessage | null {
    // Load OP
    let sc = payload.beginParse();
    if (sc.remainingBits < 32) {
        return null;
    }
    let op = sc.loadUint(32);
    if (op === 0) {
        return null;
    }

    switch (op) {
        case 0xd53276db: {
            let queryId = sc.loadUint(64);
            return {
                type: 'jetton::excesses',
                data: { queryId }
            };
        }
        case 0xf8a7ea5: {
            let queryId = sc.loadUint(64);
            let amount = sc.loadCoins();
            let destination = sc.loadAddress();
            let responseDestination = sc.loadAddress();
            let customPayload = sc.loadBit() ? sc.loadRef() : null;
            let forwardTonAmount = sc.loadCoins();
            let forwardPayload = sc.loadBit() ? sc.loadRef() : sc.asCell();
            return {
                type: 'jetton::transfer',
                data: {
                    queryId,
                    amount,
                    destination,
                    responseDestination,
                    customPayload,
                    forwardTonAmount,
                    forwardPayload
                }
            };
        }
        case 0x7362d09c: {
            let queryId = sc.loadUint(64);
            let amount = sc.loadCoins();
            let sender = sc.loadAddress();
            let forwardPayload = sc.loadBit() ? sc.loadRef() : sc.asCell();
            return {
                type: 'jetton::transfer_notification',
                data: {
                    queryId,
                    amount,
                    sender,
                    forwardPayload
                }
            };
        }
        case crc32str('op::stake_deposit'): {
            let queryId = sc.loadUint(64);
            let gasLimit = sc.loadCoins();
            return {
                type: 'deposit',
                data: {
                    queryId,
                    gasLimit,
                }
            };
        }
        case crc32str('op::stake_deposit::response'): {
            return {
                type: 'deposit::ok',
                data: {}
            };
        }
        case crc32str('op::stake_withdraw'): {
            let queryId = sc.loadUint(64);
            let gasLimit = sc.loadCoins();
            const stake = sc.loadCoins();
            return {
                type: 'withdraw',
                data: {
                    stake,
                    queryId,
                    gasLimit
                }
            };
        }
        case crc32str('op::stake_withdraw::delayed'): {
            return {
                type: 'withdraw::delayed',
                data: {}
            };
        }
        case crc32str('op::stake_withdraw::response'): {
            return {
                type: 'withdraw::ok',
                data: {}
            };
        }
        default:
            return null;
    }
}