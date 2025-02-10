import { Address } from "@ton/core";
import { AccountKeyParam } from "../../engine/api/holders/fetchUserToken";
import { TonProofItemReplySuccess } from "@tonconnect/protocol";

export function authParamsFromLedgerProof(
    address: Address,
    proof: TonProofItemReplySuccess,
    publicKey: string,
    domain: {
        lengthBytes: number;
        value: string;
    },
    walletStateInit: string | null | undefined
): AccountKeyParam {
    return {
        kind: 'tonconnect-v2',
        wallet: 'tonhub',
        config: {
            address: address.toRawString(),
            proof: {
                timestamp: proof!.proof.timestamp,
                domain,
                signature: proof!.proof.signature,
                payload: proof!.proof.payload,
                publicKey,
                walletStateInit
            }
        }
    }
}