import { queryClient } from '../clients';
import { Queries } from '../queries';

export async function onAccountTouched(account: string) {
    await queryClient.invalidateQueries(Queries.Account(account));
}