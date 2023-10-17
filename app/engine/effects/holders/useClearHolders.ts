import { deleteHoldersToken, useHoldersAccountStatus } from "../../hooks/holders/useHoldersAccountStatus";

export function useClearHolders(address: string) {
    const status = useHoldersAccountStatus(address);

    return () => {
        deleteHoldersToken(address);
        status.refetch();
    }
}