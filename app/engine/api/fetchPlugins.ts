import { Address } from "@ton/core";
import { TonClient4 } from '@ton/ton';

export async function fetchPlugins(client: TonClient4, block: number, address: Address) {
    let seqnoRes = await client.runMethod(block, address, 'get_plugin_list');
    if (seqnoRes.exitCode !== 0 && seqnoRes.exitCode !== 1) {
        return [];
    }
    if (seqnoRes.result.length !== 1) {
        return [];
    }
    let tail = seqnoRes.result[0];
    let plugins: Address[] = [];
    while (tail.type === 'tuple') {
        if (tail.items[0].type !== 'tuple') {
            return [];
        }
        if (tail.items[0].items[0].type !== 'int') {
            return [];
        }
        if (tail.items[0].items[1].type !== 'int') {
            return [];
        }
        let workchain = Number(tail.items[0].items[0].value);
        let hash = Buffer.from(tail.items[0].items[1].value.toString(16), 'hex');
        let address = new Address(workchain, hash);
        plugins.push(address);
        tail = tail.items[1];
    }
    return plugins
}