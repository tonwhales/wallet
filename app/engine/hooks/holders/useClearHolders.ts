import { holdersUrl } from "../../api/holders/fetchUserState";
import { useDomainKeys } from "../dapps/useDomainKeys";
import { deleteHoldersToken } from "./useHoldersAccountStatus";
import { extractDomain } from "../../utils/extractDomain";
import { queryClient } from "../../clients";

export function useClearHolders(isTestnet: boolean) {
    const [domainKeys, setDomainKeysState] = useDomainKeys();

    return async (address: string) => {
        deleteHoldersToken(address);

        const temp = { ...domainKeys };
        const url = holdersUrl(isTestnet);
        const domain = extractDomain(url);
        delete temp[domain.toLowerCase()];

        setDomainKeysState(temp);

        await queryClient.cancelQueries({ predicate: (query) => query.queryKey[0] === 'holders' });
        await queryClient.removeQueries({ predicate: (query) => query.queryKey[0] === 'holders' });
    }
}