import { Address, TonClient4, TupleReader } from '@ton/ton';
import { getLastBlock } from '../../accountWatcher';
import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { StakingPoolStatus } from '../../types';

function fetchStakingStatusQueryFn(client: TonClient4, pool: Address) {
    return async () => {
        let statusResponse = await client.runMethod(await getLastBlock(), pool, 'get_staking_status');

        let statusParser = new TupleReader(statusResponse.result);
        let status: StakingPoolStatus = {
            proxyStakeAt: statusParser.readNumber(),
            proxyStakeUntil: statusParser.readNumber(),
            proxyStakeSent: statusParser.readBigNumber(),
            querySent: statusParser.readBoolean(),
            canUnlock: statusParser.readBoolean(),
            locked: statusParser.readBoolean(),
            proxyStakeLockFinal: statusParser.readBoolean(),
        };

        return status;
    }
}


export function useStakingPoolStatus(pool: Address, client: TonClient4, isTestnet: boolean) {
    return useQuery({
        queryKey: Queries.Account(pool.toString({ testOnly: isTestnet })).StakingPool().Status(),
        queryFn: fetchStakingStatusQueryFn(client, pool),
        refetchOnMount: true,
    }).data;
}