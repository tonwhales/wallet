import { Address, TonClient4, TupleReader, beginCell } from '@ton/ton';
import { getLastBlock } from '../../accountWatcher';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';
import { StakingPoolMember } from '../../types';


function fetchStakingMemberQueryFn(client: TonClient4, isTestnet: boolean, pool: Address, member?: Address) {
    if (!member) {
        return async () => null;
    }
    return async () => {
        let memberResponse = await client.runMethod(
            await getLastBlock(), pool, 'get_member',
            [{ type: 'slice', cell: beginCell().storeAddress(member).endCell() }]
        );
        // Member
        let memberParser = new TupleReader(memberResponse.result);
        let memberState: StakingPoolMember = {
            balance: memberParser.readBigNumber(),
            pendingDeposit: memberParser.readBigNumber(),
            pendingWithdraw: memberParser.readBigNumber(),
            withdraw: memberParser.readBigNumber(),
            pool: pool.toString({ testOnly: isTestnet })
        };

        return memberState;
    }
}

export function stakingPoolMemberQuery(pool: Address, member: Address | undefined, client: TonClient4, isTestnet: boolean) {
    return {
        queryKey: Queries.StakingMember(pool.toString({ testOnly: isTestnet }), member?.toString({ testOnly: isTestnet }) || 'default-null'),
        queryFn: fetchStakingMemberQueryFn(client, isTestnet, pool, member),
        refetchOnMount: true,
    };
}


export function useStakingPoolMember(pool: Address, member: Address | undefined, client: TonClient4, isTestnet: boolean) {
    return useQuery(stakingPoolMemberQuery(pool, member, client, isTestnet)).data;
}

export function useStakingPoolMembers(client: TonClient4, isTestnet: boolean, configs: { pool: Address, member: Address }[]) {
    return useQueries({
        queries: configs.map(config => stakingPoolMemberQuery(config.pool, config.member, client, isTestnet))
    }).map(a => a.data);
}