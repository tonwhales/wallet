import { useConnectPendingRequests } from "../../hooks/dapps/useConnectPendingRequests";

export function useDeleteActiveRemoteRequests() {
    const [, update] = useConnectPendingRequests();

    return (clientSessionId: string) => {
        update((prev) => {
            return prev.filter((item) => item.from !== clientSessionId);
        });
    };
}