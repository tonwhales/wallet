import { useHoldersAccountStatus, useIsConnectAppReady, useIsLedgerRoute, useNetwork, useSelectedAccount } from "..";
import { HoldersUserState } from "../../api/holders/fetchUserState";
import { holdersUrl as resolveHoldersUrl } from "../../api/holders/fetchUserState";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { Address } from "@ton/ton";

export function useEnrolledAndReady() {
    const { isTestnet } = useNetwork();
    const isLedger = useIsLedgerRoute();
    const selected = useSelectedAccount();
    const ledgerContext = useLedgerTransport();
    const holdersUrl = resolveHoldersUrl(isTestnet);
    const address = isLedger ? Address.parse(ledgerContext.addr!.address) : selected!.address;
    const addressString = address.toString({ testOnly: isTestnet }); 
    const status = useHoldersAccountStatus(address).data;
    const isTonconnectReady = useIsConnectAppReady(holdersUrl, addressString);
    const enrolled = status?.state !== HoldersUserState.NeedEnrollment
        && status?.state !== HoldersUserState.NoRef;

    return enrolled && isTonconnectReady;
}