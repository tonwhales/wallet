import { TransferRequestURL, TransactionRequestURL } from '@solana/pay';
import { z } from 'zod';
import axios from 'axios';
import { SolanaOrderApp } from '../../fragments/secure/ops/Order';
import { solanaAddressFromPublicKey } from '../solana/address';
import { Transaction } from '@solana/web3.js';
import { extractDomain } from '../../engine/utils/extractDomain';
import { TypedNavigation } from '../useTypedNavigation';
import { SelectedAccount } from '../../engine/types';

const solanaAppDataShema = z.object({
    label: z.string(),
    icon: z.string()
});

const solanaTransactionSchema = z.object({
    transaction: z.string(),
    message: z.string()
});

async function resolveTransactionRequestURL(request: TransactionRequestURL, navigation: TypedNavigation, selected: SelectedAccount) {
    const link = request.link;
    const getRes = await axios.get(link.toString());

    const data = getRes.data;
    const parsed = solanaAppDataShema.safeParse(data);

    let solanaAppData: SolanaOrderApp | undefined;

    if (parsed.success) {
        let domain: string | undefined;
        try {
            domain = extractDomain(link.toString());
        } catch { }

        solanaAppData = {
            label: parsed.data.label,
            image: parsed.data.icon,
            domain
        };
    }

    const solanaAddress = solanaAddressFromPublicKey(selected.publicKey);
    const postRes = await axios.post(link.toString(), {
        account: solanaAddress.toString()
    });

    const postData = postRes.data;
    const postParsed = solanaTransactionSchema.safeParse(postData);

    if (postParsed.success) {
        if (solanaAppData) {
            solanaAppData.message = postParsed.data.message;
        }
        try {
            const transaction = postParsed.data.transaction;
            Transaction.from(Buffer.from(transaction, 'base64'));
            navigation.navigateSolanaTransfer({
                type: 'transaction',
                transaction,
                app: solanaAppData
            });
        } catch { }
    }
}

export async function resolveAndNavigateToSolanaTransfer(params: {
    selected: SelectedAccount | null,
    navigation: TypedNavigation,
    isTestnet: boolean,
    request: TransactionRequestURL | TransferRequestURL
}) {
    const { selected, navigation, request } = params;

    if (!!(request as unknown as any).link) {
        const transaction = request as TransactionRequestURL;
        if (selected) {
            resolveTransactionRequestURL(transaction, navigation, selected);
        }
    } else {
        const transfer = request as TransferRequestURL;
        navigation.navigateSolanaTransfer({
            type: 'order',
            order: {
                type: 'solana',
                target: transfer.recipient.toString(),
                comment: transfer.memo ?? null,
                amount: BigInt(transfer.amount?.toString() ?? '0'),
                token: transfer.splToken ? { mint: transfer.splToken.toString() } : null,
                reference: transfer.reference,
                app: {
                    label: transfer.label,
                    message: transfer.message
                }
            },
        });
    }
}