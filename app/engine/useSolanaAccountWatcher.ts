import { useEffect } from "react";
import { wsEndpoint } from "./hooks/solana/useSolanaClient";
import { PublicKey } from "@solana/web3.js";
import { useAppVisible, useNetwork, useSolanaSelectedAccount } from "./hooks";
import { SolanaAccountWatcher } from "./SolanaAccountWatcher";
import { queryClient } from "./clients";

export function useSolanaAccountWatcher() {
    const account = useSolanaSelectedAccount();
    const { isTestnet } = useNetwork();
    const appStateVisible = useAppVisible();

    useEffect(() => {
        if (!account) {
            return;
        }

        const isActive = appStateVisible === 'active';
        const address = new PublicKey(account);

        let watcher: SolanaAccountWatcher | undefined;

        if (isActive) {
            const endpoint = wsEndpoint(isTestnet);
            watcher = new SolanaAccountWatcher(endpoint, address.toString());

            watcher.on('message', (data) => {
                if (data.method !== 'accountNotification') {
                    return;
                }

                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const queryKey = query.queryKey as string[];
                        return queryKey[0] === 'solana' && queryKey[1] === address.toString();
                    },
                });
                console.log('message', JSON.stringify(data));
            });
        }

        return () => {
            watcher?.stop();
        };
    }, [account, isTestnet, appStateVisible]);
}