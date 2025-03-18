import { useMemo } from "react";
import { useNetwork } from "..";
import { keys } from "../../../analytics/mixpanel";
import { Connection } from "@solana/web3.js";

const heliusApiKey = keys.HELIUS_API_KEY;
export type SolanaClient = Connection;

export const SOLANA_RPC_ENDPOINT = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
export const SOLANA_DEVNET_RPC_ENDPOINT = `https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;

export const SOLANA_WS_ENDPOINT = `wss://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
export const SOLANA_DEVNET_WS_ENDPOINT = `wss://devnet.helius-rpc.com/?api-key=${heliusApiKey}`;

export const rpcEndpoint = (isTestnet: boolean) => isTestnet ? SOLANA_DEVNET_RPC_ENDPOINT : SOLANA_RPC_ENDPOINT;
export const wsEndpoint = (isTestnet: boolean) => isTestnet ? SOLANA_DEVNET_WS_ENDPOINT : SOLANA_WS_ENDPOINT;

export function useSolanaClient(): SolanaClient {
    const { isTestnet } = useNetwork();

    const client = useMemo(() => {
        return new Connection(rpcEndpoint(isTestnet));
    }, [isTestnet]);

    return client;
}