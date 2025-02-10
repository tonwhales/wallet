import { useRecoilState } from "recoil";
import { ledgerWalletsAtom } from "../../state/ledger";

export function useLedgerWallets() {
    return useRecoilState(ledgerWalletsAtom);
}
