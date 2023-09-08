import { useRecoilValue } from 'recoil';
import { appStateAtom } from '../state/appState';
import { Address } from 'ton';

export function useSelectedAccount() {
    let state = useRecoilValue(appStateAtom);

    return {
        ...state.addresses[state.selected],
        addressString: 'EQA-daKmzkx5nLMKT465D_-uyhwgBTEucMeyvfGLfzHoWspv',
        address: Address.parse('EQA-daKmzkx5nLMKT465D_-uyhwgBTEucMeyvfGLfzHoWspv'),
    };
}