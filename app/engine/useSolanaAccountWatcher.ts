import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useAppVisible, useNetwork, useSolanaSelectedAccount } from "./hooks";
import { queryClient, whalesConnectEndpoint } from "./clients";
import { createLogger, warn } from "../utils/log";
import { Queries } from "./queries";
import { SOLANA_USDC_MINT_MAINNET } from "../utils/solana/address";
import { SOLANA_USDC_MINT_DEVNET } from "../utils/solana/address";

const logger = createLogger('solana-account-watcher');

export function invalidateSolanaAccount(address: string, network: 'devnet' | 'mainnet') {
    // invalidate all queries that are not transactions
    queryClient.invalidateQueries(Queries.SolanaAccount(address.toString(), network).All());

    // invalidate transactions query
    queryClient.invalidateQueries({
        queryKey: Queries.SolanaAccount(address.toString(), network).Transactions(),
        refetchPage: (last, index, allPages) => index === 0
    });

    // invalidate all token transactions query
    const mint = network === 'mainnet' ? SOLANA_USDC_MINT_MAINNET : SOLANA_USDC_MINT_DEVNET;
    queryClient.invalidateQueries({
        queryKey: Queries.SolanaAccount(address.toString(), network).TokenTransactions(mint),
        refetchPage: (last, index, allPages) => index === 0
    });
}

export function useSolanaAccountWatcher() {
    const [session, setSession] = useState(0);
    const account = useSolanaSelectedAccount();
    const { isTestnet } = useNetwork();
    const appStateVisible = useAppVisible();

    const websocketRef = useRef<WebSocket | null>(null);
    const sessionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const invalidateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

                if (!slot) {
                    return;
                }

                logger.log(`[sol] account ${address.toString()} updated at slot ${slot}`);
                if (invalidateTimeout.current) {
                    clearTimeout(invalidateTimeout.current);
                    invalidateTimeout.current = null;
                }

                invalidateTimeout.current = setTimeout(() => {
                    invalidateSolanaAccount(address.toString(), network);
                }, 6000); // to account for transaction confirmation & indexer lag
            }
        };

        ws.onclose = () => {
            logger.log('WebSocket connection closed');
            if (session < 1000) {
                if (sessionTimeout.current) {
                    return;
                }
                sessionTimeout.current = setTimeout(() => {
                    setSession(session + 1);
                }, 5000);
            }
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