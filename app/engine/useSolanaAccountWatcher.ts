import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAppVisible, useNetwork, useSolanaSelectedAccount } from "./hooks";
import { queryClient, whalesConnectEndpoint } from "./clients";
import { createLogger, warn } from "../utils/log";
import { Queries } from "./queries";

const logger = createLogger('solana-account-watcher');

export function useSolanaAccountWatcher() {
    const [session, setSession] = useState(0);
    const account = useSolanaSelectedAccount();
    const { isTestnet } = useNetwork();
    const appStateVisible = useAppVisible();

    const websocketRef = useRef<WebSocket | null>(null);
    const sessionTimeout = useRef<NodeJS.Timeout | null>(null);

    const isInactive = appStateVisible !== 'active' && appStateVisible !== 'inactive';

    useEffect(() => {
        if (!account || isInactive) {
            return;
        }

        const address = new PublicKey(account);
        const network = isTestnet ? 'devnet' : 'mainnet';

        const wsEndpoint = whalesConnectEndpoint.replace('https://', 'wss://').replace('http://', 'ws://');
        const wsUrl = `${wsEndpoint}/solana/${network}/account/${address}/ws`;

        logger.log(`Opening WebSocket connection to: ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;

        ws.onopen = () => {
            logger.log('WebSocket connection opened');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // ignore heartbeat
            if (data.event === 'message') {
                const result = data.data.result;
                const slot = result.context.slot;
                // const lamports = result.value.lamports;
                // const owner = result.value.owner;
                // const executable = result.value.executable;
                // const rentEpoch = result.value.rentEpoch;

                if (!slot) {
                    return;
                }

                logger.log(`[sol] account ${address.toString()} updated at slot ${slot}`);

                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const base = Queries.SolanaAccount(address.toString(), network).All();
                        if (
                            query.queryKey.length === base.length &&
                            query.queryKey.every((value, index) => value === base[index]) &&
                            query.queryKey[3] !== 'transactions'
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
                            query.queryKey.length === base.length &&
                            query.queryKey.every((value, index) => value === base[index]) &&
                            query.queryKey[3] === 'transactions'
                        ) {
                            return true;
                        }
                        return false;
                    },
                    refetchPage: (last, index, allPages) => index === 0,
                });
            }
        };

        ws.onclose = () => {
            logger.log('WebSocket connection closed');
        };

        ws.onerror = (error) => {
            warn('WebSocket error: ' + JSON.stringify(error));

            if (session < 1000) {
                if (sessionTimeout.current) {
                    return;
                }
                sessionTimeout.current = setTimeout(() => {
                    setSession(session + 1);
                }, 5000);
            }
        };

        return () => {
            if (sessionTimeout.current) {
                clearTimeout(sessionTimeout.current);
                sessionTimeout.current = null;
            }

            if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
                websocketRef.current.close();
                websocketRef.current = null;
                logger.log('WebSocket connection closed on cleanup');
            }
        };
    }, [account, isTestnet, isInactive, session]);
}