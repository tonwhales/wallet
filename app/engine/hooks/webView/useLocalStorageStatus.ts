import { useRecoilState } from "recoil";
import { LocalStorageStatus, localStorageStatusAtom } from "../../state/webViewLocalStorage";

export function useLocalStorageStatus(): [
    LocalStorageStatus,
    (status: Partial<Omit<LocalStorageStatus, 'lastChecked'>>) => void
] {
    const [state, setState] = useRecoilState(localStorageStatusAtom);

    const updateLocalStorageStatus = (status: Partial<Omit<LocalStorageStatus, 'lastChecked'>>) => {
        setState(prev => ({
            ...prev,
            ...status,
            lastChecked: Date.now()
        }));
    };

    return [state, updateLocalStorageStatus];
} 