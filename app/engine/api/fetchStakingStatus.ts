import axios from "axios";
import { stakingIndexerUrl } from "./fetchStakingNominator";
import { Address } from "@ton/core";

export type StakingStatus = {
    electorsEndBefore: number;
    electorsStartBefore: number;
    validatorsElectedFor: number;
    startWorkTime: number;
    stakeHeldFor: number;
    minStake: bigint;
    maxStake: bigint;
    bonuses: bigint;
    minValidators: number;
    maxValidators: number;
    maxMainValidators: number;
    validationFrom: number;
    validationUntil: number;
    // previousBonuses: string,
    // previousStake: string,
    electionEntities: { key: string; amount: bigint; address: string; adnl: string }[];
    validators: {
        key: number;
        weight: string;
        address: string;
        stake: bigint;
        adnl: string | null;
    }[];
    complaints: {
        reporter: Address;
        violator: Address;
        violatorAdnl: Buffer;
        paid: bigint;
        suggestedFine: bigint;
        suggestedFineFactor: bigint;
        approved: number;
        voted: number;
    }[];
    electionsHistory: {
        id: number;
        unfreezeAt: number;
        stakeHeld: number;
        bonuses: string;
        totalStake: string;
    }[];
};

export async function fetchStakingStatus(isTestnet: boolean): Promise<StakingStatus | null> {

    if (isTestnet) {
        return null;
    }

    const res = await axios.get(`${stakingIndexerUrl}/status`);

    if (res.status !== 200) {
        throw new Error('Failed to fetch staking status');
    }

    const status = res.data.status.data as StakingStatus;

    return status;
}