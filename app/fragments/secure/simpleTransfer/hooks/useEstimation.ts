import { contractFromPublicKey } from '../../../../engine/contractFromPublicKey';
import { backoff } from '../../../../utils/time';
import { AsyncLock } from 'teslabot';
import { getCurrentAddress } from '../../../../storage/appState';
import { MutableRefObject, useEffect, useMemo, useState } from 'react';
import { useClient4, useConfig, useNetwork } from '../../../../engine/hooks';
import { fetchSeqno } from '../../../../engine/api/fetchSeqno';
import { getLastBlock } from '../../../../engine/accountWatcher';
import { MessageRelaxed, loadStateInit, comment, internal, external, Cell, Address, SendMode, storeMessage, storeMessageRelaxed } from '@ton/core';
import { estimateFees } from '../../../../utils/estimateFees';
import { resolveLedgerPayload } from '../../../ledger/utils/resolveLedgerPayload';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { useLedgerTransport } from '../../../ledger/components/TransportContext';
import { useWalletVersion } from '../../../../engine/hooks/useWalletVersion';
import { WalletVersions } from '../../../../engine/types';
import { LedgerOrder, Order } from '../../ops/Order';
import { AccountLite } from '../../../../engine/hooks/accounts/useAccountLite';

type Options = {
    ledgerAddress?: Address;
    order: LedgerOrder | Order | null;
    stateInit: Cell | null;
    accountLite: AccountLite | null;
    commentString: string;
    hasGaslessTransfer?: boolean;
    jettonPayload?: {
        customPayload?: string | null;
        stateInit?: string | null;
    } | null;
    estimationRef: MutableRefObject<bigint | null>;
}

export const useEstimation = (options: Options) => {
    const {
        ledgerAddress,
        order,
        stateInit,
        accountLite,
        hasGaslessTransfer,
        jettonPayload,
        estimationRef,
        commentString,
    } = options

    const ledgerContext = useLedgerTransport();
    const network = useNetwork();
    const client = useClient4(network.isTestnet);

    const walletVersion = useWalletVersion();
    const isV5 = walletVersion === WalletVersions.v5R1;
    const supportsGaslessTransfer = hasGaslessTransfer && isV5;

    const [estimation, setEstimation] = useState<bigint | null>(estimationRef.current);

    // Estimate fee
    const config = useConfig();
    const lock = useMemo(() => new AsyncLock(), []);
    useEffect(() => {
        let ended = false;
        lock.inLock(async () => {
            await backoff('simple-transfer', async () => {
                if (ended) {
                    return;
                }

                // Load app state
                const currentAcc = getCurrentAddress();
                const address = ledgerAddress ?? currentAcc.address;

                let seqno = await fetchSeqno(client, await getLastBlock(), address);

                // Parse order
                let intMessage: MessageRelaxed;
                let sendMode: number = SendMode.IGNORE_ERRORS | SendMode.PAY_GAS_SEPARATELY;

                let storageStats: ({
                    lastPaid: number;
                    duePayment: string | null;
                    used: {
                        bits: number;
                        cells: number;
                        publicCells: number;
                    }
                } | null)[] = [];

                const block = await backoff('transfer', () => client.getLastBlock());

                if (!order) {
                    const internalStateInit = !!stateInit
                        ? loadStateInit(stateInit.asSlice())
                        : null;

                    const body = comment(commentString);

                    intMessage = internal({
                        to: address,
                        value: 0n,
                        init: internalStateInit,
                        bounce: false,
                        body,
                    });

                    const state = await backoff('transfer', () => client.getAccount(block.last.seqno, address));
                    storageStats = state.account.storageStat ? [state.account.storageStat] : [];
                } else {
                    if (order.type === 'order') {
                        const internalStateInit = !!order.messages[0].stateInit
                            ? loadStateInit(order.messages[0].stateInit.asSlice())
                            : null;

                        const body = order.messages[0].payload ? order.messages[0].payload : null;

                        intMessage = internal({
                            to: Address.parse(order.messages[0].target),
                            value: 0n,
                            init: internalStateInit,
                            bounce: false,
                            body,
                        });

                        const state = await backoff('transfer', () => client.getAccount(block.last.seqno, Address.parse(order.messages[0].target)));
                        storageStats = state.account.storageStat ? [state.account.storageStat] : [];

                        if (order.messages[0].amountAll) {
                            sendMode = SendMode.CARRY_ALL_REMAINING_BALANCE;
                        }
                    } else {
                        const internalStateInit = !!stateInit
                            ? loadStateInit(stateInit.asSlice())
                            : null;

                        const body = order.payload ? resolveLedgerPayload(order.payload) : comment(commentString);

                        intMessage = internal({
                            to: address,
                            value: 0n,
                            init: internalStateInit,
                            bounce: false,
                            body,
                        });

                        const state = await backoff('transfer', () => client.getAccount(block.last.seqno, address));
                        storageStats = state.account.storageStat ? [state.account.storageStat] : [];
                    }
                }

                // Load contract
                const pubKey = ledgerContext.addr?.publicKey ?? currentAcc.publicKey;
                const contract = await contractFromPublicKey(pubKey, walletVersion, network.isTestnet);

                const transferParams = {
                    seqno: seqno,
                    secretKey: Buffer.alloc(64),
                    sendMode,
                    messages: [intMessage],
                };

                // Create transfer
                const transfer = isV5
                    ? (contract as WalletContractV5R1).createTransfer(transferParams)
                    : (contract as WalletContractV4).createTransfer(transferParams);

                if (ended) {
                    return;
                }

                // Resolve fee
                if (config && accountLite && !supportsGaslessTransfer) {
                    const externalMessage = external({
                        to: contract.address,
                        body: transfer,
                        init: seqno === 0 ? contract.init : null
                    });

                    let inMsg = new Cell().asBuilder();
                    storeMessage(externalMessage)(inMsg);

                    let outMsg = new Cell().asBuilder();
                    storeMessageRelaxed(intMessage)(outMsg);

                    let local = estimateFees(config, inMsg.endCell(), [outMsg.endCell()], storageStats);
                    setEstimation(local);
                    estimationRef.current = local;
                } else {
                    setEstimation(null);
                    estimationRef.current = null;
                }
            });
        });
        return () => {
            ended = true;
        }
    }, [order, accountLite, client, config, commentString, ledgerAddress, walletVersion, supportsGaslessTransfer, jettonPayload?.customPayload, jettonPayload?.stateInit]);

    return estimation
}