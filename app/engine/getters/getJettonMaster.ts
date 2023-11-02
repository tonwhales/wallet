import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { jettonMasterContentQueryFn } from '../hooks/usePrefetchHints';

export function getJettonMaster(master: Address, testOnly: boolean) {
    let addressString = master.toString({ testOnly: testOnly });
    return queryClient.fetchQuery({
        queryKey: Queries.Jettons().MasterContent(addressString),
        queryFn: jettonMasterContentQueryFn(addressString, testOnly),
    });
}