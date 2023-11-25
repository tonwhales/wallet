import { useQuery } from '@tanstack/react-query';
import { useClient4, useNetwork } from "..";
import { Queries } from "../../queries";
import { TonClient4 } from "@ton/ton";
import { Asset, PoolType, Factory, MAINNET_FACTORY_ADDR, ReadinessStatus } from '@dedust/sdk';
import { Address } from '@ton/core';

function jettonSwapQueryFn(client4: TonClient4, master: string, isTestnet: boolean) {
    return async (): Promise<any> => {
        const factory = client4.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

        const tonVault = client4.open(await factory.getNativeVault());

        const TON = Asset.native();

        const masterAddress = Address.parse(master);
        const masterJetton = Asset.jetton(masterAddress);

        const pool = client4.open(await factory.getPool(PoolType.VOLATILE, [TON, masterJetton]));

        // Check if pool exists:
        if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
            throw new Error('Pool (TON, SCALE) does not exist.');
        }

        // Check if vault exits:
        if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
            throw new Error('Vault (TON) does not exist.');
        }
    }
}

export function useJettonSwap(master: string) {
    const { isTestnet } = useNetwork();
    const client4 = useClient4(isTestnet);

    if (isTestnet) {
        return null;
    }

    return useQuery({
        queryKey: Queries.Jettons().Swap(master),
        queryFn: jettonSwapQueryFn(client4, master, isTestnet),
    }).data
}
