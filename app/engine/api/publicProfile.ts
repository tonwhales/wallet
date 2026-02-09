import axios from 'axios';
import { Address, beginCell, safeSign } from '@ton/core';
import { deriveSymmetricPath, keyPairFromSeed, sha256_sync, KeyPair } from '@ton/crypto';
import { z } from 'zod';
import { whalesConnectEndpoint } from '../clients';
import nacl from 'tweetnacl';

// Types
export interface PublicProfileValues {
    avatar: number;           // Avatar hash (0-29)
    backgroundColor: string;  // Hex color from avatarColors
}

export interface PublicProfileAddress {
    chain: 'ton' | 'solana';
    address: string;
    network: string;
    addedAt: number;
}

export interface PublicProfile {
    addresses: PublicProfileAddress[];
    values: PublicProfileValues;
    seq: number;
}

export interface AddressProof {
    chain: 'ton' | 'solana';
    address: string;
    network: string;
    signature: string;
    timestamp: number;
    publicKey?: string;  // Required for TON addresses (allows verification without RPC)
}

// Response codecs
const publicProfileAddressCodec = z.object({
    chain: z.enum(['ton', 'solana']),
    address: z.string(),
    network: z.string(),
    addedAt: z.number()
});

const publicProfileValuesCodec = z.object({
    avatar: z.number(),
    backgroundColor: z.string()
}).passthrough();

const readPublicProfileResponseCodec = z.object({
    ok: z.boolean(),
    profile: z.object({
        addresses: z.array(publicProfileAddressCodec),
        values: publicProfileValuesCodec,
        seq: z.number()
    }).optional()
});

const writePublicProfileResponseCodec = z.object({
    updated: z.boolean(),
    current: z.object({
        seq: z.number(),
        addresses: z.array(publicProfileAddressCodec).optional(),
        values: publicProfileValuesCodec.optional()
    }).optional()
});

/**
 * Derive profile signing keys from utility key
 */
export async function deriveProfileKeys(utilityKey: Buffer, isTestnet: boolean): Promise<KeyPair> {
    const signKey = await deriveSymmetricPath(utilityKey, [
        isTestnet ? 'sandbox' : 'mainnet',
        'public-profile',
        'sign'
    ]);
    return keyPairFromSeed(signKey);
}

/**
 * Create an address ownership proof for TON
 * Signs: sha256("PUBLIC_PROFILE_CLAIM|{utilityKeyPubkeyBase64}|{address}|{timestamp}")
 */
export function createTonAddressProof(
    utilityKeyPubkey: string,  // base64
    tonAddress: string,
    walletSecretKey: Buffer,   // 64 bytes (secretKey from keypair)
    timestamp: number
): string {
    const message = `PUBLIC_PROFILE_CLAIM|${utilityKeyPubkey}|${tonAddress}|${timestamp}`;
    const messageHash = sha256_sync(Buffer.from(message, 'utf-8'));
    const signature = nacl.sign.detached(
        new Uint8Array(messageHash),
        new Uint8Array(walletSecretKey)
    );
    return Buffer.from(signature).toString('base64');
}

/**
 * Create an address ownership proof for Solana
 * Signs raw message bytes (no hash): "PUBLIC_PROFILE_CLAIM|{utilityKeyPubkeyBase64}|{address}|{timestamp}"
 */
