import { StakingStatus } from "../../engine/api/fetchStakingStatus";
import { calculateApy } from "./calculateApy";

export function lastTwoApys(status?: StakingStatus | null): [number, number] {

    if (!status) {
        return [0, 0];
    }

    const startValidation = status.startWorkTime;
    const electionEntities = status.electionEntities;

    electionEntities.sort((a, b) => {
        if (a.amount < b.amount) {
            return -1;
        }
        if (a.amount > b.amount) {
            return 1;
        }
        return 0;
    });

    const filtered = status.electionsHistory.filter((v) => {
        return v.id * 1000 < startValidation;
    });

    const bounses_0 = (filtered[0].id * 1000 === startValidation)
        ? status.bonuses
        : BigInt(filtered[0].bonuses);

    const bounses_1 = (filtered[1].id * 1000 === startValidation)
        ? status.bonuses
        : BigInt(filtered[1].bonuses);

    const apy_0 = calculateApy(
        BigInt(filtered[0].totalStake),
        bounses_0,
        status.validatorsElectedFor
    );

    const apy_1 = calculateApy(
        BigInt(filtered[1].totalStake),
        bounses_1,
        status.validatorsElectedFor
    );

    return [parseFloat(apy_0), parseFloat(apy_1)];
}