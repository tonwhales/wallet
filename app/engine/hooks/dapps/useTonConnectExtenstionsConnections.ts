import { useRecoilValue } from "recoil";
import { appConnections } from "../../state/tonconnect";

export function useTonConnectConnections(key: string) {
    const value = useRecoilValue(appConnections)[key];
    return value || [];
}