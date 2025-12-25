import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';
import { Buffer } from 'buffer';
import axios from 'axios';

// RPC endpoints
const ETH_RPC_MAINNET = 'https://eth.llamarpc.com';
const ETH_RPC_SEPOLIA = 'https://ethereum-sepolia-rpc.publicnode.com';

function getEthRpcUrl(isTestnet: boolean): string {
    return isTestnet ? ETH_RPC_SEPOLIA : ETH_RPC_MAINNET;
}

async function ethRpcCall(method: string, params: any[], isTestnet: boolean): Promise<any> {
    const url = getEthRpcUrl(isTestnet);
    const response = await axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method,
        params
    });

    if (response.data.error) {
        throw new Error(response.data.error.message);
    }

    return response.data.result;
}

/**
 * Get ETH balance for address
 */
export async function getEthBalance(address: string, isTestnet: boolean): Promise<bigint> {
    const result = await ethRpcCall('eth_getBalance', [address, 'latest'], isTestnet);
    return BigInt(result);
}

/**
 * Format balance from wei to ETH string
 */
export function formatEthBalance(weiBalance: bigint): string {
    const eth = Number(weiBalance) / 1e18;
    return eth.toFixed(6);
}

/**
 * Get transaction count (nonce) for address
 */
export async function getTransactionCount(address: string, isTestnet: boolean): Promise<number> {
    const result = await ethRpcCall('eth_getTransactionCount', [address, 'latest'], isTestnet);
    return parseInt(result, 16);
}

/**
 * Get current gas price
 */
export async function getGasPrice(isTestnet: boolean): Promise<bigint> {
    const result = await ethRpcCall('eth_gasPrice', [], isTestnet);
    return BigInt(result);
}

/**
 * Get chain ID
 */
export async function getChainId(isTestnet: boolean): Promise<number> {
    const result = await ethRpcCall('eth_chainId', [], isTestnet);
    return parseInt(result, 16);
}

/**
 * RLP encode a single item
 */
function rlpEncodeItem(item: Uint8Array | number | bigint | string): Uint8Array {
    let data: Uint8Array;

    if (typeof item === 'number' || typeof item === 'bigint') {
        if (item === 0 || item === 0n) {
            data = new Uint8Array(0);
        } else {
            let hex = item.toString(16);
            if (hex.length % 2 !== 0) hex = '0' + hex;
            data = new Uint8Array(Buffer.from(hex, 'hex'));
        }
    } else if (typeof item === 'string') {
        if (item.startsWith('0x')) {
            const hex = item.slice(2);
            data = new Uint8Array(Buffer.from(hex.length % 2 ? '0' + hex : hex, 'hex'));
        } else {
            data = new Uint8Array(Buffer.from(item, 'utf8'));
        }
    } else {
        data = item;
    }

    // Remove leading zeros for numbers
    while (data.length > 0 && data[0] === 0) {
        data = data.slice(1);
    }

    if (data.length === 0) {
        return new Uint8Array([0x80]);
    }

    if (data.length === 1 && data[0] < 0x80) {
        return data;
    }

    if (data.length <= 55) {
        const result = new Uint8Array(1 + data.length);
        result[0] = 0x80 + data.length;
        result.set(data, 1);
        return result;
    }

    let lenBytes = [];
    let len = data.length;
    while (len > 0) {
        lenBytes.unshift(len & 0xff);
        len = len >> 8;
    }

    const result = new Uint8Array(1 + lenBytes.length + data.length);
    result[0] = 0xb7 + lenBytes.length;
    result.set(lenBytes, 1);
    result.set(data, 1 + lenBytes.length);
    return result;
}

/**
 * RLP encode a list
 */
function rlpEncodeList(items: Uint8Array[]): Uint8Array {
    const encoded = items.reduce((acc, item) => {
        const combined = new Uint8Array(acc.length + item.length);
        combined.set(acc, 0);
        combined.set(item, acc.length);
        return combined;
    }, new Uint8Array(0));

    if (encoded.length <= 55) {
        const result = new Uint8Array(1 + encoded.length);
        result[0] = 0xc0 + encoded.length;
        result.set(encoded, 1);
        return result;
    }

    let lenBytes = [];
    let len = encoded.length;
    while (len > 0) {
        lenBytes.unshift(len & 0xff);
        len = len >> 8;
    }

    const result = new Uint8Array(1 + lenBytes.length + encoded.length);
    result[0] = 0xf7 + lenBytes.length;
    result.set(lenBytes, 1);
    result.set(encoded, 1 + lenBytes.length);
    return result;
}

