import BN from 'bn.js';
import { Address, TonClient } from "ton";
import { ElectorContract } from "ton-contracts";
import { AppConfig } from "../AppConfig";

export interface StakingData {
    electorsEndBefore: number,
    electorsStartBefore: number,
    validatorsElectedFor: number,
    startWorkTime: number,
    stakeHeldFor: number,
    minStake: BN,
    maxStake: BN,
    bonuses: BN,
    minValidators: number,
    maxValidators: number,
    maxMainValidators: number,
    electionEntities: { key: string, amount: BN, address: string }[],
    validators: {
        key: string,
        weight: string,
        address: string,
        stake: BN,
        adnl: string | null
    }[],
    complaints: {
        reporter: Address,
        violator: Address,
        violatorAdnl: Buffer,
        paid: BN,
        suggestedFine: BN,
        suggestedFineFactor: BN,
        approved: number,
        voted: number
    }[]
};

const endpoints = !AppConfig.isTestnet ? {
    main: 'https://mainnet.tonhubapi.com',
    estimate: 'https://connect.tonhubapi.com/estimate',
    sender: 'https://connect.tonhubapi.com/send',
} : {
    main: 'https://testnet.tonhubapi.com',
    estimate: 'https://connect.tonhubapi.com/estimate',
    sender: 'https://connect.tonhubapi.com/send',
}

export async function fetchStaking(): Promise<StakingData> {
    const tonClient = new TonClient({ endpoint: endpoints.main + '/jsonRPC' });
    let [configs, electionEntities, elections] = await Promise.all([
        tonClient.services.configs.getConfigs(),
        new ElectorContract(tonClient).getElectionEntities().then((v) => v.entities),
        new ElectorContract(tonClient).getPastElections()
    ]);

    let electorsEndBefore = configs.validators.electorsEndBefore * 1000;
    let electorsStartBefore = configs.validators.electorsStartBefore * 1000;
    let validatorsElectedFor = configs.validators.validatorsElectedFor * 1000;
    let startWorkTime = configs.validatorSets.currentValidators!.timeSince * 1000;
    let stakeHeldFor = configs.validators.stakeHeldFor;
    let minValidators = configs.validators.minValidators;
    let maxValidators = configs.validators.maxValidators;
    let maxMainValidators = configs.validators.maxMainValidators;
    let minStake = configs.validators.minStake;
    let maxStake = configs.validators.maxStake;
    let validators: {
        key: string,
        weight: string,
        address: string,
        stake: BN,
        adnl: string | null
    }[] = [];
    let ex = elections.find((v) => v.id === configs.validatorSets.currentValidators!.timeSince)!;
    let bonuses = ex.bonuses;
    for (let key of configs.validatorSets.currentValidators!.list!.keys()) {
        let val = configs.validatorSets.currentValidators!.list!.get(key)!;
        let v = ex.frozen.get(new BN(val.publicKey, 'hex').toString());
        validators.push({
            key,
            weight: val.weight.toString(),
            adnl: val.adnlAddress ? val.adnlAddress.toString('hex') : null,
            stake: v!.stake,
            address: v!.address!.toFriendly()
        })
    }

    // Fetch complaints
    let complaintsValidators = configs.validatorSets.currentValidators!;
    if (configs.validatorSets.prevValidators) {
        complaintsValidators = configs.validatorSets.prevValidators;
    }
    let complaintsElectionId = complaintsValidators.timeSince;
    let complaintsElections = elections.find((v) => v.id === complaintsElectionId)!;
    let complaints = await new ElectorContract(tonClient).getComplaints(complaintsElectionId);
    console.warn(complaints);
    console.warn(complaintsElections);
    let niceComplaints: {
        reporter: Address,
        violator: Address,
        violatorAdnl: Buffer,
        paid: BN,
        suggestedFine: BN,
        suggestedFineFactor: BN,
        approved: number,
        voted: number,
    }[] = [];

    for (let c of complaints) {
        let adnl = Array.from(complaintsValidators.list!.entries()).find((v) => v[1].publicKey.equals(c.publicKey))![1].adnlAddress!;
        let address = complaintsElections.frozen.get(new BN(c.publicKey, 'hex').toString())!.address;

        let allWeight = complaintsValidators.totalWeight!;
        let requiredWeight = allWeight.muln(2).divn(3);
        let votedWeight = requiredWeight.sub(c.remainingWeight);
        let approved = votedWeight.muln(100000).div(allWeight).toNumber() / 100000;
        niceComplaints.push({
            reporter: c.rewardAddress,
            violator: address,
            violatorAdnl: adnl,
            paid: c.paid,
            suggestedFine: c.suggestedFine,
            suggestedFineFactor: c.suggestedFinePart,
            approved,
            voted: c.votes.length
        })
    }

    return {
        validators,
        electorsEndBefore,
        electorsStartBefore,
        validatorsElectedFor,
        startWorkTime,
        stakeHeldFor,
        minStake,
        maxStake,
        bonuses,
        minValidators,
        maxValidators,
        maxMainValidators,
        electionEntities: electionEntities.map((v) => ({ key: v.pubkey.toString('base64'), amount: v.stake, address: v.address.toFriendly() })),
        complaints: niceComplaints
    }
};