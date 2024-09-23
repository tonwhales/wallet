import { Address } from "@ton/core";
import { TonClient4 } from '@ton/ton';

export async function tryFetchJettonWalletIsClaimed(client: TonClient4, seqno: number, address: Address) {
    let result = await client.runMethod(seqno, address, 'is_claimed');

    if (result.exitCode !== 0 && result.exitCode !== 1) {
        return null;
    }
    if (result.result[0].type !== 'int') {
        return null;
    }

    return result.result[0].value === 1n;
}