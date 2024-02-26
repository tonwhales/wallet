import { useRecoilCallback } from "recoil";
import { ConnectedAppConnection } from '../../tonconnect/types';
import { connectionsMapAtom } from "../../state/tonconnect";

export function useSetAppsConnectionsState() {
    const callback = useRecoilCallback(({ set }) => (
        udater: (doc: { [key: string]: ConnectedAppConnection[] }) => { [x: string]: ConnectedAppConnection[] },
        address: string
    ) => {
        set(connectionsMapAtom, (state) => {
            const newState = { ...state };
            newState[address] = udater(newState[address] || []);
            return newState;
        });
    });

    return (
        address: string,
        updater: (doc: { [key: string]: ConnectedAppConnection[] }) => { [x: string]: ConnectedAppConnection[] },
    ) => {
        callback(updater, address);
    };
}