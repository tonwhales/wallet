import { Address, toNano } from "@ton/core";
import { useJettonContent, useJettons, useNetwork } from "..";
import { useUSDTMaster } from "./useUSDTMaster";
import { fromBnWithDecimals } from "../../../utils/withDecimals";

export function useUSDT(address: Address) {
    const { isTestnet: testOnly } = useNetwork();
    const usdtMaster = useUSDTMaster(testOnly).data;
    const jettons = useJettons(address.toString({ testOnly }));
    const masterContent = useJettonContent(usdtMaster?.addressString ?? null);

    if (!usdtMaster) {
        return null;
    }
    const usdt = usdtMaster
        ? jettons.find(j => j.master.toString({ testOnly }) === usdtMaster.addressString)
        : null;

    const nano = toNano(fromBnWithDecimals(usdt?.balance ?? 0n, masterContent?.decimals ?? 6));

    return { ...usdt, nano, masterContent };
}