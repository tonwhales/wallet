import { MutableRefObject, useMemo } from 'react';
import { createJettonOrder, createLedgerJettonOrder, createSimpleLedgerOrder, createSimpleOrder } from '../../ops/Order';
import { Cell, Address, toNano } from '@ton/core';
import { useAccountLite, useNetwork } from '../../../../engine/hooks';
import { Jetton, SelectedAccount } from '../../../../engine/types';
import { KnownWallet } from '../../../../secure/KnownWallets';

type Options = {
    validAmount: bigint | null;
    target: string;
    domain?: string;
    commentString: string;
    stateInit: Cell | null;
    jetton: Jetton | null;
    app?: {
        domain: string;
        title: string;
        url: string;
    }
    acc: SelectedAccount | null;
    ledgerAddress?: Address;
    known: KnownWallet;
    jettonPayload?: {
        customPayload?: string | null;
        stateInit?: string | null;
    } | null;
    estimationRef: MutableRefObject<bigint | null>;
    isLedger: boolean;
    address: Address;
    feeAmount: bigint | null;
    forwardAmount: bigint | null;
    payload: Cell | null;
    extraCurrencyId?: number | null;
    validUntil?: number | null;
}

export const useOrder = (options: Options) => {
        const network = useNetwork();

        const {
            target,
            domain,
            stateInit,
            jetton,
            app,
            acc,
            ledgerAddress,
            known,
            jettonPayload,
            estimationRef,
            isLedger,
            address,
            feeAmount,
            forwardAmount,
            payload,
            validAmount,
            commentString,
            extraCurrencyId,
            validUntil
        } = options

        const accountLite = useAccountLite(address);

        // Resolve order
        return useMemo(() => {
            if (validAmount === null) {
                return null
            }
    
            try {
                Address.parseFriendly(target);
            } catch (e) {
                return null;
            }
    
            if (
                (!!known && known.requireMemo)
                && (!commentString || commentString.length === 0)
            ) {
                return null;
            }
    
            const estim = estimationRef.current ?? toNano('0.1');
    
            if (isLedger && ledgerAddress) {
                // Resolve jetton order
                if (jetton) {
                    const txForwardAmount = toNano('0.05') + estim;
                    return createLedgerJettonOrder({
                        wallet: jetton.wallet,
                        target: target,
                        domain: domain,
                        responseTarget: ledgerAddress,
                        text: commentString,
                        amount: validAmount,
                        tonAmount: 1n,
                        txAmount: txForwardAmount,
                        payload: null,
                        validUntil
                    }, network.isTestnet);
                }
    
                // Resolve order
                return createSimpleLedgerOrder({
                    target: target,
                    domain: domain,
                    text: commentString,
                    payload: null,
                    amount: accountLite?.balance === validAmount ? toNano('0') : validAmount,
                    amountAll: accountLite?.balance === validAmount ? true : false,
                    stateInit,
                    validUntil
                });
            }
    
            // Resolve jetton order
            if (jetton) {
                const customPayload = jettonPayload?.customPayload ?? null;
                const customPayloadCell = customPayload ? Cell.fromBoc(Buffer.from(customPayload, 'base64'))[0] : null;
                const stateInit = jettonPayload?.stateInit ?? null;
                const stateInitCell = stateInit ? Cell.fromBoc(Buffer.from(stateInit, 'base64'))[0] : null;
    
                let txAmount = feeAmount ?? (toNano('0.05') + estim);
    
                if (!!stateInit || !!customPayload) {
                    txAmount = feeAmount ?? (toNano('0.1') + estim);
                }
    
                const tonAmount = forwardAmount ?? 1n;
    
                return createJettonOrder({
                    wallet: jetton.wallet,
                    target: target,
                    domain: domain,
                    responseTarget: acc!.address,
                    text: commentString,
                    amount: validAmount,
                    tonAmount,
                    txAmount,
                    customPayload: customPayloadCell,
                    payload: payload,
                    stateInit: stateInitCell,
                    validUntil
                }, network.isTestnet);
            }

            let amount = (validAmount === accountLite?.balance) ? toNano('0') : validAmount;
            let extraCurrency;
            if (extraCurrencyId) {
                extraCurrency = {
                    [extraCurrencyId]: validAmount
                }
                amount = toNano('0');
            }
            
            const amountAll = validAmount === accountLite?.balance && !extraCurrency;
    
            // Resolve order
            return createSimpleOrder({
                target: target,
                domain: domain,
                text: commentString,
                payload: payload,
                amount,
                amountAll: validAmount === accountLite?.balance,
                stateInit,
                app,
                extraCurrency,
                validUntil
            });
    
        }, [validAmount, target, domain, commentString, stateInit, jetton, app, acc, ledgerAddress, known, jettonPayload]);
}