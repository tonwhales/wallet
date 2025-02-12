import { useRecoilValue } from "recoil";
import { connectionsMapAtom } from "../../state/tonconnect";
import { useSelectedAccount } from "..";

export function useAppsConnections(address?: string) {
    const currentAccount = useSelectedAccount();
    const addr = address ?? currentAccount?.addressString;
    return useRecoilValue(connectionsMapAtom)?.[addr ?? ''] ?? {};
}

export function useAppConnections(address?: string) {
    const currentAccount = useSelectedAccount();
    const fullState = useRecoilValue(connectionsMapAtom);
    const addr = address ?? currentAccount?.addressString;
    const state = fullState?.[addr ?? ''];
    return (key: string) => {
        return state[key] || [];
    }
}