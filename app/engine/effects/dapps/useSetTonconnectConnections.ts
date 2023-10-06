import { useRecoilCallback } from "recoil";
import { appsConnectionsState } from "../../state/tonconnect";
import { ConnectedAppConnection } from "../../legacy/tonconnect/types";

export function useSetAppsConnectionsState() {
    return useRecoilCallback(({ set }) => (updater: (prev: { [key: string]: ConnectedAppConnection[] }) => { [key: string]: ConnectedAppConnection[] }) => {
        set(appsConnectionsState, updater);
    }, []);
}