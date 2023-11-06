import { holdersUrl } from "../../api/holders/fetchAccountState";
import { useDomainKeys } from "../dapps/useDomainKeys";
import { deleteHoldersToken } from "./useHoldersAccountStatus";
import { extractDomain } from "../../utils/extractDomain";
import { queryClient } from "../../clients";

export function useClearHolders() {
    const [domainKeys, setDomainKeysState] = useDomainKeys();

    return async (address: string) => {
        deleteHoldersToken(address);

        const temp = { ...domainKeys };
        const domain = extractDomain(holdersUrl);
        delete temp[domain.toLowerCase()];

        setDomainKeysState(temp);

        await queryClient.cancelQueries(['holders']);
        await queryClient.removeQueries(['holders']);
    }
}