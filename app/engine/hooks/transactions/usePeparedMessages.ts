import { useMemo } from "react";
import { StoredMessage, StoredOperation } from "../../types";
import { Address, Cell, fromNano, toNano } from "@ton/core";
import { parseBody } from "../../transactions/parseWalletTransaction";
import { JettonMasterState } from "../../metadata/fetchJettonMasterContent";
import { resolveOperation } from "../../transactions/resolveOperation";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { useGaslessConfig } from "../jettons/useGaslessConfig";
import { getJettonHint } from "../jettons/useJetton";
import { mapJettonFullToMasterState } from "../../../utils/jettons/mapJettonToMasterState";

type PreparedMessageType = 'relayed' | 'message';

export type PreparedMessage = {
    type: PreparedMessageType,
    address: Address,
    addressString: string,
    jettonMaster: JettonMasterState | null,
    amount: bigint | null,
    amountString: string,
    gas: { amount: bigint, unusual: boolean } | null,
    operation: StoredOperation,
    target: Address,
    friendlyTarget: string,
};

export function usePeparedMessages(messages: StoredMessage[], testOnly: boolean, owner: Address | null): PreparedMessage[] {
    const addresses = messages.length > 1
        ? messages.map(m => m.info.type === 'internal' ? m.info.dest : null).filter(m => !!m) as string[]
        : [];
    const jettonHints = (owner ? addresses.map(a => getJettonHint({
        owner: owner,
        master: a,
        wallet: a,
        isTestnet: testOnly,
    })) : []).filter(h => !!h);

    const gaslessConfig = useGaslessConfig().data;

    return useMemo(() => {
        return messages.map((message) => {
            if (message.info.type !== 'internal') {
                return null;
            }

            try {
                let type: PreparedMessageType = 'message';
                const addressString = message.info.dest;
                const mAddress = Address.parse(addressString);
                const hint = jettonHints.find(h => {
                    try {
                        const isMaster = h.jetton.address === mAddress.toString({ testOnly });

                        if (isMaster) {
                            return true;
                        }

                        return Address.parse(h.walletAddress.address).equals(mAddress);
                    } catch {
                        return false;
                    }
                });
                const jettonMaster = hint ? mapJettonFullToMasterState(hint) : null;
                const bodyCell = Cell.fromBoc(Buffer.from(message.body, 'base64'))[0];
                const body = parseBody(bodyCell);

                let amount = BigInt(message.info.value || '0');

                let jettonAmount: bigint | null = null;
                try {
                    if (jettonMaster && message.body) {
                        const temp = bodyCell;
                        if (temp) {
                            const parsing = temp.beginParse();
                            parsing.skip(32);
                            parsing.skip(64);
                            jettonAmount = parsing.loadCoins();
                        }
                    }
                } catch {
                    console.warn('Failed to parse jetton amount');
                }

                let gas: { amount: bigint | null, unusual: boolean } | null = null;

                if (jettonAmount && !!jettonMaster) {
                    gas = { amount, unusual: amount > toNano('0.2') };
                }

                // Resolve operation
                const operation = resolveOperation({
                    body: body,
                    amount: amount,
                    account: mAddress,
                }, testOnly);

                const friendlyTarget = operation.address;
                const target = Address.parse(friendlyTarget);

                // dont show relay messages
                try {
                    if (gaslessConfig?.relay_address && target.equals(Address.parse(gaslessConfig.relay_address))) {
                        type = 'relayed';
                    }
                } catch {
                    console.warn('Failed to resolve relay address');
                }

                if (!amount && operation.items[0].kind === 'ton') {
                    amount = BigInt(operation.items[0].amount);
                }

                if (!jettonAmount && operation.items[0].kind === 'token') {
                    jettonAmount = BigInt(operation.items[0].amount);
                }

                let amountString: string = '';
                if (jettonAmount) {
                    amountString = `${fromBnWithDecimals(jettonAmount, jettonMaster?.decimals)} ${jettonMaster?.symbol}`;
                } else if (amount) {
                    amountString = fromNano(amount) + ' TON';
                }

                return {
                    type,
                    address: mAddress,
                    addressString,
                    amountString,
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
    }, [jettonHints, gaslessConfig, messages]);
}