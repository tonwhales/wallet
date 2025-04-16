import { Address, fromNano, toNano } from "@ton/core";
import { useAccountLite, useDisplayableJettons, useNetwork, usePrice } from "..";
import { useSpecialJetton } from "./useSpecialJetton";
import { fromBnWithDecimals } from "../../../utils/withDecimals";

export function useSavingsBalance(addr: string | Address) {
    const { isTestnet } = useNetwork();
    const [price] = usePrice();
    const address = typeof addr === 'string' ? Address.parse(addr) : addr;
    const addressString = address.toString({ testOnly: isTestnet });
    const { savings } = useDisplayableJettons(addressString);
    const specialJetton = useSpecialJetton(address);
    const accountLite = useAccountLite(address);

    let totalBalance = 0;

    // savings jettons balance
    const savingTotal = savings.reduce((acc, s) => {
        if (!s.price) {
            return acc;
        }

        try {
            const balance = BigInt(s.balance);
            const price = s.price.prices?.['USD'] ?? 0;
            return acc + parseFloat(fromNano(balance)) * price;
        } catch {
            return acc;
        }
    }, 0);
    totalBalance += savingTotal;

    // TON balance
    const tonBalance = accountLite?.balance ?? 0n;
    let tonTotal = 0;
    if (price?.price?.usd && tonBalance) {
        try {
            tonTotal = parseFloat(fromNano(tonBalance)) * price.price.usd;
            totalBalance += tonTotal;
        } catch { }
    }

    // Special jetton balance
    const specialTotal = specialJetton?.balance ?? 0n;
    try {
        totalBalance += parseFloat(fromBnWithDecimals(specialTotal, specialJetton?.decimals ?? 6))
    } catch { }

    return {
        totalBalance: toNano(totalBalance.toFixed(9)),
        tonBalance: toNano(tonTotal.toFixed(9)),
        savingTotal: toNano(savingTotal.toFixed(9)),
        specialBalance: specialTotal
    };
}