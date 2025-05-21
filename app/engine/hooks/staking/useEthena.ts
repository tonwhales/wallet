import { useNetwork } from "../network";
import { gettsUSDeMinter, gettsUSDeVaultAddress, getUSDeMinter } from "../../../secure/ethena";
import { useAppConfig } from "../useAppConfig";
import { Address } from "@ton/core";

export type EthenaAssets = {
    minter: Address;
    tsMinter: Address;
    vault: Address;
    webLink?: string;
}

export function useEthena(): EthenaAssets {
    const { isTestnet } = useNetwork();

    const usdeMinter = getUSDeMinter(isTestnet);
    const tsUsdeMinter = gettsUSDeMinter(isTestnet);
    const usdeVaultAddress = gettsUSDeVaultAddress(isTestnet);
    
    const appConfig = useAppConfig();
    const resources = appConfig.resources;
    const webLink = resources?.['staking.ethena.webLink'];

    const remoteUSDeMinter = resources?.['staking.ethena.usdeMinter'];
    const remoteTsUSDeMinter = resources?.['staking.ethena.tsUSDeMinter'];
    const remoteVault = resources?.['staking.ethena.usdeVault'];

    let parsedRemoteUSDeMinter: Address | undefined;
    let parsedRemoteTsUSDeMinter: Address | undefined;
    let parsedRemoteVault: Address | undefined;

    if (remoteUSDeMinter) {
        try {
            parsedRemoteUSDeMinter = Address.parse(remoteUSDeMinter);
        } catch { }
    }

    if (remoteTsUSDeMinter) {
        try {
            parsedRemoteTsUSDeMinter = Address.parse(remoteTsUSDeMinter);
        } catch { }
    }

    if (remoteVault) {
        try {
            parsedRemoteVault = Address.parse(remoteVault);
        } catch { }
    }

    const minter = parsedRemoteUSDeMinter || usdeMinter;
    const tsMinter = parsedRemoteTsUSDeMinter || tsUsdeMinter;
    const vault = parsedRemoteVault || usdeVaultAddress;

    return {
        minter,
        tsMinter,
        vault,
        webLink
    }
}