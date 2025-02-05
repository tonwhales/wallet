import { RpcMethod, SEND_TRANSACTION_ERROR_CODES, WalletResponse } from "@tonconnect/protocol";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { SignRawParams } from "../../tonconnect/types";
import { useTypedNavigation } from "../../../utils/useTypedNavigation";
import { parseBody } from "../../transactions/parseWalletTransaction";
import { Address, Cell, fromNano, toNano } from "@ton/core";
import { parseAnyStringAddress } from "../../../utils/parseAnyStringAddress";
import { useBounceableWalletFormat, useNetwork } from "..";
import { OperationType } from "../../transactions/parseMessageBody";
import { resolveBounceableTag } from "../../../utils/resolveBounceableTag";
import { createLedgerJettonOrder, createSimpleLedgerOrder, LedgerOrder } from "../../../fragments/secure/ops/Order";

export function useHoldersLedgerTonconnectHandler<T extends RpcMethod>(address: string): (id: string, params: SignRawParams, callback: (response: WalletResponse<T>) => void, domain: string) => void {
    const ledgerContext = useLedgerTransport();
    const navigation = useTypedNavigation();
    const { isTestnet } = useNetwork();
    const [bounceableFormat] = useBounceableWalletFormat();

    return async (id: string, params: SignRawParams, callback: (response: WalletResponse<T>) => void, domain: string) => {

        if (!ledgerContext?.tonTransport) {
            ledgerContext?.onShowLedgerConnectionError();
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Ledger not connected',
                },
                id
            });
            return;
        }

        if (params.messages.length === 0 || params.messages.length > 1) {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Invalid messages count',
                },
                id
            });
            return;
        }

        const msg = params.messages[0];
        const payload = msg.payload ? Cell.fromBoc(Buffer.from(msg.payload, 'base64'))[0] : null
        const stateInit = msg.stateInit ? Cell.fromBoc(Buffer.from(msg.stateInit, 'base64'))[0] : null

        let target: {
            isBounceable: boolean;
            isTestOnly: boolean;
            address: Address;
        };

        try {
            target = parseAnyStringAddress(msg.address, isTestnet);
        } catch {
            callback({
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                    message: 'Invalid address',
                },
                id
            });
            return;
        }

        let jettonTransfer: {
            queryId: number | bigint;
            amount: bigint;
            destination: {
                isBounceable: boolean;
                isTestOnly: boolean;
                address: Address;
            };
            responseDestination: Address | null;
            customPayload: Cell | null;
            stateInit: Cell | null;
            forwardTonAmount: bigint;
            forwardPayload: Cell | null;
            jettonWallet: Address;
        } | null = null;
        let jettonTarget: typeof target | null = null;

        // Parse payload
        if (payload) {
            const body = parseBody(payload);

            if (body && body.type === 'payload') {
                const cell = body.cell;
                const sc = cell?.beginParse();

                const resCallback: ((ok: boolean, result: Cell | null) => void) = (ok, result) => {
                    if (ok) {
                        callback({ result: { result: result?.toBoc()?.toString('base64') }, id });
                    } else {
                        callback({
                            error: {
                                code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
                                message: 'User rejected',
                            },
                            id
                        });
                    }
                }

                if (sc) {
                    if (sc.remainingBits > 32) {
                        let op = sc.loadUint(32);
                        // Jetton transfer op
                        if (op === OperationType.JettonTransfer) {
                            let queryId = sc.loadUintBig(64);
                            let jettonAmount = sc.loadCoins();
                            let jettonTargetAddress = sc.loadAddress();
                            let responseDestination = sc.loadMaybeAddress();
                            let customPayload = sc.loadBit() ? sc.loadRef() : null;
                            let forwardTonAmount = sc.loadCoins();
                            let forwardPayload = null;
                            if (sc.remainingBits > 0) {
                                forwardPayload = sc.loadMaybeRef() ?? sc.asCell();
                            }

                            const destination = Address.parseFriendly(jettonTargetAddress.toString({ testOnly: isTestnet, bounceable: bounceableFormat }));

                            jettonTransfer = {
                                queryId,
                                amount: jettonAmount,
                                destination,
                                responseDestination,
                                customPayload,
                                forwardTonAmount,
                                forwardPayload,
                                jettonWallet: target.address,
                                stateInit: stateInit
                            }

                            if (jettonTargetAddress) {
                                const bounceable = await resolveBounceableTag(jettonTargetAddress, { testOnly: isTestnet, bounceableFormat });
                                jettonTarget = Address.parseFriendly(jettonTargetAddress.toString({ testOnly: isTestnet, bounceable }));
                            }

                            const estim = toNano('0.1');

                            let order: LedgerOrder | null = null;
                            if (jettonTransfer) {
                                const txForwardAmount = toNano('0.05') + estim;
                                order = createLedgerJettonOrder({
                                    wallet: jettonTransfer.jettonWallet,
                                    target: jettonTransfer.destination.address.toString({ testOnly: isTestnet, bounceable: jettonTransfer.destination.isBounceable }),
                                    responseTarget: Address.parse(address),
                                    // text: commentString,
                                    text: null,
                                    amount: jettonTransfer.amount,
                                    tonAmount: 1n,
                                    txAmount: txForwardAmount,
                                    payload: null
                                }, isTestnet);
                            } else {
                                callback({
                                    error: {
                                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                                        message: 'Invalid jetton transfer',
                                    },
                                    id
                                });
                                return;
                            }

                            if (!order) {
                                callback({
                                    error: {
                                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                                        message: 'Invalid order',
                                    },
                                    id
                                });
                                return;
                            }

                            navigation.navigate('LedgerSignTransfer', { text: null, order, callback: resCallback });
                        } else if (op === OperationType.HoldersAccountTopUp) {
                            sc.loadUintBig(64);
                            const amount = sc.loadCoins();

                            const order = createSimpleLedgerOrder({
                                target: target.address.toString({ testOnly: isTestnet, bounceable: target.isBounceable }),
                                text: 'Top Up',
                                payload: null,
                                amount,
                                amountAll: false,
                                stateInit
                            });

                            navigation.navigate('LedgerSignTransfer', { text: null, order, callback: resCallback });
                        }
                    }
                }
            } else {
                callback({
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                        message: 'Invalid body type',
                    },
                    id
                });
            }
        }
    }
}