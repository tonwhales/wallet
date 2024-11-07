import { Address } from "@ton/core";
import { useHintsFull, useNetwork } from "..";
import { Jetton } from "../../types";
import { mapJettonFullToMasterState } from "../../../utils/jettons/mapJettonToMasterState";
import { useMemo } from "react";

export function useJetton(params: { owner: Address | string, master?: Address | string, wallet?: Address | string }, suspense?: boolean): Jetton | null {
    const { isTestnet: testOnly } = useNetwork();
    const { owner, master, wallet } = params;
    const masterStr = typeof master === 'string' ? master : (master?.toString({ testOnly }) ?? null);
    const ownerStr = typeof owner === 'string' ? owner : owner.toString({ testOnly });
    const walletStr = typeof wallet === 'string' ? wallet : (wallet?.toString({ testOnly }) ?? null);

    const hintsFull = useHintsFull(ownerStr);
    const key = masterStr ?? walletStr;
    const jettonIndex = key ? hintsFull.data?.addressesIndex?.[key] : null;
    const hint = (jettonIndex !== null && jettonIndex !== undefined)
        ? hintsFull.data?.hints[jettonIndex]
        : undefined;

    return useMemo(() => {
        if (!hint) {
            return null;
        }

        const content = mapJettonFullToMasterState(hint);
        const walletContent = {
            balance: hint.balance,
            master: hint.jetton.address,
            owner: hint.walletAddress.address,
            address: hint.walletAddress.address,
        }

        let name = content.name ?? '';
        let symbol = content.symbol ?? '';
        let description = content.description ?? '';
        let balance = walletContent?.balance ?? 0;

        if (symbol === 'USD₮') {
            symbol = 'USDT';
        }

        if (name === 'USD₮' || name === 'TetherUSD₮') {
            name = 'USDT';
        }

        return {
            balance: BigInt(balance),
            wallet: Address.parse(hint.walletAddress.address),
            master: Address.parse(hint.jetton.address),
            name,
            symbol,
            description,
            decimals: content.decimals ?? null,
            icon: content.image?.preview256 || content.originalImage || null,
            disabled: false,
            assets: !!content.assets ? [content.assets[0], content.assets[1]] : null,
            pool: content.pool,
            prices: hint.price?.prices,
        };
    }, [!!hint, hint?.balance, hint?.price])
}