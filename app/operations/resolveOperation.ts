import BN from "bn.js";
import { Address, Cell } from "ton";
import { AppConfig } from "../AppConfig";
import { t } from "../i18n/t";
import { KnownWallet, KnownWallets } from "../secure/KnownWallets";
import { JettonMasterState } from "../sync/jettons/JettonMasterSync";
import { ContractMetadata } from "../sync/metadata/Metadata";
import { parseBody } from "../sync/parse/parseWalletTransaction";
import { Transaction } from "../sync/Transaction";
import { formatSupportedBody } from "./formatSupportedBody";
import { parseMessageBody } from "./parseMessageBody";
import { Operation, OperationItem } from "./types";

export function resolveOperation(args: {
    account: Address,
    tx: Transaction,
    metadata: ContractMetadata | null,
    jettonMaster: JettonMasterState | null
}): Operation {

    // Resolve transaction kind
    let kind: 'out' | 'in' = args.tx.kind;

    // Resolve default address
    let address: Address = args.tx.address || args.account;

    // Resolve known
    let known: KnownWallet | undefined = undefined;

    // Avatar image
    let image: string | undefined = undefined;

    // Comment
    let comment: string | undefined = undefined;
    if (args.tx.body && args.tx.body.type === 'comment') {
        comment = args.tx.body.comment;
    }

    // Resolve default name
    let name: string;
    if (args.tx.kind === 'out') {
        if (args.tx.status === 'pending') {
            name = t('tx.sending');
        } else {
            name = t('tx.sent');
        }
    } else if (args.tx.kind === 'in') {
        if (args.tx.bounced) {
            name = '⚠️ ' + t('tx.bounced');
        } else {
            name = t('tx.received');
        }
    } else {
        throw Error('Unknown kind');
    }

    // Resolve default items
    let items: OperationItem[] = [];
    items.push({ kind: 'ton', amount: args.tx.amount });

    // Simple payload overwrite
    if (args.tx.body && args.tx.body.type === 'payload' && args.metadata && !args.jettonMaster) {
        let parsedBody = parseMessageBody(args.tx.body.cell, args.metadata.interfaces);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                name = f.text;
            }
        }
    }

    // Jetton payloads
    if (args.tx.body && args.tx.body.type === 'payload' && args.jettonMaster && args.jettonMaster.symbol && args.metadata && args.metadata.jettonWallet) {
        let parsedBody = parseMessageBody(args.tx.body.cell, ['311736387032003861293477945447179662681']);
        if (parsedBody) {
            let f = formatSupportedBody(parsedBody);
            if (f) {
                name = f.text;
            }
            if (parsedBody.type === 'jetton::transfer') {
                address = parsedBody.data['destination'] as Address;
                let amount = parsedBody.data['amount'] as BN;
                let symbol = args.jettonMaster.symbol;
                items.unshift({ kind: 'token', amount, symbol });
                let body = parseBody(parsedBody.data['payload'] as Cell);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
            } else if (parsedBody.type === 'jetton::transfer_notification') {
                address = parsedBody.data['sender'] as Address;
                let amount = parsedBody.data['amount'] as BN;
                let symbol = args.jettonMaster.symbol;
                items.unshift({ kind: 'token', amount, symbol });
                let body = parseBody(parsedBody.data['payload'] as Cell);
                if (body && body.type === 'comment') {
                    comment = body.comment;
                }
            } else {
                if (args.jettonMaster && args.jettonMaster.image) {
                    image = args.jettonMaster.image;
                }
            }
        } else {
            if (args.jettonMaster && args.jettonMaster.image) {
                image = args.jettonMaster.image;
            }
        }
    }

    // Resolve jetton name
    if (args.metadata && args.metadata.jettonMaster && args.jettonMaster && args.jettonMaster.name) {
        known = { name: args.jettonMaster.name };
        if (args.jettonMaster.image) {
            image = args.jettonMaster.image;
        }
    }

    // Resolve built-in known wallets
    let friendlyAddress = address.toFriendly({ testOnly: AppConfig.isTestnet });
    if (KnownWallets[friendlyAddress]) {
        known = KnownWallets[friendlyAddress];
    }

    return {
        kind,
        address,
        known,
        name,
        items,
        image,
        comment
    }
}