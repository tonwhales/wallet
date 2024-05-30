import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { Address, TonClient4 } from '@ton/ton';
import { tryGetJettonWallet } from '../../metadata/introspections/tryGetJettonWallet';
import { getLastBlock } from '../../accountWatcher';
import { useClient4 } from '../network/useClient4';
import { useNetwork } from '../network/useNetwork';

export function jettonWalletAddressQueryFn(client: TonClient4, master: string, wallet: string, isTestnet: boolean) {
    return async () => {
        let result = await tryGetJettonWallet(client, await getLastBlock(), {  address: Address.parse(wallet), master: Address.parse(master) });
        if (!result) {
            return null;
        }

        return result.toString({ testOnly: isTestnet });
    }
}

export function useJettonWalletAddress(master?: string | null, wallet?: string | null) {
    let isTestnet = useNetwork().isTestnet;
    let client = useClient4(isTestnet);

    return useQuery({
        queryKey: Queries.Jettons().Address(wallet!).Wallet(master!),
        queryFn: jettonWalletAddressQueryFn(client, master!, wallet!, isTestnet),
        enabled: !!master && !!wallet,
    })
}