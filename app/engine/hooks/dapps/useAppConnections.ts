import { useRecoilValue } from "recoil";
import { connectionsMapAtom } from "../../state/tonconnect";
import { useSelectedAccount } from "..";

export function useAppsConnections() {
    const currentAccount = useSelectedAccount();
    return useRecoilValue(connectionsMapAtom)[currentAccount?.addressString ?? ''];
}

export function useAppConnections() {
    const currentAccount = useSelectedAccount();
    const state = useRecoilValue(connectionsMapAtom)[currentAccount?.addressString ?? ''];
    return (key: string) => {
        return state[key] || [];
    }
}