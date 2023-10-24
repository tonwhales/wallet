import { useRecoilValue } from "recoil";
import { appsConnectionsState } from "../../state/tonconnect";

export function useAppConnections() {
    const state = useRecoilValue(appsConnectionsState);
    return (key: string) => {
        return state[key] || [];
    }
}