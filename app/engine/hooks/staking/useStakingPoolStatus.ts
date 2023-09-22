import { Address, TonClient4, TupleReader } from '@ton/ton';
import { getLastBlock } from '../../accountWatcher';
import { useQuery } from '@tanstack/react-query';
import { Queries } from '../../queries';

        // // Check parent
        // if (!parent.last) {
        //     return;
        // }

        // // Check updated
        // if (src && BigInt(src.lt).gte(parent.last.lt)) {
        //     return;
        // }

        // // Fetch fresh state
        // const [statusResponse, paramsResponse, memberResponse] = await Promise.all([
        //     engine.client4.runMethod(parent.block, pool, 'get_staking_status'),
        //     engine.client4.runMethod(parent.block, pool, 'get_params'),
        //     engine.client4.runMethod(parent.block, pool, 'get_member', [{ type: 'slice', cell: beginCell().storeAddress(member).endCell() }]),
        // ]);

        // // Parse state
        // let statusParser = new TupleSlice4(statusResponse.result);
        // let status: {
        //     proxyStakeAt: number,
        //     proxyStakeUntil: number,
        //     proxyStakeSent: bigint,
        //     querySent: boolean,
        //     canUnlock: boolean,
        //     locked: boolean,
        //     proxyStakeLockFinal: boolean,
        // } = {
        //     proxyStakeAt: statusParser.readNumber(),
        //     proxyStakeUntil: statusParser.readNumber(),
        //     proxyStakeSent: statusParser.readBigNumber(),
        //     querySent: statusParser.readBoolean(),
        //     canUnlock: statusParser.readBoolean(),
        //     locked: statusParser.readBoolean(),
        //     proxyStakeLockFinal: statusParser.readBoolean(),
        // };

        // // Parse params
        // let paramsParser = new TupleSlice4(paramsResponse.result);
        // let params: {
        //     enabled: boolean,
        //     udpatesEnabled: boolean,
        //     minStake: bigint,
        //     depositFee: bigint,
        //     withdrawFee: bigint,
        //     poolFee: bigint,
        //     receiptPrice: bigint
        // } = {
        //     enabled: paramsParser.readBoolean(),
        //     udpatesEnabled: paramsParser.readBoolean(),
        //     minStake: paramsParser.readBigNumber(),
        //     depositFee: paramsParser.readBigNumber(),
        //     withdrawFee: paramsParser.readBigNumber(),
        //     poolFee: paramsParser.readBigNumber(),
        //     receiptPrice: paramsParser.readBigNumber()
        // };

        // // Member
        // let memberParser = new TupleSlice4(memberResponse.result);
        // let memberState: {
        //     balance: bigint;
        //     pendingWithdraw: bigint;
        //     pendingDeposit: bigint;
        //     withdraw: bigint;
        // } = {
        //     balance: memberParser.readBigNumber(),
        //     pendingDeposit: memberParser.readBigNumber(),
        //     pendingWithdraw: memberParser.readBigNumber(),
        //     withdraw: memberParser.readBigNumber()
        // };

        // // Update
        // let newState: StakingPoolState = {
        //     lt: parent.last.lt,
        //     member: memberState,
        //     params: {
        //         minStake: params.minStake,
        //         depositFee: params.depositFee,
        //         withdrawFee: params.withdrawFee,
        //         stakeUntil: status.proxyStakeUntil,
        //         receiptPrice: params.receiptPrice,
        //         poolFee: params.poolFee,
        //         locked: status.locked
        //     }
        // };
        // item.update(() => newState);

        // if (Date.now() - (chartItem.value?.lastUpdate || 0) < 60 * 60 * 1000) { // syncing every hour
        //     return;
        // }

        // const newChartState = await backoff('graph', () => getStakingMemberMonthlyChart(engine.client4, member, pool));

        // if (newChartState) {
        //     chartItem.update(() => newChartState);
        // }

function fetchStakingStatusQueryFn(client: TonClient4, pool: Address) {
    return async () => {
        let statusResponse = await client.runMethod(await getLastBlock(), pool, 'get_staking_status');

        let statusParser = new TupleReader(statusResponse.result);
        let status: {
            proxyStakeAt: number,
            proxyStakeUntil: number,
            proxyStakeSent: bigint,
            querySent: boolean,
            canUnlock: boolean,
            locked: boolean,
            proxyStakeLockFinal: boolean,
        } = {
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
    }).data;
}