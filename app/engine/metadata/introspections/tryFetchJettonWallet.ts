import { Address } from "@ton/core";
import { warn } from "../../../utils/log";
import { JettonWallet } from "../Metadata";
import { TonClient4 } from '@ton/ton';

export async function tryFetchJettonWallet(client: TonClient4, seqno: number, address: Address): Promise<JettonWallet | null> {
    let walletData = await client.runMethod(seqno, address, 'get_wallet_data');
    if (walletData.exitCode !== 0 && walletData.exitCode !== 1) {
        return null;
    }
    if (walletData.result.length !== 4) {
        return null;
    }
    if (walletData.result[0].type !== 'int') {
        return null;
    }
    if (walletData.result[1].type !== 'slice') {
        return null;
    }
    if (walletData.result[2].type !== 'slice') {
        return null;
    }
    if (walletData.result[3].type !== 'cell') {
        return null;
    }

    // Parsing
    let balance: bigint;
    let owner: Address;
    let master: Address;
    try {
        balance = walletData.result[0].value;
        let _owner = walletData.result[1].cell.beginParse().loadAddress();
        if (!_owner) {
            return null;
        }
        owner = _owner;
        let _master = walletData.result[2].cell.beginParse().loadAddress();
        if (!_master) {
            return null;
        }
        master = _master;
    } catch (e) {
        warn(e);
        return null;
    }

    return {
        balance,
        owner,
        master,
        address
    };
}