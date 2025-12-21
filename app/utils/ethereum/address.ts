import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { hmac } from '@noble/hashes/hmac';
import { sha512 } from '@noble/hashes/sha512';
import { mnemonicToSeed } from '@ton/crypto';
import { Buffer } from 'buffer';

// BIP32 Master key generation for secp256k1
const HARDENED_OFFSET = 0x80000000;
const BITCOIN_SEED = 'Bitcoin seed';

interface HDKeyState {
    key: Uint8Array;
    chainCode: Uint8Array;
}

function getMasterKeyFromSeed(seed: Buffer): HDKeyState {
    const I = hmac(sha512, BITCOIN_SEED, seed);
    return {
        key: I.slice(0, 32),
        chainCode: I.slice(32),
    };
}

function deriveHardenedKey(parent: HDKeyState, index: number): HDKeyState {
    const indexBuffer = new Uint8Array(4);
    const view = new DataView(indexBuffer.buffer);
    view.setUint32(0, index + HARDENED_OFFSET, false);
    
    const data = new Uint8Array(1 + 32 + 4);
    data[0] = 0x00;
    data.set(parent.key, 1);
    data.set(indexBuffer, 33);
    
    const I = hmac(sha512, parent.chainCode, data);
    return {
        key: I.slice(0, 32),
        chainCode: I.slice(32),
    };
}

function deriveNonHardenedKey(parent: HDKeyState, index: number): HDKeyState {
    const indexBuffer = new Uint8Array(4);
    const view = new DataView(indexBuffer.buffer);
    view.setUint32(0, index, false);
    
    const publicKey = secp256k1.getPublicKey(parent.key, true);
    
    const data = new Uint8Array(33 + 4);
    data.set(publicKey, 0);
    data.set(indexBuffer, 33);
    
    const I = hmac(sha512, parent.chainCode, data);
    const IL = I.slice(0, 32);
    
    // Add parent key and IL mod n
    const parentKeyBigInt = BigInt('0x' + Buffer.from(parent.key).toString('hex'));
    const ILBigInt = BigInt('0x' + Buffer.from(IL).toString('hex'));
    const n = secp256k1.CURVE.n;
    const newKey = (parentKeyBigInt + ILBigInt) % n;
    
    const newKeyHex = newKey.toString(16).padStart(64, '0');
    return {
        key: new Uint8Array(Buffer.from(newKeyHex, 'hex')),
        chainCode: I.slice(32),
    };
}

/**
 * Derive key at BIP32 path
 * Path components with ' suffix are hardened
 * Example: m/44'/60'/0'/0/0
 */
function derivePathSecp256k1(seed: Buffer, path: string): Uint8Array {
    const parts = path.split('/').slice(1); // Remove 'm'
    let state = getMasterKeyFromSeed(seed);
    
    for (const part of parts) {
        const isHardened = part.endsWith("'");
        const index = parseInt(isHardened ? part.slice(0, -1) : part, 10);
        
        if (isHardened) {
            state = deriveHardenedKey(state, index);
        } else {
            state = deriveNonHardenedKey(state, index);
        }
    }
    
    return state.key;
}

/**
 * Get Ethereum address from public key (uncompressed, without 0x04 prefix)
 */
export function ethereumAddressFromPublicKey(publicKey: Uint8Array): string {
    // Take last 20 bytes of keccak256 hash
    const hash = keccak_256(publicKey);
    const address = hash.slice(-20);
    return '0x' + Buffer.from(address).toString('hex');
}

/**
 * Get Ethereum address from private key
 */
export function ethereumAddressFromPrivateKey(privateKey: Uint8Array): string {
    // Get uncompressed public key (without 0x04 prefix)
    const publicKeyCompressed = secp256k1.getPublicKey(privateKey, false);
    // Remove the 0x04 prefix for uncompressed key
    const publicKeyUncompressed = publicKeyCompressed.slice(1);
    return ethereumAddressFromPublicKey(publicKeyUncompressed);
}

/**
 * Standard Ethereum BIP44 derivation path: m/44'/60'/0'/0/0
 */
const ETHEREUM_DERIVATION_PATH = "m/44'/60'/0'/0/0";

/**
 * Derive Ethereum private key from TON mnemonic using BIP32/BIP44 standard
 */
export async function ethereumPrivateKeyFromMnemonic(mnemonics: string[]): Promise<Uint8Array> {
    // For Ethereum we need standard BIP39 seed derivation
    // TON uses its own seed derivation, so we need to use mnemonicToSeed with empty password
    const seed = await mnemonicToSeed(mnemonics, '');
    return derivePathSecp256k1(seed, ETHEREUM_DERIVATION_PATH);
}

/**
 * Get Ethereum address from TON mnemonic
 */
export async function ethereumAddressFromMnemonic(mnemonics: string[]): Promise<string> {
    const privateKey = await ethereumPrivateKeyFromMnemonic(mnemonics);
    return ethereumAddressFromPrivateKey(privateKey);
}

/**
 * Get Ethereum keypair from mnemonic
 */
export async function ethereumKeypairFromMnemonic(mnemonics: string[]): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
    address: string;
}> {
    const privateKey = await ethereumPrivateKeyFromMnemonic(mnemonics);
    const publicKeyCompressed = secp256k1.getPublicKey(privateKey, false);
    const publicKeyUncompressed = publicKeyCompressed.slice(1);
    const address = ethereumAddressFromPublicKey(publicKeyUncompressed);
    
    return {
        privateKey,
        publicKey: publicKeyUncompressed,
        address,
    };
}

/**
 * Create Ethereum proof signature (similar to EIP-4361 SIWE style)
 */
export function createEthereumProofSignature(
    privateKey: Uint8Array,
    message: Uint8Array
): Uint8Array {
    const messageHash = keccak_256(message);
    const signature = secp256k1.sign(messageHash, privateKey);
    // Return r, s, v format (65 bytes)
    const sig = signature.toCompactRawBytes();
    const recovery = signature.recovery ?? 0;
    const result = new Uint8Array(65);
    result.set(sig, 0);
    result[64] = recovery + 27; // v value
    return result;
}

