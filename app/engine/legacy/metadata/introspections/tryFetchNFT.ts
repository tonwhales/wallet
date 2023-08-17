import { Address, TonClient4 } from "ton";

export async function tryFetchNFT(client: TonClient4, seqno: number, address: Address) {
    let nftData = await client.runMethod(seqno, address, 'get_nft_data');
    if (nftData.exitCode !== 0 && nftData.exitCode !== 1) {
        return null;
    }
    if (nftData.result.length !== 5) {
        return null;
    }
    if (nftData.result[0].type !== 'int') {
        return null;
    }
    if (nftData.result[1].type !== 'int') {
        return null;
    }
    if (nftData.result[2].type !== 'slice') {
        return null;
    }
    if (nftData.result[3].type !== 'slice') {
        return null;
    }
    if (nftData.result[4].type !== 'cell') {
        return null;
    }

    let inited = !nftData.result[0].value.eqn(0);
    let index = nftData.result[1].value.toNumber();
    let collection = nftData.result[2].cell.beginParse().readAddress();
    let owner = nftData.result[3].cell.beginParse().readAddress();
    let content = nftData.result[4].cell;
    
    return {
        inited,
        index,
        collection,
        owner,
        content
    };
}