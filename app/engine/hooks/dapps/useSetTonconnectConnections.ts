import { useRecoilCallback } from "recoil";
import { ConnectedAppConnection } from '../../tonconnect/types';
import { connectionsFamily } from "../../state/tonconnect";

export function useSetAppsConnectionsState() {
    const callback = useRecoilCallback(({ set }) => (
        udater: (doc: { [key: string]: ConnectedAppConnection[] }) => { [x: string]: ConnectedAppConnection[] },
        address: string
    ) => {
        set(connectionsFamily(address), udater);
    });

    return (
        address: string,
        updater: (doc: { [key: string]: ConnectedAppConnection[] }) => { [x: string]: ConnectedAppConnection[] },
    ) => {
        callback(updater, address);
    };
}