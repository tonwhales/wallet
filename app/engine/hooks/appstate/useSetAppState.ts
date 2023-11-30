import { useRecoilCallback } from 'recoil';
import { AppState, setAppState } from '../../../storage/appState';
import { appStateAtom } from '../../state/appState';
import { connectExtensionsState, loadExtensionsStored } from '../../state/tonconnect';
import { onAccountTouched } from '../../effects/onAccountTouched';

export function useSetAppState() {
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

            // Update extensions for new selected
            set(connectExtensionsState, loadExtensionsStored());

            // Update queries for new selected
            if (newSelectedAddress) {
                onAccountTouched(newSelectedAddress.addressString, isTestnet);
            }

            return temp;
        });
    }, []);
}