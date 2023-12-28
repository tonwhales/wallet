import { mnemonicToSeed } from '@ton/crypto';

function normalizeMnemonic(src: string[]) {
    return src.map((v) => v.toLowerCase().trim());
}

export async function deriveUtilityKey(mnemonics: string[]) {
    return await mnemonicToSeed(normalizeMnemonic(mnemonics), 'TON Utility Key');
}