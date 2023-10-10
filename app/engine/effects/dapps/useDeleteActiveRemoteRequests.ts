import { useConnectPendingRequests } from "../../hooks/dapps/useConnectPendingRequests";

export function useDeleteActiveRemoteRequests() {
    const [requests, update] = useConnectPendingRequests();

    return (clientSessionId: string) => {
        const temp = [...requests];

        const index = temp.findIndex((item) => item.from === clientSessionId);
        if (index !== -1) {
            temp.splice(index, 1);
        }
        update(temp);
        return;
    };
}