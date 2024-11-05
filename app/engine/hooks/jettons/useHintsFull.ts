import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { fetchHintsFull, JettonPreview } from '../../api/fetchHintsFull';
import { queryClient } from '../../clients';
import { useNetwork } from '../network';
import { JettonMasterState } from '../../metadata/fetchJettonMasterContent';
import { Address } from '@ton/core';
import { getQueryData } from '../../utils/getQueryData';
import { StoredJettonWallet } from '../../metadata/StoredMetadata';
import { JettonRates } from './useJettonRate';
import { warn } from '../../../utils/log';
import { getTxsHints } from './useHints';

function mapMasterContent(preview: JettonPreview): JettonMasterState & { address: string } {
    return {
        address: preview.address,
        name: preview.name,
        symbol: preview.symbol,
        decimals: preview.decimals,
        originalImage: preview.image,
        image: null
    };
}

export function useHintsFull(addressString?: string) {
    const { isTestnet } = useNetwork();
    const hints = useQuery({
        queryKey: Queries.HintsFull(addressString || ''),
        queryFn: async () => {
            try {
                const fetched = await fetchHintsFull(addressString!, isTestnet);
                const queryCache = queryClient.getQueryCache();

                for (let i = 0; i < fetched.length; i++) {
                    const hint = fetched[i];

                    // Jetton Wallet
                    const prevWallet = getQueryData<StoredJettonWallet | null>(
                        queryCache,
                        Queries.Account(hint.walletAddress.address).JettonWallet()
                    );
                    const shouldUpdateWalet = !prevWallet || (prevWallet.balance !== hint.balance);

                    if (shouldUpdateWalet) {
                        queryClient.setQueryData(
                            Queries.Account(hint.walletAddress.address).JettonWallet(),
                            {
                                balance: hint.balance,
                                owner: Address.parse(addressString!).toString({ testOnly: isTestnet }),
                                master: hint.jetton.address,
                                address: hint.walletAddress.address
                            }
                        );
                    }

                    // Master Content
                    const prevMaster = getQueryData<JettonMasterState>(
                        queryCache,
                        Queries.Jettons().MasterContent(hint.jetton.address)
                    );
                    const isMasterContentNew = prevMaster?.name !== hint.jetton.name
                        || prevMaster?.symbol !== hint.jetton.symbol
                        || prevMaster?.decimals !== hint.jetton.decimals
                        || prevMaster?.originalImage !== hint.jetton.image;
                    const shouldUpdateMaster = !prevMaster || isMasterContentNew;

                    if (shouldUpdateMaster) {
                        queryClient.setQueryData(
                            Queries.Jettons().MasterContent(hint.jetton.address),
                            mapMasterContent(hint.jetton)
                        );
                    }

                    // Jetton Wallet Address
                    const prevAddress = getQueryData<string | null>(
                        queryCache,
                        Queries.Jettons().Address(hint.walletAddress.address).Wallet(hint.jetton.address)
                    );

                    if (!prevAddress) {
                        queryClient.setQueryData(
                            Queries.Jettons().Address(hint.walletAddress.address).Wallet(hint.jetton.address),
                            hint.walletAddress.address
                        );
                    }

                    const prevRates = getQueryData<JettonRates>(
                        queryCache,
                        Queries.Jettons().Rates(hint.walletAddress.address)
                    );

                    if (!prevRates || prevRates !== hint.price?.prices) {
                        queryClient.setQueryData(
                            Queries.Jettons().Rates(hint.walletAddress.address),
                            hint.price?.prices
                        );
                    }
                }

                const txsHints = getTxsHints(addressString || '');

                return Array.from(new Set([...fetched.map(hint => hint.walletAddress.address), ...txsHints]));
            } catch (error) {
                warn('Failed to fetch hints');
                throw error;
            }
        },
        enabled: !!addressString,
        refetchOnMount: true,
        staleTime: 1000 * 30,
    });

    return hints.data || [];
}