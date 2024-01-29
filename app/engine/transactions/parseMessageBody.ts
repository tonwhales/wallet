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
            responseDestination: Address | null;
            customPayload: Cell | null;
            forwardTonAmount: bigint;
            forwardPayload: Cell;
        }
    } | {
        type: 'jetton::transfer_notification',
        data: {
            queryId: number;
            amount: bigint;
            sender: Address | null;
            forwardPayload: Cell | null;
        }
    } | {
        type: 'whales-staking::deposit',
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

export enum OperationType {
    JettonExcesses = 0xd53276db,
    JettonTransfer = 0xf8a7ea5,
    JettonTransferNotification = 0x7362d09c,
    WhalesStakingDeposit = crc32str('op::stake_deposit'),
    WhalesStakingDepositResponse = crc32str('op::stake_deposit::response'),
    WhalesStakingWithdraw = crc32str('op::stake_withdraw'),
    WhalesStakingWithdrawDelayed = crc32str('op::stake_withdraw::delayed'),
    WhalesStakingWithdrawResponse = crc32str('op::stake_withdraw::response'),
}

export function parseMessageBody(payload: Cell): SupportedMessage | null {
    if (payload.isExotic) {
        return null;
    }
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
        case OperationType.JettonExcesses: {
            let queryId = sc.loadUint(64);
            return {
                type: 'jetton::excesses',
                data: { queryId }
            };
        }
        case OperationType.JettonTransfer: {
            let queryId = sc.loadUint(64);
            let amount = sc.loadCoins();
            let destination = sc.loadAddress();
            let responseDestination = sc.loadMaybeAddress();
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
        case OperationType.JettonTransferNotification: {
            let queryId = sc.loadUint(64);
            let amount = sc.loadCoins();
            let sender = sc.loadMaybeAddress();
            let forwardPayload: Cell | null = null;
            if (sc.remainingBits > 0) {
                forwardPayload = sc.loadBit() ? sc.loadRef() : sc.asCell();
            }
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
        case OperationType.WhalesStakingDeposit: {
            let queryId = sc.loadUint(64);
            let gasLimit = sc.loadCoins();
            return {
                type: 'whales-staking::deposit',
                data: {
                    queryId,
                    gasLimit,
                }
            };
        }
        case OperationType.WhalesStakingDepositResponse: {
            return {
                type: 'deposit::ok',
                data: {}
            };
        }
        case OperationType.WhalesStakingWithdraw: {
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
        case OperationType.WhalesStakingWithdrawDelayed: {
            return {
                type: 'withdraw::delayed',
                data: {}
            };
        }
        case OperationType.WhalesStakingWithdrawResponse: {
            return {
                type: 'withdraw::ok',
                data: {}
            };
        }
        default:
            return null;
    }
}