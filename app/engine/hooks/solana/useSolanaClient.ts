import { useMemo } from "react";
import { useNetwork } from "..";
import { createSolanaRpc } from "@solana/kit";
import { keys } from "../../../analytics/mixpanel";

const alchemyApiKey = keys.ALCHEMY_API_KEY;

export function useSolanaClient() {
    const { isTestnet } = useNetwork();

    const client = useMemo(() => {
        return isTestnet 
            ? createSolanaRpc(`https://solana-devnet.g.alchemy.com/v2/${alchemyApiKey}`)
            : createSolanaRpc(`https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`);
    }, [isTestnet]);

    return client;
}