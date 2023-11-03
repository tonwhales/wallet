import { Address } from "@ton/core";
import { TonClient4 } from '@ton/ton';

export async function fetchSupportedInterfaces(client: TonClient4, seqno: number, address: Address) {

    // Fetch from blockchain
    let interfaces = await client.runMethod(seqno, address, 'supported_interfaces');

    // Chech basic correctness
    if (interfaces.exitCode !== 0 && interfaces.exitCode !== 1) {
        return [];
    }
    if (interfaces.result.length < 2) {
        return [];
    }
    if (interfaces.result[0].type !== 'int') {
        return [];
    }
    if (interfaces.result[0].value.toString(10) !== '123515602279859691144772641439386770278') {
        return [];
    }

    // Extract interfaces
    let res: string[] = [];
    for (let i = 1; i < interfaces.result.length; i++) {
        let itm = interfaces.result[i];
        if (itm.type !== 'int') {
            return [];
        }
        res.push(itm.value.toString(10));
    }

    // Result
    return res;
}