import { backoff } from '../../utils/time';
import { onAccountTouched } from './onAccountTouched';
import { queryClient } from '../clients';
import { Address, TonClient4 } from '@ton/ton';

export function getMissedBlocksRange(lastBlock: number, newBlock: number) {
    return [...new Array(newBlock - lastBlock - 1).fill(0).map((a, i) => lastBlock + i + 1)];
}

export async function onBlockMissed(client: TonClient4, lastBlock: number, newBlock: number, isTestnet: boolean, accs: string[] = []) {
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

            for (let t of touched) {
                const parsed = Address.parse(t);
                if (accs.includes(parsed.toString({ testOnly: isTestnet }))) {
                    onAccountTouched(t, isTestnet);
                }
            }
        } catch {
            await invalidateAllAccounts();
        }
    } else {
        await invalidateAllAccounts();
    }
}