export interface EthTransaction {
    nonce: number;
    gasPrice: bigint;
    gasLimit: bigint;
    to: string;
    value: bigint;
    data: string;
    chainId: number;
}

/**
 * Sign an Ethereum transaction (EIP-155)
 */
export function signTransaction(tx: EthTransaction, privateKey: Uint8Array): string {
    // Encode transaction for signing (with chainId for EIP-155)
    const txForSigning = rlpEncodeList([
        rlpEncodeItem(tx.nonce),
        rlpEncodeItem(tx.gasPrice),
        rlpEncodeItem(tx.gasLimit),
        rlpEncodeItem(tx.to),
        rlpEncodeItem(tx.value),
        rlpEncodeItem(tx.data || '0x'),
        rlpEncodeItem(tx.chainId),
        rlpEncodeItem(0),
        rlpEncodeItem(0),
    ]);

    // Hash and sign
    const txHash = keccak_256(txForSigning);
    const signature = secp256k1.sign(txHash, privateKey);

    // Calculate v (EIP-155)
    const v = BigInt(tx.chainId * 2 + 35 + (signature.recovery ?? 0));
    const r = signature.r;
    const s = signature.s;

    // Encode signed transaction
    const signedTx = rlpEncodeList([
        rlpEncodeItem(tx.nonce),
        rlpEncodeItem(tx.gasPrice),
        rlpEncodeItem(tx.gasLimit),
        rlpEncodeItem(tx.to),
        rlpEncodeItem(tx.value),
        rlpEncodeItem(tx.data || '0x'),
        rlpEncodeItem(v),
        rlpEncodeItem(r),
        rlpEncodeItem(s),
    ]);

    return '0x' + Buffer.from(signedTx).toString('hex');
}

/**
 * Send raw transaction
 */
export async function sendRawTransaction(signedTx: string, isTestnet: boolean): Promise<string> {
    return await ethRpcCall('eth_sendRawTransaction', [signedTx], isTestnet);
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash: string, isTestnet: boolean): Promise<any> {
    return await ethRpcCall('eth_getTransactionReceipt', [txHash], isTestnet);
}

/**
 * Wait for transaction to be mined
 */
export async function waitForTransaction(txHash: string, isTestnet: boolean, timeoutMs: number = 60000): Promise<any> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const receipt = await getTransactionReceipt(txHash, isTestnet);
        if (receipt) {
            return receipt;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transaction timeout');
}

/**
 * Create and sign a self-transfer transaction
 */
export async function createSelfTransferTransaction(
    address: string,
    privateKey: Uint8Array,
    isTestnet: boolean
): Promise<{ signedTx: string; tx: EthTransaction }> {
    const [nonce, gasPrice, chainId] = await Promise.all([
        getTransactionCount(address, isTestnet),
        getGasPrice(isTestnet),
        getChainId(isTestnet)
    ]);

    // Send minimal amount (1 wei) to self
    const tx: EthTransaction = {
        nonce,
        gasPrice,
        gasLimit: 21000n, // Standard ETH transfer
        to: address,
        value: 1n, // 1 wei
        data: '0x',
        chainId
    };

    const signedTx = signTransaction(tx, privateKey);

    return { signedTx, tx };
}

/**
 * Parse ETH amount string to wei
 */
export function parseEthToWei(ethAmount: string): bigint {
    const parts = ethAmount.split('.');
    const whole = parts[0] || '0';
    let fraction = parts[1] || '';

    // Pad or trim fraction to 18 decimals
    fraction = fraction.padEnd(18, '0').slice(0, 18);

    const weiString = whole + fraction;
    return BigInt(weiString);
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Create and sign an ETH transfer transaction
 */
export async function createEthTransferTransaction(
    fromAddress: string,
    toAddress: string,
    valueWei: bigint,
    privateKey: Uint8Array,
    isTestnet: boolean
): Promise<{ signedTx: string; tx: EthTransaction }> {
    const [nonce, gasPrice, chainId] = await Promise.all([
        getTransactionCount(fromAddress, isTestnet),
        getGasPrice(isTestnet),
        getChainId(isTestnet)
    ]);

    const tx: EthTransaction = {
        nonce,
        gasPrice,
        gasLimit: 21000n, // Standard ETH transfer
        to: toAddress,
        value: valueWei,
        data: '0x',
        chainId
    };

    const signedTx = signTransaction(tx, privateKey);

    return { signedTx, tx };
}

/**
 * Estimate transaction fee in ETH
 */
export async function estimateTransactionFee(isTestnet: boolean): Promise<string> {
    const gasPrice = await getGasPrice(isTestnet);
    const gasLimit = 21000n;
    const feeWei = gasPrice * gasLimit;
    return formatEthBalance(feeWei);
}

