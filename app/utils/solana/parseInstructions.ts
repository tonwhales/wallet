import {
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { BorshCoder, Idl } from '@coral-xyz/anchor';
import { holdersIdl } from './idl/holders';

// Common Program IDs
const SYSTEM_PROGRAM_ID = SystemProgram.programId.toString();
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

export type SolanaInstructionAccounts = {
    name?: string;
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
}

export type HoldersLimitsInstruction = {
    program: 'Holders',
    programId: string,
    name: 'updateCardLimits',
    accounts: SolanaInstructionAccounts[] | undefined,
    args: {
        name: 'newOnetime' | 'newDaily' | 'newMonthly';
        data: string;
    }[],
    description: string;
}

export type HoldersDepositInstruction = {
    program: 'Holders',
    programId: string,
    name: 'depositCard',
    accounts: SolanaInstructionAccounts[],
    args: {
        name: 'amount';
        data: string;
    }[],
    description: string;
}

export type HoldersInstructionName = 'updateCardLimits' | 'depositCard';
export type InstructionName = HoldersInstructionName | 'systemTransfer' | 'createAccount' | 'tokenTransfer' | 'createAssociatedTokenAccount' | 'unknown';

/**
 * Parse a holders program instruction using the IDL
 */
export function parseHoldersInstruction(instruction: TransactionInstruction) {
    // Skip if instruction is not for holders program
    if (instruction.programId.toString() !== holdersIdl.address) {
        return null;
    }

    try {
        // Create a BorshCoder for the IDL
        const coder = new BorshCoder(holdersIdl as unknown as Idl);

        // Decode the instruction
        const decoded = coder.instruction.decode(instruction.data);

        if (!decoded) {
            return null;
        }

        // Format the instruction with account context
        const accountMetas = instruction.keys.map(meta => ({
            pubkey: meta.pubkey,
            isSigner: meta.isSigner,
            isWritable: meta.isWritable,
        }));

        const formatted = coder.instruction.format(decoded, accountMetas);

        return {
            program: 'Holders',
            programId: instruction.programId.toString(),
            name: decoded.name,
            accounts: formatted?.accounts,
            args: formatted?.args
        };
    } catch (error) {
        console.error('Error parsing holders instruction:', error);

        // Fall back to discriminator matching if borsh decoding fails
        return parseHoldersInstructionWithDiscriminator(instruction);
    }
}

/**
 * Fallback method using discriminator matching
 */
function parseHoldersInstructionWithDiscriminator(instruction: TransactionInstruction) {
    const discriminator = instruction.data.slice(0, 8);

    const idlInstruction = holdersIdl.instructions.find(
        instr => Buffer.from(instr.discriminator).equals(discriminator as unknown as Uint8Array<ArrayBufferLike>)
    );

    if (!idlInstruction) {
        return {
            program: 'Holders',
            name: 'unknown',
            programId: instruction.programId.toString(),
            data: instruction.data,
            description: 'Unknown Holders instruction'
        };
    }

    const accounts = instruction.keys.map((key, idx) => {
        const accountMeta = (idx < idlInstruction.accounts.length)
            ? idlInstruction.accounts[idx]
            : { name: `account_${idx}` };

        return {
            name: accountMeta.name,
            pubkey: key.pubkey.toString(),
            isSigner: key.isSigner,
            isWritable: key.isWritable || (accountMeta as any).writable
        };
    });

    return {
        program: 'Holders',
        name: idlInstruction.name,
        programId: instruction.programId.toString(),
        accounts,
        rawArgs: instruction.data.slice(8),
        description: `Holders ${idlInstruction.name} operation`
    };
}

/**
 * Parse System Program instructions (SOL transfers, account creation, etc.)
 */
export function parseSystemInstruction(instruction: TransactionInstruction) {
    if (!instruction.programId.equals(SystemProgram.programId)) {
        return null;
    }

    // The first 4 bytes identify the instruction type in System Program
    const instructionTypeIndex = instruction.data.readUInt32LE(0);

    // System Program Instruction Types
    // https://github.com/solana-labs/solana/blob/master/sdk/program/src/system_instruction.rs
    switch (instructionTypeIndex) {
        // Transfer
        case 2: {
            const amount = instruction.data.readBigUInt64LE(4);
            const fromAccount = instruction.keys[0].pubkey.toString();
            const toAccount = instruction.keys[1].pubkey.toString();

            return {
                program: 'System Program',
                name: 'systemTransfer',
                programId: SYSTEM_PROGRAM_ID,
                accounts: [
                    { name: 'from', pubkey: fromAccount, isSigner: true, isWritable: true },
                    { name: 'to', pubkey: toAccount, isSigner: false, isWritable: true }
                ],
                args: {
                    amount: amount.toString()
                },
                description: `Transfer ${Number(amount) / LAMPORTS_PER_SOL} SOL from ${shortenAddress(fromAccount)} to ${shortenAddress(toAccount)}`
            };
        }

        // CreateAccount
        case 0: {
            const lamports = instruction.data.readBigUInt64LE(4);
            const space = instruction.data.readBigUInt64LE(12);
            const owner = new PublicKey(instruction.data.slice(20, 52));

            return {
                program: 'System Program',
                name: 'createAccount',
                programId: SYSTEM_PROGRAM_ID,
                accounts: [
                    { name: 'from', pubkey: instruction.keys[0].pubkey.toString(), isSigner: true, isWritable: true },
                    { name: 'newAccount', pubkey: instruction.keys[1].pubkey.toString(), isSigner: true, isWritable: true }
                ],
                args: {
                    lamports: lamports.toString(),
                    space: space.toString(),
                    owner: owner.toString()
                },
                description: `Create account with ${Number(lamports) / LAMPORTS_PER_SOL} SOL and ${space} bytes of space`
            };
        }

        // Other system instructions...
        default:
            return {
                program: 'System Program',
                name: `system-instruction-${instructionTypeIndex}`,
                programId: SYSTEM_PROGRAM_ID,
                data: instruction.data,
                description: 'Unknown System Program instruction'
            };
    }
}

/**
 * Parse SPL Token Program instructions
 */
export function parseTokenInstruction(instruction: TransactionInstruction) {
    if (instruction.programId.toString() !== TOKEN_PROGRAM_ID) {
        return null;
    }

    // The first byte indicates the instruction type
    const instructionTypeIndex = instruction.data[0];

    // Token Program Instruction Types
    // https://github.com/solana-labs/solana-program-library/blob/master/token/program/src/instruction.rs
    switch (instructionTypeIndex) {
        // Transfer
        case 3: {
            const amount = instruction.data.slice(1).readBigUInt64LE(0);
            const source = instruction.keys[0].pubkey.toString();
            const destination = instruction.keys[1].pubkey.toString();
            const owner = instruction.keys[2].pubkey.toString();

            return {
                program: 'Token Program',
                name: 'tokenTransfer',
                programId: TOKEN_PROGRAM_ID,
                accounts: [
                    { name: 'source', pubkey: source, isSigner: false, isWritable: true },
                    { name: 'destination', pubkey: destination, isSigner: false, isWritable: true },
                    { name: 'owner', pubkey: owner, isSigner: true, isWritable: false }
                ],
                args: {
                    amount: amount.toString()
                },
                description: `Transfer ${amount} tokens from ${shortenAddress(source)} to ${shortenAddress(destination)}`
            };
        }

        // Other token instructions...
        default:
            return {
                program: 'Token Program',
                name: `instruction-${instructionTypeIndex}`,
                programId: TOKEN_PROGRAM_ID,
                data: instruction.data,
                description: 'Token Program operation'
            };
    }
}

/**
 * Parse Associated Token Program instructions
 */
export function parseAssociatedTokenInstruction(instruction: TransactionInstruction) {
    if (instruction.programId.toString() !== ASSOCIATED_TOKEN_PROGRAM_ID) {
        return null;
    }

    // This program only has one instruction
    const payer = instruction.keys[0].pubkey.toString();
    const associatedToken = instruction.keys[1].pubkey.toString();
    const owner = instruction.keys[2].pubkey.toString();
    const mint = instruction.keys[3].pubkey.toString();

    return {
        program: 'Associated Token Program',
        name: 'createAssociatedTokenAccount',
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        accounts: [
            { name: 'payer', pubkey: payer, isSigner: true, isWritable: true },
            { name: 'associatedToken', pubkey: associatedToken, isSigner: false, isWritable: true },
            { name: 'owner', pubkey: owner, isSigner: false, isWritable: false },
            { name: 'mint', pubkey: mint, isSigner: false, isWritable: false },
            { name: 'systemProgram', pubkey: instruction.keys[4].pubkey.toString(), isSigner: false, isWritable: false },
            { name: 'tokenProgram', pubkey: instruction.keys[5].pubkey.toString(), isSigner: false, isWritable: false },
            { name: 'rentSysvar', pubkey: instruction.keys[6].pubkey.toString(), isSigner: false, isWritable: false }
        ],
        description: `Create associated token account for mint ${shortenAddress(mint)}`
    };
}

/**
 * Main function to parse any Solana instruction
 */
export function parseInstruction(instruction: TransactionInstruction) {
    const programId = instruction.programId.toString();

    // Check for known program IDs
    switch (programId) {
        case holdersIdl.address:
            return parseHoldersInstruction(instruction);
        case SYSTEM_PROGRAM_ID:
            return parseSystemInstruction(instruction);
        case TOKEN_PROGRAM_ID:
            return parseTokenInstruction(instruction);
        case ASSOCIATED_TOKEN_PROGRAM_ID:
            return parseAssociatedTokenInstruction(instruction);
        default:
            // For unknown programs, return basic info
            return {
                name: 'unknown',
                program: 'Unknown Program',
                programId,
                data: instruction.data,
                description: `Unknown instruction for program ${shortenAddress(programId)}`
            };
    }
}

/**
 * Parse all instructions in a transaction
 */
export function parseTransactionInstructions(instructions: TransactionInstruction[]) {
    return instructions.map(instruction =>
        parseInstruction(instruction)
    ).filter(Boolean);
}

export type ParsedTransactionInstruction = ReturnType<typeof parseTransactionInstructions>[number];

/**
 * Helper to shorten addresses for display
 */
function shortenAddress(address: string): string {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
}
