import { Address, TonClient4 } from "@ton/ton";

export async function fetchRoughBlockCreationTime(seqno: number, client: TonClient4) {
    const block = await client.getBlock(seqno);

    const shard = block.shards[0];
    const tx = shard.transactions[0];

    // fetch one transaction from the block to approximate the block creation time
    const txsParsed = await client.getAccountTransactionsParsed(
        Address.parse(tx.account),
        BigInt(tx.lt),
        Buffer.from(tx.hash, 'base64'),
        1
    );

    const txParsed = txsParsed.transactions[0];
    const blockCreationTime = txParsed.time;

    return blockCreationTime * 1000; // in ms
}