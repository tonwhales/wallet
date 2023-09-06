import { queryClient } from '../clients';
import { Queries } from '../queries';

export async function onAccountTouched(account: string) {
    // If account touched - transactions and state changed
    await queryClient.invalidateQueries(Queries.Account(account).State());
    await queryClient.invalidateQueries(Queries.Account(account).Transactions());
}