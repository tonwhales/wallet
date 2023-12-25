import { useQuery } from '@tanstack/react-query';
import { Address, TonClient4 } from '@ton/ton';
import { Queries } from '../../queries';
import { getLastBlock } from '../../accountWatcher';

export function useWalletV4(client: TonClient4, addressString: string) {
    return useQuery({
        queryKey: Queries.Account(addressString).WalletV4(),
        queryFn: async () => {
            let address = Address.parse(addressString);
            let last = await getLastBlock();

            let seqnoResult = await client.runMethod(last, address, 'seqno');
            if (seqnoResult.exitCode !== 0 || seqnoResult.result.length !== 1 || seqnoResult.result[0].type !== 'int') {
                return null;
            }
            let seqno = seqnoResult.result[0].value;
            return {
                seqno: Number(seqno),
                last,
            };
        }
    });
}