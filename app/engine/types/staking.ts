export type StakingPoolParams = {
    enabled: boolean,
    udpatesEnabled: boolean,
    minStake: bigint,
    depositFee: bigint,
    withdrawFee: bigint,
    poolFee: bigint,
    receiptPrice: bigint
}

export type StakingPoolStatus = {
    proxyStakeAt: number,
    proxyStakeUntil: number,
    proxyStakeSent: bigint,
    querySent: boolean,
    canUnlock: boolean,
    locked: boolean,
    proxyStakeLockFinal: boolean,
};

export type StakingPoolMember = {
    balance: bigint;
    pendingWithdraw: bigint;
    pendingDeposit: bigint;
    withdraw: bigint;
    pool: string;
};

export type StakingPoolState = {
    params: StakingPoolParams;
    status: StakingPoolStatus;
    member: StakingPoolMember | null;
}
