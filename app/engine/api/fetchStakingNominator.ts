import axios from "axios";
import * as t from 'io-ts';
import * as c from '../utils/codecs';
import { isLeft } from "fp-ts/lib/Either";
import { Address } from "@ton/core";

export const stakingIndexerUrl = 'https://staking-indexer.whales-api.com';

export const nominatorOperationCodec = t.type({
    amount: c.bignum,
    time: t.string,
    trigger: t.union([t.literal('payload'), t.literal('comment')])
});

export const nominatorInfoCodec = t.type({
    nominator: t.union([
        t.null,
        t.intersection([
            t.partial({
                profitByTimespan: t.union([c.bignum, t.null])
            }),
            t.type({
                profitAmount: c.bignum,
                totalDepositAmount: c.bignum,
                totalWithdrawAmount: c.bignum,
                withdraws: t.array(nominatorOperationCodec),
                deposits: t.array(nominatorOperationCodec),
                profits: t.array(t.type({
                    amount: c.bignum,
                    time: t.string
                })),
            })
        ])
    ])
});

export type NominatorInfo = t.TypeOf<typeof nominatorInfoCodec>;
export type NominatorOperation = t.TypeOf<typeof nominatorOperationCodec>;
export type NominatorPeriod = 'week' | 'month' | 'year' | 'allTime';

export async function fetchStakingNominator(args: {
    pool: Address,
    nominator: Address,
    fixedPeriod?: Omit<NominatorPeriod, 'allTime'>
    isTestnet: boolean,
    timeout?: number
}) {
    const { pool, nominator, fixedPeriod, isTestnet } = args;

    const res = await axios.post(
        stakingIndexerUrl + '/indexer/nominator',
        {
            pool: pool.toString({ testOnly: isTestnet }),
            addr: nominator.toString({ testOnly: isTestnet }),
            fixedPeriod
        },
        { timeout: args.timeout || 10_000 }
    );

    if (res.status !== 200) {
        throw new Error('Failed to fetch staking nominator info');
    }

    const parsed = nominatorInfoCodec.decode(res.data);
    if (isLeft(parsed)) {
        throw new Error('Invalid staking nominator info');
    }

    return {
        ...parsed.right,
        profits: (parsed.right.nominator?.profits || []).sort((a, b) => {
            const aDate = new Date(a.time);
            const bDate = new Date(b.time);

            return aDate.getTime() - bDate.getTime();
        })
    } as NominatorInfo
}