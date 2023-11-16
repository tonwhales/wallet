import { useRecoilValue } from "recoil";
import { connectionsSelector } from "../../state/tonconnect";

export function useAppsConnections() {
    return useRecoilValue(connectionsSelector);
}

export function useAppConnections() {
    const state = useRecoilValue(connectionsSelector);
    return (key: string) => {
        return state[key] || [];
    }
}