import { useQuery } from '@tanstack/react-query';
import { useClient4, useNetwork } from "..";
import { Queries } from "../../queries";
import { TonClient4 } from "@ton/ton";
import { Asset, PoolType, Factory, MAINNET_FACTORY_ADDR, ReadinessStatus } from '@dedust/sdk';
import { Address, toNano } from '@ton/core';

function jettonSwapQueryFn(client4: TonClient4, master: string, isTestnet: boolean) {
    return async (): Promise<bigint | null> => {
        const factory = client4.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR));

        const tonVault = client4.open(await factory.getNativeVault());

        const TON = Asset.native();

        const masterAddress = Address.parse(master);
        const masterJetton = Asset.jetton(masterAddress);

        let pool = client4.open(await factory.getPool(PoolType.VOLATILE, [masterJetton, TON]));

        // Check if pool exists:
        if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
            pool = client4.open(await factory.getPool(PoolType.STABLE, [TON, masterJetton]));
            if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
                return null;
            }
        }

        // Check if vault exits:
        if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
            return null;
        }

        const res = await pool.getEstimatedSwapOut({
            assetIn: masterJetton,
            amountIn: toNano(1),
        });

        return res.amountOut
    }
}

export function useJettonSwap(master?: string) {
    const { isTestnet } = useNetwork();
    const client4 = useClient4(isTestnet);

    if (isTestnet) {
        return null;
    }

    return useQuery({
        queryKey: Queries.Jettons().Swap(master ?? ''),
        queryFn: jettonSwapQueryFn(client4, master!, isTestnet),
        refetchInterval: 1000 * 60 * 5,
        staleTime: 1000 * 60,
        enabled: !!master
    }).data
}
