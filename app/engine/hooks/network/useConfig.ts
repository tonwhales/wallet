import { TonClient4, configParse18, configParseGasLimitsPrices, configParseMasterAddress, configParseMsgPrices, loadConfigParamsAsSlice } from '@ton/ton';
import { getLastBlock } from '../../accountWatcher';
import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { useClient4 } from './useClient4';
import { useNetwork } from './useNetwork';
import { ConfigState } from '../../types';

export function fetchConfigQueryFn(client: TonClient4, isTestnet: boolean) {
    return async () => {
        let blockSeqno = await getLastBlock();
        let configRaw = await client.getConfig(blockSeqno, [4, 18, 20, 21, 24, 25]);
        let config = loadConfigParamsAsSlice(configRaw.config.cell);

        // Config values
        const storagePrices = configParse18(config.get(18));
        let gasPrices = {
            masterchain: configParseGasLimitsPrices(config.get(20)),
            workchain: configParseGasLimitsPrices(config.get(21)),
        };
        let msgPrices = {
            masterchain: configParseMsgPrices(config.get(24)),
            workchain: configParseMsgPrices(config.get(25)),
        };
        let rootDnsAddress = configParseMasterAddress(config.get(4));

        let newState: ConfigState = {
            storage: storagePrices,
            rootDnsAddress: rootDnsAddress?.toString({ testOnly: isTestnet }) ?? 'Ef_lZ1T4NCb2mwkme9h2rJfESCE0W34ma9lWp7-_uY3zXDvq', // fallback
            workchain: {
                gas: {
                    flatLimit: gasPrices.workchain.flatLimit,
                    flatGasPrice: gasPrices.workchain.flatGasPrice,
                    price: gasPrices.workchain.other.gasPrice
                },
                message: {
                    lumpPrice: msgPrices.workchain.lumpPrice,
                    bitPrice: msgPrices.workchain.bitPrice,
                    cellPrice: msgPrices.workchain.cellPrice,
                    firstFrac: msgPrices.workchain.firstFrac,
                }
            },
            masterchain: {
                gas: {
                    flatLimit: gasPrices.masterchain.flatLimit,
                    flatGasPrice: gasPrices.masterchain.flatGasPrice,
                    price: gasPrices.masterchain.other.gasPrice
                },
                message: {
                    lumpPrice: msgPrices.masterchain.lumpPrice,
                    bitPrice: msgPrices.masterchain.bitPrice,
                    cellPrice: msgPrices.masterchain.cellPrice,
                    firstFrac: msgPrices.masterchain.firstFrac,
                }
            }
        };

        return newState;
    }
}

export function useConfig() {
    const { isTestnet } = useNetwork();
    let client = useClient4(isTestnet);

    const query = useQuery({
        queryKey: Queries.Config(isTestnet ? 'testnet' : 'mainnet'),
        queryFn: fetchConfigQueryFn(client, isTestnet),
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return query.data || null;
}