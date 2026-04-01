import { useMemo } from "react";
import { useServiceAddressCheck } from "./useServiceAddressCheck";
import { useContractInfo } from "./useContractInfo";
import { ForcedAvatarType } from "../../../components/avatar/ForcedAvatar";
import { parseMessageBody } from "../../transactions/parseMessageBody";
import { Cell } from "@ton/core";
import { useCurrentAddress } from "../appstate/useCurrentAddress";
import { useHoldersAccounts } from "../holders/useHoldersAccounts";

export type ForcedAvatarParams = {
    address?: string | null;
    /** Optional: if already fetched, pass it to avoid re-fetching */
    contractInfo?: ReturnType<typeof useContractInfo>;
    /** For transaction-based checks (holders operations) */
    holdersOp?: string | null;
    /** For pending transactions with payload body */
    payloadCell?: Cell | null;
    /** For cashback operations */
    isCashbackOp?: boolean;
    /** Skip user's own holders accounts check (for performance when not needed) */
    skipOwnHoldersCheck?: boolean;
};

/**
 * determine if a ForcedAvatar should be used for an address.
 * 
 * Priority:
 * 1. Service address check (useServiceAddressCheck) - first source of truth
 * 2. User's own holders account check
 * 3. Contract info kind (dedust-vault, card, jetton-card)
 * 4. Operation-based checks (holders ops, cashback)
 */
export function useForcedAvatarType(params: ForcedAvatarParams): ForcedAvatarType | undefined {
    const { address, contractInfo: providedContractInfo, holdersOp, payloadCell, isCashbackOp, skipOwnHoldersCheck } = params;
    const serviceInfo = useServiceAddressCheck(address ?? null);

    const { tonAddress, solanaAddress } = useCurrentAddress();
    const holdersAccounts = useHoldersAccounts(tonAddress, solanaAddress).data?.accounts ?? [];
    const isOwnHoldersAccount = useMemo(() => {
        if (skipOwnHoldersCheck || !address) return false;
        return !!holdersAccounts.find((acc) => acc.address === address);
    }, [holdersAccounts, address, skipOwnHoldersCheck]);

    const fetchedContractInfo = useContractInfo(providedContractInfo !== undefined ? null : (address ?? null));
    const contractInfo = providedContractInfo ?? fetchedContractInfo;

    return useMemo(() => {
        if (serviceInfo?.found && serviceInfo.service) {
            return serviceInfo.service;
        }

        if (isOwnHoldersAccount) {
            return 'holders';
        }

        if (isCashbackOp) {
            return 'cashback';
        }

        if (holdersOp?.startsWith('known.holders.')) {
            return 'holders';
        }

        if (contractInfo?.kind === 'dedust-vault') {
            return 'dedust';
        }

        if (contractInfo?.kind === 'card' || contractInfo?.kind === 'jetton-card') {
            return 'holders';
        }

        if (payloadCell) {
            const body = parseMessageBody(payloadCell);
            if (body && (
                body.type === 'holders::account::top_up' ||
                body.type === 'holders::account::limits_change'
            )) {
                return 'holders';
            }
        }

        return undefined;
    }, [serviceInfo, isOwnHoldersAccount, contractInfo, holdersOp, payloadCell, isCashbackOp]);
}

