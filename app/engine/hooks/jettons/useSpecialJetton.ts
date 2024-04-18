import { Address, toNano } from "@ton/core";
import { useJettonContent, useJettons, useJettonsConfig, useNetwork, usePrice } from "..";
import { fromBnWithDecimals } from "../../../utils/withDecimals";

export function useSpecialJetton(address: Address) {
    const { isTestnet: testOnly } = useNetwork();
    const config = useJettonsConfig(testOnly);
    const specialJettonMaster = config?.specialJetton;
    const jettons = useJettons(address.toString({ testOnly }));
    const masterContent = useJettonContent(specialJettonMaster ?? null);
    const [price,] = usePrice();

    if (!specialJettonMaster) {
        return null;
    }

    // Check if the special jetton master is a valid address
    try {
        Address.parse(specialJettonMaster);
    } catch {
        return null;
    }


    const specialJetton = specialJettonMaster
        ? jettons.find(j => j.master.toString({ testOnly }) === specialJettonMaster)
        : null;

    const balanceString = fromBnWithDecimals(specialJetton?.balance ?? 0n, masterContent?.decimals ?? 6);
    const nano = toNano(balanceString);
    const tonRate = 1 / price.price.usd; // 1 usd = tonRate ton

    // Convert balance to TON
    let toTon = 0n;
    try {
        toTon = toNano(parseFloat(balanceString) * tonRate);
    } catch {
        console.warn('Failed to convert balance to TON');
    }

    return { ...specialJetton, nano, toTon, masterContent };
}

export type SpecialJetton = ReturnType<typeof useSpecialJetton>;