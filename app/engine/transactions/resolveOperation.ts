import BN from "bn.js";
import { Address, Cell } from "@ton/core";
import { formatSupportedBody } from "./formatSupportedBody";
import { parseMessageBody } from "./parseMessageBody";
import { parseBody } from './parseWalletTransaction';
import { TxBody } from '../legacy/Transaction';
import { StoredOperation, StoredOperationItem } from '../hooks/useRawAccountTransactions';

export function resolveOperation(args: {
    account: Address,
    amount: bigint,
    body: TxBody | null,
}, isTestnet: boolean): StoredOperation {

    // Resolve default address
    let address: Address = args.account;

    // Comment
    let comment: string | undefined = undefined;
    if (args.body && args.body.type === 'comment') {
        comment = args.body.comment;
    }

    // Resolve default name
    // let op: string | undefined = undefined;

    // Resolve default name
    // let title: string | undefined = undefined;

    // Resolve default items
    let items: StoredOperationItem[] = [];
    items.push({ kind: 'ton', amount: args.amount.toString(10) });

    // Simple payload overwrite
    if (args.body && args.body.type === 'payload') {
        let parsedBody = parseMessageBody(args.body.cell);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                // op = f.text;
            }

            if (parsedBody.type === 'jetton::transfer') {
                address = parsedBody.data['destination'] as Address;
                let amount = parsedBody.data['amount'] as BN;
                items.unshift({ kind: 'token', amount: amount.toString(10) });
                let body = parseBody(parsedBody.data['payload'] as Cell);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
                // op = t('tx.tokenTransfer');
            } else if (parsedBody.type === 'jetton::transfer_notification') {
                if (parsedBody.data['sender']) {
                    address = parsedBody.data['sender'] as Address;
                } else {
                    // op = 'airdrop';
                }
                let amount = parsedBody.data['amount'] as BN;
                items.unshift({ kind: 'token', amount: amount.toString(10) });
                let body = parseBody(parsedBody.data['payload'] as Cell);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
            }
        }
    }


    return {
        address: address.toString({ testOnly: isTestnet }),
        items,
        comment
    }
}