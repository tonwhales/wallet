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

export const SOLANA_PUBLIC_RPC_ENDPOINT = `https://api.mainnet-beta.solana.com`;
export const SOLANA_PUBLIC_DEVNET_RPC_ENDPOINT = `https://api.devnet.solana.com`;

export const rpcEndpoint = (isTestnet: boolean) => isTestnet ? SOLANA_DEVNET_RPC_ENDPOINT : SOLANA_RPC_ENDPOINT;
export const publicRpcEndpoint = (isTestnet: boolean) => isTestnet ? SOLANA_PUBLIC_DEVNET_RPC_ENDPOINT : SOLANA_PUBLIC_RPC_ENDPOINT;
export const wsEndpoint = (isTestnet: boolean) => isTestnet ? SOLANA_DEVNET_WS_ENDPOINT : SOLANA_WS_ENDPOINT;

export function useSolanaClients(): {
    client: SolanaClient;
    publicClient: SolanaClient;
} {
    const { isTestnet } = useNetwork();

    const client = useMemo(() => {
        return new Connection(rpcEndpoint(isTestnet));
    }, [isTestnet]);

    const publicClient = useMemo(() => {
        return new Connection(publicRpcEndpoint(isTestnet));
    }, [isTestnet]);

    return { client, publicClient };
}