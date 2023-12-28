import { Address } from "@ton/core";
import { formatSupportedBody } from "./formatSupportedBody";
import { parseMessageBody } from "./parseMessageBody";
import { parseBody } from './parseWalletTransaction';
import { LocalizedResources } from "../../i18n/schema";
import { StoredOperation, StoredOperationItem, TxBody } from '../types';

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

    // Resolve default op
    let op: { res: LocalizedResources, options?: any } | undefined = undefined;

    // Resolve default items
    let items: StoredOperationItem[] = [];
    items.push({ kind: 'ton', amount: args.amount.toString(10) });

    // Simple payload overwrite
    if (args.body && args.body.type === 'payload') {
        let parsedBody = parseMessageBody(args.body.cell);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                op = f;
            }

            if (parsedBody.type === 'jetton::transfer') {
                address = parsedBody.data.destination;
                let amount = parsedBody.data.amount;
                items.unshift({ kind: 'token', amount: amount.toString(10) });
                let body = parseBody(parsedBody.data.forwardPayload);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
                op = { res: 'tx.tokenTransfer' };
            } else if (parsedBody.type === 'jetton::transfer_notification') {
                if (parsedBody.data['sender']) {
                    address = parsedBody.data.sender;
                } else {
                    op = { res: 'common.airdrop' };
                }
                let amount = parsedBody.data.amount;
                items.unshift({ kind: 'token', amount: amount.toString(10) });
                if (!!parsedBody.data.forwardPayload) {
                    let body = parseBody(parsedBody.data.forwardPayload);
                    if (body && body.type === 'comment') {
                        comment = body.comment;
                    }
                }
            }
        }
    }


    return {
        address: address.toString({ testOnly: isTestnet }),
        items,
        comment,
        op
    }
}