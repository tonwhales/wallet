import { StakingStatus } from "../../engine/api/fetchStakingStatus";
import { lastTwoApys } from "./lastTwoApys";

const START_WORK_TIME = 1_700_000_000_000;

function election(id: number) {
    return {
        id,
        unfreezeAt: id + 1000,
        stakeHeld: 32768,
        bonuses: '1000000000000',
        totalStake: '400000000000000000'
    };
}

function statusWith(electionsHistory: StakingStatus['electionsHistory']): StakingStatus {
    return {
        startWorkTime: START_WORK_TIME,
        validatorsElectedFor: 65536,
        bonuses: 0n,
        electionEntities: [],
        electionsHistory
    } as unknown as StakingStatus;
}

const before = (secondsBeforeStart: number) => START_WORK_TIME / 1000 - secondsBeforeStart;

describe('lastTwoApys', () => {
    it('returns zeros without a status', () => {
        expect(lastTwoApys(null)).toEqual([0, 0]);
        expect(lastTwoApys(undefined)).toEqual([0, 0]);
    });

    it('returns zeros for an empty elections history', () => {
        expect(lastTwoApys(statusWith([]))).toEqual([0, 0]);
    });

    it('returns zeros when only one election precedes the current cycle', () => {
        expect(lastTwoApys(statusWith([election(before(100))]))).toEqual([0, 0]);
    });

    it('returns zeros when the newest election is not older than the current cycle', () => {
        const history = [election(START_WORK_TIME / 1000), election(before(100))];
        expect(lastTwoApys(statusWith(history))).toEqual([0, 0]);
    });

    it('computes both APYs from the two elections preceding the current cycle', () => {
        const [first, second] = lastTwoApys(statusWith([election(before(100)), election(before(70000))]));
        expect(first).toBeGreaterThan(0);
        expect(second).toBeGreaterThan(0);
        expect(first).toBeCloseTo(second);
    });
});
