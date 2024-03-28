export function calculateApy(
    totalStake: bigint,
    totalBonuses: bigint,
    cycleDuration: number
): string {
    const precision = 1000000n;
    const yearInSec = 365 * 24 * 60 * 60 * 1000;
    const cyclesPerYear = Math.floor(yearInSec / (cycleDuration * 2));

    let percentPerCycle = Number((totalBonuses * precision) / totalStake) / Number(precision);
    let compound = Math.pow(1 + percentPerCycle, cyclesPerYear) - 1;

    return (compound * 100).toFixed(5);
}