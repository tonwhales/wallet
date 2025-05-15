import { useRecoilCallback } from 'recoil';
import { AppState, clearLedgerSelected, setAppState } from '../../../storage/appState';
import { appStateAtom } from '../../state/appState';
import { onAccountTouched } from '../../effects/onAccountTouched';
import { useEthena } from '../staking/useEthena';
export function useSetAppState() {
    const ethena = useEthena();
    return useRecoilCallback(({ set }) => (value: AppState, isTestnet: boolean) => {
        set(appStateAtom, () => {
            const temp = value;
            let selected = temp.selected;

            //Filter duplicates
            temp.addresses = temp.addresses.filter((address, index, self) => {
                const isDup = self.findIndex((a) => a.addressString === address.addressString) !== index;
                if (isDup) {
                    selected = 0;
                }
                return !isDup;
            });

            const newSelectedAddress = temp.addresses[temp.selected];

            selected = !!newSelectedAddress ? temp.selected : 0;
            if (temp.addresses.length === 0) {
                selected = -1;
            }
            temp.selected = selected;

            // Update
            setAppState(temp, isTestnet);
            
            // if useSetAppState is called it means that we are currently 
            // using standard wallet, not the Ledger one. That's why we clear
            // the Ledger selected state
            clearLedgerSelected()

            // Update queries for new selected
            if (newSelectedAddress) {
                onAccountTouched(newSelectedAddress.addressString, isTestnet, ethena);
            }

            return temp;
        });
    }, [ethena]);
}