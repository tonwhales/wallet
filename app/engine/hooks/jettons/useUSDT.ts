import { Address, fromNano, toNano } from "@ton/core";
import { useJettons, useNetwork, usePrice } from "..";
import { USDTMaster } from "../../../secure/KnownWallets";
import { useMemo } from "react";

export function useUSDT(address: Address) {
    const { isTestnet: testOnly } = useNetwork();
    const jettons = useJettons(address.toString({ testOnly }));
    const [price,] = usePrice();
    const usdtMaster = USDTMaster(testOnly);
    const usdt = !!usdtMaster
        ? jettons.find(j => j.master.equals(Address.parse(usdtMaster)))
        : null;

    const udstInTon = useMemo(() => {
        try {
            return (price?.price?.usd ?? 0) * parseFloat(fromNano(usdt?.balance ?? 0n))
        } catch {
            console.warn('Failed to calculate USDT in TON');
            return 0n;
        }
    }, [price?.price?.usd, usdt?.balance]);

    return { ...usdt, toTon: toNano(udstInTon) };
}