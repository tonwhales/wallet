import { Address, toNano } from "@ton/core";
import { useJettonContent, useJettonWallet, useJettonWalletAddress, useKnownJettons, useNetwork, usePrice } from "..";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { Jetton } from '../../types';

export function useSpecialJetton(address: Address | null | undefined) {
    const { isTestnet: testOnly } = useNetwork();
    const knownJettons = useKnownJettons(testOnly);
    const specialJettonMaster = knownJettons?.specialJetton ?? undefined;
    const walletAddress = useJettonWalletAddress(specialJettonMaster, address?.toString()).data;
    const wallet = useJettonWallet(walletAddress, { refetchInterval: 15000 });
    const masterContent = useJettonContent(specialJettonMaster ?? null);
    const [price] = usePrice();

    if (!specialJettonMaster || !address) {
        return null;
    }

    // Check if the special jetton master is a valid address
    try {
        Address.parse(specialJettonMaster);
    } catch {
        return null;
    }

    const specialJetton: Jetton | null = walletAddress ? {
        balance: BigInt(wallet?.balance ?? 0n),
        decimals: masterContent?.decimals ?? 6,
        description: masterContent?.description ?? '',
        name: masterContent?.name ?? '',
        symbol: masterContent?.symbol ?? '',
        icon: masterContent?.image?.preview256 ?? '',
        master: Address.parse(specialJettonMaster),
        wallet: Address.parse(walletAddress),
    } : null;

    const balanceString = fromBnWithDecimals(specialJetton?.balance ?? 0n, masterContent?.decimals ?? 6);
    const nano = toNano(balanceString);
    const tonRate = price?.price?.usd ? 1 / price.price.usd : 0; // 1 usd = tonRate * ton

    // Convert balance to TON
    let toTon = 0n;
    try {
        toTon = toNano(parseFloat(balanceString) * tonRate);
    } catch {
        console.warn('Failed to convert balance to TON');
    }

    return { ...specialJetton, nano, toTon, masterContent, master: Address.parse(specialJettonMaster) };
}

export type SpecialJetton = ReturnType<typeof useSpecialJetton>;