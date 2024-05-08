import axios from "axios";
import { stakingIndexerUrl } from "./fetchStakingNominator";
import { Address } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { fetchStakingStatusV4 } from "./fetchStakingStatusV4";

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

export async function fetchStakingStatus(client: TonClient4, isTestnet: boolean): Promise<StakingStatus | null> {
    try {
        const res = await axios.get(`${stakingIndexerUrl}/status/${isTestnet ? 'testnet' : ''}`);

        if (res.status !== 200) {
            throw new Error('Failed to fetch staking status');
        }

        return res.data.status.data as StakingStatus;
    } catch { // fallback to v4
        const seqno = (await client.getLastBlock()).last.seqno;
        return await fetchStakingStatusV4(client, seqno, 5, isTestnet);
    }
}