import { Address, Slice } from "@ton/core";
import { warn } from "../../../utils/log";
import { ContentSource, JettonMaster } from "../Metadata";
import { TonClient4 } from '@ton/ton';

function parseString(slice: Slice) {
    let res = slice.loadBuffer(Math.floor(slice.remainingBits / 8)).toString();
    let rr = slice;
    if (rr.remainingRefs > 0) {
        rr = rr.loadRef().beginParse();
        res += rr.loadBuffer(Math.floor(rr.remainingBits / 8)).toString();
    }
    return res;
}

export async function tryFetchJettonMaster(client: TonClient4, seqno: number, address: Address): Promise<JettonMaster | null> {
    let walletData = await client.runMethod(seqno, address, 'get_jetton_data');
    if (walletData.exitCode !== 0 && walletData.exitCode !== 1) {
        return null;
    }
    if (walletData.result.length !== 5) {
        return null;
    }
    if (walletData.result[0].type !== 'int') {
        return null;
    }
    if (walletData.result[1].type !== 'int') {
        return null;
    }
    if (walletData.result[2].type !== 'slice') {
        return null;
    }
    if (walletData.result[3].type !== 'cell') {
        return null;
    }
    if (walletData.result[4].type !== 'cell') {
        return null;
    }

    // Parsing
    let totalSupply: bigint;
    let mintalbe: boolean;
    let owner: Address | null;
    let content: ContentSource | null;
    try {

        totalSupply = walletData.result[0].value;
        mintalbe = walletData.result[1].value !== 0n;
        let _owner = walletData.result[2].cell.beginParse().loadAddress();
        if (!_owner) {
            owner = null;
        } else {
            owner = _owner;
        }

        let cs = walletData.result[3].cell.beginParse();
        let kind = cs.loadUint(8);
        if (kind === 1) {
            let res = parseString(cs);
            content = { type: 'offchain', link: res };
        } else if (kind === 0) {
            content = { type: 'onchain' };
        } else {
            throw Error('Unsupported');
        }
        // if (content.readUintNumber())
        // console.warn(content.readUintNumber(8));
        // console.warn(parseDict(content, 256, (slice) => slice.readRemaining()));
        // if (!_master) {
        //     return null;
        // }
        // master = _master;
    } catch (e) {
        warn(`tryFetchJettonMaster error: ${e}`);
        return null;
    }

    return {
        totalSupply,
        mintalbe,
        owner,
        content
    };
}