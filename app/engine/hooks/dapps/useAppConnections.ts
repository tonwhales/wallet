import { useRecoilValue } from "recoil";
import { connectionsFamily } from "../../state/tonconnect";
import { useSelectedAccount } from "..";

export function useAppsConnections() {
    const currentAccount = useSelectedAccount();
    return useRecoilValue(connectionsFamily(currentAccount?.addressString ?? ''));
}

export function useAppConnections() {
    const currentAccount = useSelectedAccount();
    const state = useRecoilValue(connectionsFamily(currentAccount?.addressString ?? ''));
    return (key: string) => {
        return state[key] || [];
    }
}