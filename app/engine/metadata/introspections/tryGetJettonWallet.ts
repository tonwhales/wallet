import { Address, beginCell } from "@ton/core";
import { TonClient4 } from '@ton/ton';

export async function tryGetJettonWallet(client: TonClient4, seqno: number, args: { address: Address, master: Address }) {
    let waletAddress = await client.runMethod(seqno, args.master, 'get_wallet_address', [{ type: 'slice', cell: beginCell().storeAddress(args.address).endCell() }]);
    if (waletAddress.exitCode !== 0 && waletAddress.exitCode !== 1) {
        return null;
    }
    if (waletAddress.result.length !== 1) {
        return null;
    }
    if (waletAddress.result[0].type !== 'slice') {
        return null;
    }
    return waletAddress.result[0].cell.beginParse().loadAddress();
}