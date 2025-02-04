import { useRecoilValue } from "recoil";
import { connectionsMapAtom } from "../../state/tonconnect";
import { useSelectedAccount } from "..";

export function useAppsConnections(address?: string) {
    const currentAccount = useSelectedAccount();
    return useRecoilValue(connectionsMapAtom)[address ?? currentAccount?.addressString ?? ''] ?? {};
}

export function useAppConnections(address?: string) {
    const currentAccount = useSelectedAccount();
    const state = useRecoilValue(connectionsMapAtom)[address ?? currentAccount?.addressString ?? ''];
    return (key: string) => {
        return state[key] || [];
    }
}