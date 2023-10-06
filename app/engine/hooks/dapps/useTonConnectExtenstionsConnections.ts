import { useRecoilValue } from "recoil";
import { appsConnectionsState } from "../../state/tonconnect";

export function useTonConnectConnections(key: string) {
    const value = useRecoilValue(appsConnectionsState)[key];
    return value || [];
}