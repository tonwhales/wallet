import { Address, TonClient4 } from "ton";

export async function fetchPlugins(client: TonClient4, block: number, address: Address) {
    let seqnoRes = await client.runMethod(block, address, 'get_plugin_list');
    console.log({ seqnoRes });
    if (seqnoRes.exitCode !== 0 && seqnoRes.exitCode !== 1) {
        return [];
    }
    if (seqnoRes.result.length !== 1) {
        return [];
    }
    if (seqnoRes.result[0].type !== 'tuple') {
        return [];
    }
    let items = seqnoRes.result[0].items;
    let plugins: Address[] = [];
    for (let i of items) {
        if (i.type === 'null') {
            continue;
        }
        if (i.type !== 'tuple') {
            return [];
        }
        if (i.items[0].type !== 'int') {
            return [];
        }
        if (i.items[1].type !== 'int') {
            return [];
        }

        let workchain = i.items[0].value.toNumber();
        let hash = Buffer.from(i.items[1].value.toString('hex', 32), 'hex');
        let address = new Address(workchain, hash);
        plugins.push(address);
    }
    return plugins
}