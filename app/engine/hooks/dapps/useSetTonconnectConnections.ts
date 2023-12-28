import { useRecoilCallback } from "recoil";
import { connectionsSelector } from "../../state/tonconnect";
import { ConnectedAppConnection } from '../../tonconnect/types';

export function useSetAppsConnectionsState() {
    return useRecoilCallback(({ set }) => (updater: (prev: { [key: string]: ConnectedAppConnection[] }) => { [key: string]: ConnectedAppConnection[] }) => {
        set(connectionsSelector, updater);
    }, []);
}