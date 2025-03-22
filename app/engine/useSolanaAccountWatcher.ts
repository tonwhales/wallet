import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAppVisible, useNetwork, useSolanaSelectedAccount } from "./hooks";
import { queryClient, whalesConnectEndpoint } from "./clients";
import { createLogger, warn } from "../utils/log";
import EventSource, { MessageEvent } from 'react-native-sse';
import { Queries } from "./queries";

const logger = createLogger('solana-account-watcher');

export function useSolanaAccountWatcher() {
    const [session, setSession] = useState(0);
    const account = useSolanaSelectedAccount();
    const { isTestnet } = useNetwork();
    const appStateVisible = useAppVisible();

    const sessionTimeout = useRef<NodeJS.Timeout | null>(null);

    const isInactive = appStateVisible !== 'active' && appStateVisible !== 'inactive';
    useEffect(() => {
        if (!account || isInactive) {
            return;
        }

        const address = new PublicKey(account);

        const network = isTestnet ? 'devnet' : 'mainnet';
        const url = `${whalesConnectEndpoint}/solana/account/${address}/${network}`;

        let watcher: EventSource | null = new EventSource(url);
        watcher.addEventListener('message', (event) => {
            logger.log('sse new event: ' + (event as MessageEvent).type);
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const base = Queries.SolanaAccount(address.toString(), network).All();
                    if (
                        query.queryKey.length === base.length && query.queryKey.every((value, index) => value === base[index])
                        && query.queryKey[3] !== 'transactions'
                    ) {
                        return true;
                    }
                    return false;
                }
            });

            queryClient.invalidateQueries({
                predicate: (query) => {
                    const base = Queries.SolanaAccount(address.toString(), network).All();
                    if (
                        query.queryKey.length === base.length && query.queryKey.every((value, index) => value === base[index])
                        && query.queryKey[3] === 'transactions'
                    ) {
                        return true;
                    }
                    return false;
                },
                refetchPage: (last, index, allPages) => index == 0,
            });
        });

        watcher.addEventListener('open', () => {
            logger.log('sse connect: opened');
        });

        watcher.addEventListener('close', () => {
            logger.log('sse connect: closed');
        });

        watcher.addEventListener('error', (event) => {
            warn('sse connect: error' + JSON.stringify(event));
            // set new session to force close connection & reconnect on error
            if (session < 1000) { // limit to 1000 reconnects (to avoid infinite loop)
                if (sessionTimeout.current) {
                    return;
                }
                sessionTimeout.current = setTimeout(() => {
                    setSession(session + 1);
                }, 5000);
            }
        });

        return () => {
            if (sessionTimeout.current) {
                clearTimeout(sessionTimeout.current);
                sessionTimeout.current = null;
            }

            if (watcher) {
                watcher.removeAllEventListeners();
                watcher.close();
                watcher = null;

                logger.log('sse close');
            }
        };
    }, [account, isTestnet, isInactive, session]);
}