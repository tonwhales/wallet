import axios from "axios";

export async function fetchElections(maxLength: number | null, isTestnet?: boolean) {
    const url = `https://connect.tonhubapi.com/net/${isTestnet ? 'sandbox' : 'mainnet'}/elections/latest`;

    let latestElections = (await axios.get(url)).data;
    let elections = (latestElections as { elections: number[] }).elections;

    if (maxLength) {
        elections = elections.slice(elections.length - maxLength);
    }

    return await Promise.all(
        elections.map(async (el) => {
            const url = `https://connect.tonhubapi.com/net/${isTestnet ? 'sandbox' : 'mainnet'}/elections/${el}`;
            let election = (await axios.get(url)).data;

            let r = election as {
                election: {
                    unfreezeAt: number;
                    stakeHeld: number;
                    bonuses: string;
                    totalStake: string;
                };
            };

            return {
                id: el,
                unfreezeAt: r.election.unfreezeAt,
                stakeHeld: r.election.stakeHeld,
                bonuses: r.election.bonuses,
                totalStake: r.election.totalStake
            };
        })
    );
}