import { useMemo } from "react";
import { useContractMetadatas } from "..";
import { StoredMessage, StoredOperation } from "../../types";
import { Address, Cell, fromNano, toNano } from "@ton/core";
import { parseBody } from "../../transactions/parseWalletTransaction";
import { JettonMasterState } from "../../metadata/fetchJettonMasterContent";
import { getJettonMaster } from "../../getters/getJettonMaster";
import { resolveOperation } from "../../transactions/resolveOperation";
import { StoredContractMetadata } from "../../metadata/StoredMetadata";

export type PreparedMessage = {
    address: Address,
    addressString: string,
    metadata: StoredContractMetadata,
    jettonMaster: JettonMasterState | null,
    amount: bigint | null,
    amountString: string,
    gas: { amount: bigint, unusual: boolean } | null,
    operation: StoredOperation,
    target: Address,
    friendlyTarget: string,
}

export function usePeparedMessages(messages: StoredMessage[], testOnly: boolean) {
    const addresses = messages.map(m => m.info.type === 'internal' ? m.info.dest : null).filter(m => !!m) as string[];
    const metadatas = useContractMetadatas(addresses).map(m => m.data).filter(m => !!m) as StoredContractMetadata[];

    return useMemo(() => {
        return messages.map((message) => {
            if (message.info.type !== 'internal') {
                return null;
            }

            try {

                const addressString = message.info.dest;
                const address = Address.parse(addressString);
                const metadata = metadatas.find(md => md?.address === address.toString({ testOnly }));
                const bodyCell = Cell.fromBoc(Buffer.from(message.body, 'base64'))[0];
                const body = parseBody(bodyCell);

                let amount = BigInt(message.info.value || '0');

                // Read jetton master
                let jettonMaster: JettonMasterState | null = null;
                if (!!metadata?.jettonWallet) {
                    jettonMaster = getJettonMaster(Address.parse(metadata.jettonWallet.master), testOnly) || null;
                }

                let jettonAmount: bigint | null = null;
                try {
                    if (jettonMaster && message.body) {
                        const temp = bodyCell;
                        if (temp) {
                            const parsing = temp.beginParse();
                            parsing.loadUint(32);
                            parsing.loadUint(64);
                            jettonAmount = parsing.loadCoins();
                        }
                    }
                } catch {
                    console.warn('Failed to parse jetton amount');
                }

                let gas: { amount: bigint | null, unusual: boolean } | null = null;

                if (jettonAmount && !!jettonMaster && !!metadata?.jettonWallet) {
                    gas = { amount, unusual: amount > toNano('0.2') };
                }

                // Resolve operation
                const operation = resolveOperation({
                    body: body,
                    amount: amount,
                    account: address,
                }, testOnly);

                const friendlyTarget = operation.address;
                const target = Address.parse(friendlyTarget);

                if (!amount && operation.items[0].kind === 'ton') {
                    amount = BigInt(operation.items[0].amount);
                }

                if (!jettonAmount && operation.items[0].kind === 'token') {
                    jettonAmount = BigInt(operation.items[0].amount);
                }

                return {
                    address,
                    addressString,
                    metadata,
                    amountString: jettonAmount
                        ? fromNano(jettonAmount) + (` ${jettonMaster?.symbol}` ?? '')
                        : fromNano(amount) + ' TON',
                    jettonMaster,
                    amount: jettonAmount ? null : amount,
                    gas,
                    operation,
                    target,
                    friendlyTarget,
                };

            } catch {
                console.warn('Failed to parse message');
                return null;
            }
        }).filter(m => !!m) as PreparedMessage[];
    }, [metadatas, messages]);
}