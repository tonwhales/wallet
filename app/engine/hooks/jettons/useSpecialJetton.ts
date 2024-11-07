import { Address, toNano } from "@ton/core";
import { useJetton, useKnownJettons, useNetwork, usePrice } from "..";
import { fromBnWithDecimals } from "../../../utils/withDecimals";
import { mapJettonToMasterState } from "../../../utils/jettons/mapJettonToMasterState";

export function useSpecialJetton(address: Address) {
    const { isTestnet: testOnly } = useNetwork();
    const knownJettons = useKnownJettons(testOnly);
    const specialJettonMaster = knownJettons?.specialJetton ?? undefined;

    const jetton = useJetton({
        owner: address?.toString({ testOnly }),
        master: specialJettonMaster,
    });
    
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

    const balanceString = fromBnWithDecimals(jetton?.balance ?? 0n, jetton?.decimals ?? 6);
    const nano = toNano(balanceString);
    const tonRate = price?.price?.usd ? 1 / price.price.usd : 0; // 1 usd = tonRate * ton

    // Convert balance to TON
    let toTon = 0n;
    try {
        toTon = toNano(parseFloat(balanceString) * tonRate);
    } catch {
        console.warn('Failed to convert balance to TON');
    }

    const masterContent = jetton ? mapJettonToMasterState(jetton, testOnly) : undefined;

    return { 
        ...jetton, 
        nano, toTon, masterContent, 
        master: Address.parse(specialJettonMaster),
        description: 'Tether Token for Tether USD' 
    };
}

export type SpecialJetton = ReturnType<typeof useSpecialJetton>;