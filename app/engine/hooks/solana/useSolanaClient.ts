import { useMemo } from "react";
import { useNetwork } from "..";
import { keys } from "../../../analytics/mixpanel";
import { Connection } from "@solana/web3.js";
const alchemyApiKey = keys.ALCHEMY_API_KEY;

export type SolanaClient = Connection;

export const SOLANA_RPC_ENDPOINT = `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
export const SOLANA_DEVNET_RPC_ENDPOINT = `https://solana-devnet.g.alchemy.com/v2/${alchemyApiKey}`;
export const rpcEndpoint = (isTestnet: boolean) => isTestnet ? SOLANA_DEVNET_RPC_ENDPOINT : SOLANA_RPC_ENDPOINT;

export function useSolanaClient(): SolanaClient {
    const { isTestnet } = useNetwork();

    const client = useMemo(() => {
        return new Connection(rpcEndpoint(isTestnet));
    }, [isTestnet]);

    return client;
}