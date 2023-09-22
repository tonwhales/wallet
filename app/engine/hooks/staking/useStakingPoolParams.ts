import { Address, TonClient4, TupleReader } from '@ton/ton';
import { getLastBlock } from '../../accountWatcher';
import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';

type Params = {
    enabled: boolean,
    udpatesEnabled: boolean,
    minStake: bigint,
    depositFee: bigint,
    withdrawFee: bigint,
    poolFee: bigint,
    receiptPrice: bigint
}

function fetchStakingParamsQueryFn(client: TonClient4, pool: Address) {
    return async (): Promise<Params> => {
        let paramsResponse = await client.runMethod(await getLastBlock(), pool, 'get_params');

        // Parse params
        let paramsParser = new TupleReader(paramsResponse.result);
        let params: Params = {
            enabled: paramsParser.readBoolean(),
            udpatesEnabled: paramsParser.readBoolean(),
            minStake: paramsParser.readBigNumber(),
            depositFee: paramsParser.readBigNumber(),
            withdrawFee: paramsParser.readBigNumber(),
            poolFee: paramsParser.readBigNumber(),
            receiptPrice: paramsParser.readBigNumber()
        };


        return params;
    }
}


export function useStakingPoolParams(pool: Address, client: TonClient4, isTestnet: boolean) {
    return useQuery({
        queryKey: Queries.Account(pool.toString({ testOnly: isTestnet })).StakingPool().Params(),
        queryFn: fetchStakingParamsQueryFn(client, pool),
        enabled: !!pool,
    }).data;
}