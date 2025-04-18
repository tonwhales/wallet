import { PublicKey } from "@solana/web3.js";
import { SolanaClient } from "../../engine/hooks/solana/useSolanaClient";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";

type IsPublicKeyATAParams = {
    address: PublicKey,
    solanaClient: SolanaClient,
    mint: PublicKey
}

export async function isPublicKeyATA({ solanaClient, address, mint }: IsPublicKeyATAParams) {
    const accountInfo = await solanaClient.getAccountInfo(address);

    if (!accountInfo) {
        return false;
    }

    if (!accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
        return false;
    }

    if (accountInfo.data.length !== AccountLayout.span) {
        return false;
    }

    return true;
}