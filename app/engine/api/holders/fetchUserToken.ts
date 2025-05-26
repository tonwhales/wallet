import axios from 'axios';
import { holdersEndpoint } from './fetchUserState';
import { z } from 'zod';

const tonconnectV2Config = z.object({
    address: z.string(),
    proof: z.object({
        timestamp: z.number(),
        domain: z.object({
            lengthBytes: z.number(),
            value: z.string(),
        }),
        signature: z.string(),
        payload: z.string(),
        walletStateInit: z.string().optional().nullable(),
        publicKey: z.string().optional().nullable(),
    })
});

const tonXKey = z.object({
    kind: z.literal('ton-x'),
    session: z.string(),
    config: z.object({
        address: z.string(),
        endpoint: z.string(),
        walletType: z.string(),
        walletConfig: z.string(),
        walletSig: z.string(),
        appPublicKey: z.string()
    })
});

const tonXLiteKey = z.object({
    kind: z.literal('ton-x-lite'),
    config: z.object({
        address: z.string(),
        walletConfig: z.string(),
        walletType: z.string(),
        time: z.number(),
        signature: z.string(),
        subkey: z.object({
            domain: z.string(),
            publicKey: z.string(),
            time: z.number(),
            signature: z.string()
        })
    })
});

const tonconnectV2Key = z.object({
    kind: z.literal('tonconnect-v2'),
    wallet: z.union([z.literal('tonhub'), z.literal('tonkeeper')]),
    config: tonconnectV2Config,
});

const tonconnectV2SolanaConfig = z.object({
    address: z.string(),
    proof: z.object({
        timestamp: z.number(),
        domain: z.object({
            lengthBytes: z.number(),
            value: z.string(),
        }),
        signature: z.string(),
        payload: z.string(),
        publicKey: z.string(),
    }),
});

export const tonconnectV2TonConfig = z.object({
    address: z.string(),
    proof: z.object({
        timestamp: z.number(),
        domain: z.object({
            lengthBytes: z.number(),
            value: z.string(),
        }),
        signature: z.string(),
        payload: z.string(),
        walletStateInit: z.string().optional().nullable(),
        publicKey: z.string().optional().nullable(),
    }),
});

export type TonConnectV2TonConfig = z.infer<typeof tonconnectV2TonConfig>;
export type TonConnectV2SolanaConfig = z.infer<typeof tonconnectV2SolanaConfig>;

const tonAuthRequestCodec = z.object({
    inviteId: z.string().optional(),
    appsflyerId: z.string().optional(),
    stack: z.literal('ton'),
    network: z.union([z.literal('ton-mainnet'), z.literal('ton-testnet')]),
    key: z.object({
        kind: z.literal('tonconnect-v2'),
        wallet: z.literal('tonhub'),
        config: tonconnectV2TonConfig,
    }),
});

const solanaAuthRequestCodec = z.object({
    stack: z.literal('solana'),
    network: z.union([z.literal('solana-mainnet'), z.literal('solana-devnet')]),
    key: z.object({
        kind: z.literal('tonconnect-v2'),
        wallet: z.literal('tonhub'),
        config: tonconnectV2SolanaConfig,
    }),
});

export type TonAuthRequest = z.infer<typeof tonAuthRequestCodec>;
export type SolanaAuthRequest = z.infer<typeof solanaAuthRequestCodec>;

const tonSolanaAuthRequestCodec = z.tuple([
    tonAuthRequestCodec,
    solanaAuthRequestCodec,
]);

export type TonSolanaAuthRequest = z.infer<typeof tonSolanaAuthRequestCodec>;

const tonhubLedgerConfig = z.object({
    address: z.string(),
    proof: z.object({
        timestamp: z.number(),
        signature: z.string(),
        cell: z.string(),
        walletStateInit: z.string().nullish(),
        publicKey: z.string().nullish(),
    })
});

const tonhubLedgerKey = z.object({
    kind: z.literal('tonhub-ledger-v1'),
    wallet: z.literal('tonhub'),
    config: tonhubLedgerConfig,
});

const keys = z.union([tonXKey, tonXLiteKey, tonconnectV2Key, tonhubLedgerKey]);

export type AccountKeyParam = z.infer<typeof keys>;

export async function fetchUserToken(requestParams: TonSolanaAuthRequest | TonAuthRequest, isTestnet: boolean): Promise<string> {
    const endpoint = holdersEndpoint(isTestnet);

    const url = `https://${endpoint}/v2/user/wallet/connect`;

    const res = await axios.post(
        url,
        requestParams
    );

    if (!res.data.ok) {
        throw Error('Failed to fetch user token');
    }
    return res.data.token as string;
}