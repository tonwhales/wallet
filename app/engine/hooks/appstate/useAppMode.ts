import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { useRecoilState } from "recoil";
import { AppMode, walletsAppModesAtom } from "../../state/walletsAppModes";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";

export function useAppMode(_address?: string | Address | null, options?: { isLedger?: boolean }): [boolean, (value: boolean) => void] {
    const { isTestnet } = useNetwork();
    const ledgerContext = useLedgerTransport();

    const ledgerAddress = ledgerContext.addr?.address ? Address.parse(ledgerContext.addr?.address) : null;
    const address = options?.isLedger ? ledgerAddress : _address;

    const addressString = address instanceof Address
        ? address.toString({ testOnly: isTestnet })
        : address;

    const [state, update] = useRecoilState(walletsAppModesAtom)

    if (!addressString) {
        return [true, () => { }];
    }

    const appMode = state[addressString] || AppMode.Wallet;

    const setAppMode = (value: boolean) => {
        update((state) => ({
            ...state,
            [addressString]: value ? AppMode.Wallet : AppMode.Cards
        }));
    }

    return [appMode === AppMode.Wallet, setAppMode]
}