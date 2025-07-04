import { Address } from "@ton/core";
import { useNetwork } from "../network";
import { useRecoilState } from "recoil";
import { useLedgerTransport } from "../../../fragments/ledger/components/TransportContext";
import { ledgerHiddenJettonsAtom } from "../../state/ledger";

export function useLedgerHiddenJettons(): [Record<string, boolean>, (jettonAddress: string, value: boolean) => void] {
    const { isTestnet } = useNetwork();
    const ledgerContext = useLedgerTransport();

    const address = ledgerContext.addr?.address ? Address.parse(ledgerContext.addr?.address) : null;

    const addressString = address instanceof Address
        ? address.toString({ testOnly: isTestnet })
        : address;

    const [state, update] = useRecoilState(ledgerHiddenJettonsAtom)

    if (!addressString) {
        return [{}, () => { }];
    }

    const hiddenJettons = state[addressString] || {};

    const markLedgerJettonDisabled = (jettonAddress: string, value: boolean) => {
        update((state) => ({
            ...state,
            [addressString]: {
                ...state[addressString],
                [jettonAddress]: value
            }
        }));
    }

    return [hiddenJettons, markLedgerJettonDisabled]
}