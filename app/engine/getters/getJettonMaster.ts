import { Address } from '@ton/core';
import { queryClient } from '../clients';
import { Queries } from '../queries';
import { JettonMasterState } from '../metadata/fetchJettonMasterContent';
import { jettonMasterContentQueryFn } from '../hooks/jettons/jettonsBatcher';

export function fetchJettonMaster(master: Address, testOnly: boolean) {
    let addressString = master.toString({ testOnly: testOnly });
    return queryClient.fetchQuery({
        queryKey: Queries.Jettons().MasterContent(addressString),
        queryFn: jettonMasterContentQueryFn(addressString, testOnly),
    });
}

export function getJettonMaster(master: Address, testOnly: boolean) {
    let addressString = master.toString({ testOnly: testOnly });
    return queryClient.getQueryData<JettonMasterState>(Queries.Jettons().MasterContent(addressString));
}