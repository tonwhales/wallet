import { holdersUrl } from "../../api/holders/fetchAccountState";
import { useDomainKeys } from "../dapps/useDomainKeys";
import { deleteHoldersToken, useHoldersAccountStatus } from "./useHoldersAccountStatus";
import { useHoldersCards } from "./useHoldersCards";
import { extractDomain } from "../../utils/extractDomain";

export function useClearHolders(address: string) {
    const [domainKeys, setDomainKeysState] = useDomainKeys();
    const status = useHoldersAccountStatus(address);
    const cards = useHoldersCards(address);

    return async () => {
        deleteHoldersToken(address);

        const temp = { ...domainKeys };
        const domain = extractDomain(holdersUrl);
        delete temp[domain.toLowerCase()];

        setDomainKeysState(temp);

        await cards.refetch();
        await status.refetch();
    }
}