import { ElectorContract, TonClient4, configParse15, configParse16, configParse17, configParseValidatorSet, loadConfigParamById } from "@ton/ton";
import { StakingStatus } from "./fetchStakingStatus";

export async function fetchStakingStatusV4(client: TonClient4, lastSeqno: number): Promise<StakingStatus> {
    let [
        config,
        electionEntities,
        elections
    ] = await Promise.all([
        client.getConfig(lastSeqno, [15, 16, 17, 34]),
        client.open(ElectorContract.create()).getElectionEntities().then((v) => { return v?.entities; }),
        client.open(ElectorContract.create()).getPastElections(),
    ]);

    const config15 = configParse15(loadConfigParamById(config.config.cell, 15).beginParse());
    const config34 = configParseValidatorSet(loadConfigParamById(config.config.cell, 34).beginParse());
    const config16 = configParse16(loadConfigParamById(config.config.cell, 16).beginParse());
    const config17 = configParse17(loadConfigParamById(config.config.cell, 17).beginParse());

    let electorsEndBefore = config15.electorsEndBefore * 1000;
    let electorsStartBefore = config15.electorsStartBefore * 1000;
    let validatorsElectedFor = config15.validatorsElectedFor * 1000;
    let startWorkTime = config34!.timeSince * 1000;
    let stakeHeldFor = config15.stakeHeldFor;
    let minValidators = config16.minValidators;
    let maxValidators = config16.maxValidators;
    let maxMainValidators = config16.maxMainValidators;
    let minStake = config17.minStake;
    let maxStake = config17.maxStake;
    let bonuses = 0n;
    let validators: { key: number, weight: string, address: string, stake: bigint, adnl: string | null }[] = [];

    let ex = elections.find((v) => v.id === config34!.timeSince)!;
    if (ex) {
        bonuses = BigInt(ex.bonuses);
        for (let key of config34!.list!.keys()) {
            let val = config34!.list!.get(key)!;
            let v = ex.frozen.get(BigInt('0x' + val.publicKey.toString('hex')).toString(10));
            validators.push({
                key,
                weight: val.weight.toString(),
                adnl: val.adnlAddress ? val.adnlAddress.toString('hex') : null,
                stake: v!.stake,
                address: v!.address!.toString()
            });
        }
    }

    const from = config34!.timeSince;
    const until = config34!.timeUntil;
    const entities = electionEntities?.map((e) => ({
        key: e.pubkey.toString('base64'),
        amount: e.stake,
        address: e.address.toString(),
        adnl: e.adnl.toString('hex')
    }))

    return {
        validationFrom: from,
        validationUntil: until,
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
        electionEntities: entities ?? [],
        complaints: [],
        electionsHistory: []
    };
}