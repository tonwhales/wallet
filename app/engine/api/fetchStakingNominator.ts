import axios from "axios";
import { Address } from "ton";
import * as t from 'io-ts';
import * as c from '../utils/codecs';
import { isLeft } from "fp-ts/lib/Either";
import { timeout } from "rxjs";

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

export async function fetchStakingNominator(args: {
    pool: Address,
    nominator: Address,
    timespan?: { start: number, end?: number },
    isTestnet: boolean,
    timeout?: number
}) {
    const { pool, nominator, timespan, isTestnet } = args;

    console.log({
        url: stakingIndexerUrl + '/indexer/nominator',
        params: {
            pool: pool.toFriendly({ testOnly: isTestnet }),
            addr: nominator.toFriendly({ testOnly: isTestnet }),
            timespan
        },
        timeout: { timeout: args.timeout || 10_000 }
    });

    const res = await axios.post(
        stakingIndexerUrl + '/indexer/nominator',
        {
            pool: pool.toFriendly({ testOnly: isTestnet }),
            addr: nominator.toFriendly({ testOnly: isTestnet }),
            timespan
        },
        { timeout: args.timeout || 10_000 }
    );

    console.log('fetchStakingNominator', { data: JSON.stringify(res.data) });

    if (res.status !== 200) {
        throw new Error('Failed to fetch staking nominator info');
    }

    const parsed = nominatorInfoCodec.decode(res.data);
    if (isLeft(parsed)) {
        throw new Error('Invalid staking nominator info');
    }

    return parsed.right as NominatorInfo
}