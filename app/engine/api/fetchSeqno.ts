import { Address } from "@ton/core";
import { TonClient4 } from '@ton/ton';

export async function fetchSeqno(client: TonClient4, block: number, address: Address) {
    let seqnoRes = await client.runMethod(block, address, 'seqno');
    let seqno = 0;
    if (seqnoRes.exitCode === 0 || seqnoRes.exitCode === 1) {
        if (seqnoRes.result[0].type !== 'int') {
            throw Error('Invalid response');
        }
        seqno = Number(seqnoRes.result[0].value);
    }
    return seqno;
}