import { TonClient4 } from 'ton';
import { backoff } from '../../utils/time';
import { onAccountTouched } from './onAccountTouched';
import { Queries } from '../queries';
import { queryClient } from '../clients';

export function getMissedBlocksRange(lastBlock: number, newBlock: number) {
    return [...new Array(newBlock - lastBlock - 1).fill(0).map((a, i) => lastBlock + i + 1)];
}

export async function onBlockMissed(client: TonClient4, lastBlock: number, newBlock: number) {
    let missedBlocksRange = getMissedBlocksRange(lastBlock, newBlock);
    if (missedBlocksRange.length < 5) {
        // Invalidate only accounts touched in missed blocks
        let missedBlocks = await Promise.all(missedBlocksRange.map((block) => backoff('missed-block-' + block, () => client.getBlock(block))));
        let touched = new Set(missedBlocks.flatMap(a => a.shards.flatMap(a => a.transactions)).map(a => a.account));

        for (let t of touched) {
            onAccountTouched(t);
        }
    } else {
        // Invalidate all accounts
        queryClient.invalidateQueries({
            queryKey: ['account'],
        });
    }
}