export function createSolanaAddressProof(
    utilityKeyPubkey: string,  // base64
    solanaAddress: string,
    walletSecretKey: Buffer,   // 64 bytes (secretKey from keypair)
    timestamp: number
): string {
    const message = `PUBLIC_PROFILE_CLAIM|${utilityKeyPubkey}|${solanaAddress}|${timestamp}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(
        messageBytes,
        new Uint8Array(walletSecretKey)
    );
    return Buffer.from(signature).toString('base64');
}

/**
 * Sign the profile write request
 */
export function signProfileWriteRequest(
    profileKeys: KeyPair,
    seq: number,
    time: number,
    addresses: AddressProof[],
    values: PublicProfileValues
): string {
    const payload = JSON.stringify({ addresses, values });
    const payloadHash = sha256_sync(Buffer.from(payload, 'utf-8'));

    const toSign = beginCell()
        .storeBuffer(profileKeys.publicKey)
        .storeBuffer(payloadHash)
        .storeUint(seq, 32)
        .storeUint(time, 32)
        .endCell();

    const signature = safeSign(toSign, profileKeys.secretKey);
    return signature.toString('base64');
}

/**
 * Read a public profile by any blockchain address (public, no auth required)
 */
export async function readPublicProfile(address: string): Promise<PublicProfile | null> {
    try {
        // check if address is a TON address then parse it to bounceable: false
        let parsedAddress = address;

        const isTonAddress = Address.isAddress(address);

        if (isTonAddress) {
            parsedAddress = Address.parse(address).toString({ bounceable: false });
        }
        const response = await axios.post(
            `${whalesConnectEndpoint}/public-profile/read`,
            { address: parsedAddress },
            { timeout: 10000 }
        );

        const parsed = readPublicProfileResponseCodec.safeParse(response.data);
        if (!parsed.success || !parsed.data.ok || !parsed.data.profile) {
            return null;
        }

        return {
            addresses: parsed.data.profile.addresses,
            values: parsed.data.profile.values as PublicProfileValues,
            seq: parsed.data.profile.seq
        };
    } catch {
        return null;
    }
}

/**
 * Read profile by profile key (to get current seq for writes)
 */
export async function readPublicProfileByKey(profileKeyBase64: string): Promise<{ seq: number } | null> {
    try {
        const response = await axios.get(
            `${whalesConnectEndpoint}/public-profile/by-key/${encodeURIComponent(profileKeyBase64)}`,
            { timeout: 10000 }
        );

        console.log('readPublicProfileByKey response', JSON.stringify(response.data, null, 2));

        if (response.data?.ok && response.data?.profile) {
            return { seq: response.data.profile.seq };
        }
        return { seq: 0 };
    } catch {
        return { seq: 0 };
    }
}

export interface WritePublicProfileParams {
    utilityKey: Buffer;
    isTestnet: boolean;
    tonAddress: string;
    solanaAddress: string;
    walletPublicKey: Buffer;  // 32 bytes - required for TON address verification
    walletSecretKey: Buffer;  // 64 bytes
    values: PublicProfileValues;
}

/**
 * Write a public profile with both TON and Solana address proofs
 */
export async function writePublicProfile(params: WritePublicProfileParams): Promise<{
    updated: boolean;
    seq: number;
}> {
    const { utilityKey, isTestnet, tonAddress, solanaAddress, walletPublicKey, walletSecretKey, values } = params;

    // 1. Derive profile signing keys
    const profileKeys = await deriveProfileKeys(utilityKey, isTestnet);
    const keyBase64 = profileKeys.publicKey.toString('base64');

    // 2. Read current profile to get seq
    const currentProfile = await readPublicProfileByKey(keyBase64);
    const seq = currentProfile?.seq ?? 0;

    // 3. Create address proofs
    const timestamp = Math.floor(Date.now() / 1000);

    const tonProof: AddressProof = {
        chain: 'ton',
        address: tonAddress,
        network: isTestnet ? 'testnet' : 'mainnet',
        signature: createTonAddressProof(keyBase64, tonAddress, walletSecretKey, timestamp),
        timestamp,
        publicKey: walletPublicKey.toString('base64')  // Required for TON to verify without RPC
    };

    const solanaProof: AddressProof = {
        chain: 'solana',
        address: solanaAddress,
        network: isTestnet ? 'devnet' : 'mainnet',
        signature: createSolanaAddressProof(keyBase64, solanaAddress, walletSecretKey, timestamp),
        timestamp
    };

    const addressProofs = [tonProof, solanaProof];

    // 4. Sign the request
    const time = Math.floor(Date.now() / 1000) + 60;  // Valid for 60 seconds
    const requestSignature = signProfileWriteRequest(
        profileKeys,
        seq,
        time,
        addressProofs,
        values
    );

    // 5. Send request
    try {
        const response = await axios.post(
            `${whalesConnectEndpoint}/public-profile/write`,
            {
                key: keyBase64,
                signature: requestSignature,
                time,
                seq,
                addresses: addressProofs,
                values
            },
            { timeout: 10000 }
        );

        const parsed = writePublicProfileResponseCodec.safeParse(response.data);

        if (!parsed.success) {
            console.log('Invalid response from server', JSON.stringify(response.data, null, 2));
            throw new Error('Invalid response from server');
        }

        return {
            updated: parsed.data.updated,
            seq: parsed.data.current?.seq ?? seq + 1
        };
    } catch (error) {
        console.log('Error writing public profile', JSON.stringify(error, null, 2));
        throw error;
    }
}

/**
 * Write public profile with retry on optimistic concurrency conflict
 */
export async function writePublicProfileWithRetry(
    params: WritePublicProfileParams,
    maxRetries: number = 3
): Promise<{ updated: boolean; seq: number }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const result = await writePublicProfile(params);
        if (result.updated) {
            return result;
        }
        // If not updated, the seq was stale - writePublicProfile will fetch fresh seq on next attempt
    }
    throw new Error('Max retries exceeded for public profile write');
}

