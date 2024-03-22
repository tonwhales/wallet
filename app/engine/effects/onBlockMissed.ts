import { backoff } from '../../utils/time';
import { onAccountTouched, onAccountsTouched } from './onAccountTouched';
import { queryClient } from '../clients';
import { Address, TonClient4 } from '@ton/ton';

export function getMissedBlocksRange(lastBlock: number, newBlock: number) {
    return [...new Array(newBlock - lastBlock - 1).fill(0).map((a, i) => lastBlock + i + 1)];
}

export async function onBlockMissed(client: TonClient4, lastBlock: number, newBlock: number, isTestnet: boolean) {
    async function invalidateAllAccounts() {
        await queryClient.invalidateQueries({
            queryKey: ['account'],
        });

        await queryClient.invalidateQueries({
            queryKey: ['transactions'],
            refetchPage: (last, index, allPages) => index == 0,
        });
    }

    let missedBlocksRange = getMissedBlocksRange(lastBlock, newBlock);
    if (missedBlocksRange.length < 5) {
        try {
            // Invalidate only accounts touched in missed blocks
            let missedBlocks = await Promise.all(missedBlocksRange.map((block) => backoff('missed-block-' + block, () => client.getBlock(block))));
            let touched = new Set(missedBlocks.flatMap(a => a.shards.flatMap(a => a.transactions)).map(a => a.account));

            if (isTestnet) { // we get addresses without testOnly flag from the client, so we need to parse them
                touched = new Set([...touched].map(a => Address.parse(a).toString({ testOnly: true })));
            }

            onAccountsTouched(touched);
        } catch {
            // Invalidate all in case of error
            invalidateAllAccounts();
        }
    } else {
        invalidateAllAccounts();
    }
}