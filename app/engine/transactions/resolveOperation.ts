import BN from "bn.js";
import { Address, Cell } from "ton";
import { JettonMasterState } from "../../engine/sync/startJettonMasterSync";
import { ContractMetadata } from "../../engine/metadata/Metadata";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { Body, Transaction } from "../../engine/Transaction";
import { formatSupportedBody } from "./formatSupportedBody";
import { parseMessageBody } from "../../engine/transactions/parseMessageBody";
import { Operation, OperationItem } from "./types";
import { t } from "../../i18n/t";

export function resolveOperation(args: {
    account: Address,
    amount: BN,
    body: Body | null,
    metadata: ContractMetadata | null,
    jettonMaster: JettonMasterState | null
}): Operation {

    // Resolve default address
    let address: Address = args.account;

    // Avatar image
    let image: string | undefined = undefined;

    // Comment
    let comment: string | undefined = undefined;
    if (args.body && args.body.type === 'comment') {
        comment = args.body.comment;
    }

    // Resolve default name
    let op: string | undefined = undefined;

    // Resolve default name
    let title: string | undefined = undefined;

    // Resolve default items
    let items: OperationItem[] = [];
    items.push({ kind: 'ton', amount: args.amount });

    // Simple payload overwrite
    if (args.body && args.body.type === 'payload' && args.metadata && !args.jettonMaster) {
        let parsedBody = parseMessageBody(args.body.cell, args.metadata.interfaces);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                op = f.text;
            }
        }
    }

    // Jetton payloads
    if (args.body && args.body.type === 'payload' && args.jettonMaster && args.jettonMaster.symbol && args.metadata && args.metadata.jettonWallet) {
        let parsedBody = parseMessageBody(args.body.cell, ['311736387032003861293477945447179662681']);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                op = f.text;
            }
            if (parsedBody.type === 'jetton::transfer') {
                address = parsedBody.data['destination'] as Address;
                let amount = parsedBody.data['amount'] as BN;
                let symbol = args.jettonMaster.symbol;
                let decimals = args.jettonMaster.decimals;
                items.unshift({ kind: 'token', amount, symbol, decimals });
                let body = parseBody(parsedBody.data['payload'] as Cell);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
                op = t('tx.tokenTransfer');
            } else if (parsedBody.type === 'jetton::transfer_notification') {
                address = parsedBody.data['sender'] as Address;
                let amount = parsedBody.data['amount'] as BN;
                let symbol = args.jettonMaster.symbol;
                let decimals = args.jettonMaster.decimals;
                items.unshift({ kind: 'token', amount, symbol, decimals });
                let body = parseBody(parsedBody.data['payload'] as Cell);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
            } else {
                if (args.jettonMaster && args.jettonMaster.image) {
                    image = args.jettonMaster.image.preview256;
                }
            }
            if (!address) {
                address = args.account;
                op = 'airdrop';
            }
        } else {
            if (args.jettonMaster && args.jettonMaster.image) {
                image = args.jettonMaster.image.preview256;
            }
        }
    }

    // Resolve jetton name
    if (args.metadata && args.metadata.jettonMaster && args.jettonMaster && args.jettonMaster.name) {
        title = args.jettonMaster.name;
        if (args.jettonMaster.image) {
            image = args.jettonMaster.image.preview256;
        }
    }


    return {
        address,
        title,
        op,
        items,
        image,
        comment
    }
}