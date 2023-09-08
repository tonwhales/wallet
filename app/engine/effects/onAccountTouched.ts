import { Address } from 'ton';
import { queryClient } from '../clients';
import { Queries } from '../queries';

export async function onAccountTouched(account: string, isTestnet: boolean) {
    // If account touched - transactions and state changed
    let address = Address.parse(account).toFriendly({ testOnly: isTestnet });
    await queryClient.invalidateQueries(Queries.Account(address));
}